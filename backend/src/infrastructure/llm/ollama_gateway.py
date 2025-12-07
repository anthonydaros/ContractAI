"""
Multi-Provider LLM Gateway.

This module provides an interface to LLM providers (OpenRouter, Gemini) using the
OpenAI-compatible API. It handles contract analysis, text generation,
embeddings, and structured data extraction with fallback logic.

@module infrastructure/llm/ollama_gateway
"""
import os
import json
import re
import logging
import threading
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv, find_dotenv
from openai import OpenAI, APITimeoutError, RateLimitError, APIError

from ...domain.interfaces.llm_gateway import ILLMGateway

# Load environment variables from root .env (searches parent directories)
load_dotenv(find_dotenv(usecwd=True))

# Configure module logger
logger = logging.getLogger(__name__)

# Thread-safe lock for singleton initialization
_gateway_lock = threading.Lock()


class OllamaGateway(ILLMGateway):
    """
    Gateway for LLM providers (OpenRouter, Gemini) using OpenAI-compatible API.
    
    This class supports a primary provider (OpenRouter) and multiple fallback
    providers (Gemini with different keys) to handle rate limits and availability.

    Attributes:
        clients: List of configured OpenAI clients (primary + fallbacks).
        models: List of model names corresponding to each client.
        embedding_client: Client dedicated to embeddings.
        embedding_model: Model name for embeddings.
    """

    def __init__(self) -> None:
        """
        Initialize the Multi-Provider gateway.
        """
        self.temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.3"))
        self.max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "4096"))
        self.timeout = int(os.getenv("OPENAI_TIMEOUT", "120"))
        
        # --- Primary Provider: OpenRouter ---
        openrouter_base_url = os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")
        openrouter_api_key = os.getenv("OPENAI_API_KEY", "")
        openrouter_model = os.getenv("OPENAI_MODEL", "openai/gpt-3.5-turbo")
        openrouter_app_name = os.getenv("OPENROUTER_APP_NAME", "Contract AI")
        
        # --- Fallback Provider: Gemini ---
        gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        gemini_api_key_1 = os.getenv("GEMINI_API_KEY", "")
        gemini_api_key_2 = os.getenv("GEMINI_API_KEY_FALLBACK", "")
        # Google Gemini OpenAI compatible endpoint
        gemini_base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"

        self.clients = []
        self.models = []
        self.provider_names = []

        # 1. Primary: OpenRouter
        if openrouter_api_key:
            logger.info(f"Configuring Primary Provider: OpenRouter (model={openrouter_model})")
            client = OpenAI(
                base_url=openrouter_base_url,
                api_key=openrouter_api_key,
                timeout=self.timeout,
                default_headers={
                    "HTTP-Referer": "https://github.com/anthonydaros/ContractAI",
                    "X-Title": openrouter_app_name,
                }
            )
            self.clients.append(client)
            self.models.append(openrouter_model)
            self.provider_names.append("OpenRouter")

        # 2. Fallback 1: Gemini (Key 1)
        if gemini_api_key_1:
            logger.info(f"Configuring Fallback 1: Gemini (model={gemini_model})")
            client = OpenAI(
                base_url=gemini_base_url,
                api_key=gemini_api_key_1,
                timeout=self.timeout
            )
            self.clients.append(client)
            self.models.append(gemini_model)
            self.provider_names.append("Gemini-1")

        # 3. Fallback 2: Gemini (Key 2)
        if gemini_api_key_2:
            logger.info(f"Configuring Fallback 2: Gemini (model={gemini_model})")
            client = OpenAI(
                base_url=gemini_base_url,
                api_key=gemini_api_key_2,
                timeout=self.timeout
            )
            self.clients.append(client)
            self.models.append(gemini_model)
            self.provider_names.append("Gemini-2")

        if not self.clients:
            logger.warning("No LLM providers configured! Check your .env file.")
        
        # Embedding config (Use Primary/OpenRouter)
        self.embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        # Use OpenRouter client for embeddings if available, otherwise just use the first available
        self.embedding_client = self.clients[0] if self.clients else None


    async def generate_text(
        self,
        prompt: str,
        system: Optional[str] = None
    ) -> str:
        """
        Generate text completion with fallback logic.
        """
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        last_error = None

        for i, client in enumerate(self.clients):
            model = self.models[i]
            provider = self.provider_names[i]
            
            try:
                logger.debug(f"Attempting generation with {provider} (model={model})")
                
                # Note: OpenAI client here is synchronous. For high concurrency, 
                # we should use AsyncOpenAI, but keeping it simple for now as per minimal refactor.
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                )

                result = response.choices[0].message.content or ""
                if not result.strip():
                     raise ValueError("Received empty response from provider")

                logger.info(f"Successfully generated text with {provider}, length={len(result)}")
                return result

            except (RateLimitError, APITimeoutError, APIError, ValueError) as e:
                logger.warning(f"Provider {provider} failed: {str(e)}. Trying next fallback...")
                last_error = e
                continue
            except Exception as e:
                logger.error(f"Unexpected error with {provider}: {str(e)}")
                last_error = e
                # Depending on severity, we might want to continue or stop. 
                # For now, let's try next provider.
                continue

        # If we get here, all providers failed
        error_msg = f"All LLM providers failed. Last error: {str(last_error)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    async def analyze_contract(self, contract_text: str) -> Dict[str, Any]:
        """
        Analyze a contract and extract clause-by-clause analysis.
        """
        logger.info(f"Analyzing contract, length={len(contract_text)}")

        system_prompt = """You are an expert legal analyst specializing in contract review.
Your task is to analyze contracts and identify:
1. Individual clauses and their topics
2. Risk level for each clause (low, medium, high, critical)
3. Explanation of any risks found
4. Relevant legal references
5. Suggested rewrites for problematic clauses

Always respond in valid JSON format only, without markdown code blocks."""

        analysis_prompt = f"""Analyze the following contract and provide a detailed clause-by-clause analysis.

CONTRACT TEXT:
{contract_text}

Respond with a JSON object in this exact format:
{{
    "contract_type": "type of contract (e.g., Rental Agreement, NDA, Service Contract)",
    "overall_risk": "low|medium|high|critical",
    "summary": "2-3 sentence executive summary of the contract's overall quality",
    "clauses": [
        {{
            "clause_id": "CLAUSE 1",
            "original_text": "the exact text of the clause",
            "topic": "topic category (e.g., rent_adjustment, termination, liability)",
            "risk_level": "low|medium|high|critical",
            "risk_explanation": "detailed explanation of any risks",
            "law_reference": "relevant law or regulation if applicable, or null",
            "suggested_rewrite": "improved version of the clause if needed"
        }}
    ],
    "total_issues": number_of_problematic_clauses,
    "recommendation": "SIGN|NEGOTIATE|DO_NOT_SIGN"
}}

Important:
- Identify ALL clauses in the contract
- Be thorough in risk assessment
- Provide actionable suggested rewrites for high/critical risk clauses
- Keep explanations clear and concise
"""

        try:
            response = await self.generate_text(analysis_prompt, system_prompt)

            # Parse JSON from response
            json_str = self._extract_json(response)
            result = json.loads(json_str)

            logger.info(
                f"Contract analysis complete: "
                f"type={result.get('contract_type')}, "
                f"risk={result.get('overall_risk')}, "
                f"clauses={len(result.get('clauses', []))}"
            )
            return result

        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"JSON parsing error in contract analysis: {str(e)}")
            return {
                "contract_type": "Unknown",
                "overall_risk": "medium",
                "summary": "Unable to fully parse contract. Manual review recommended.",
                "clauses": [],
                "total_issues": 0,
                "recommendation": "NEGOTIATE",
                "error": f"JSON parsing error: {str(e)}"
            }

        except Exception as e:
            logger.error(f"Contract analysis failed: {str(e)}", exc_info=True)
            raise RuntimeError(f"Contract analysis failed: {str(e)}")

    async def get_embeddings(self, text: str) -> List[float]:
        """
        Generate embeddings for text using the primary provider.
        """
        if not self.embedding_client:
             raise RuntimeError("No embedding client configured.")

        try:
            logger.debug(f"Generating embeddings with model={self.embedding_model}")

            response = self.embedding_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )

            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding, dimension={len(embedding)}")
            return embedding

        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}", exc_info=True)
            raise RuntimeError(f"Embedding generation failed: {str(e)}")

    async def extract_structured_data(
        self,
        text: str,
        schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract structured data from text based on a schema.
        """
        # Limit text to avoid token limits
        truncated_text = text[:8000] # Increased limit for larger models

        prompt = f"""Extract the following information from the text.
Return ONLY valid JSON matching this schema:
{json.dumps(schema, indent=2)}

TEXT:
{truncated_text}...
"""

        try:
            logger.debug(f"Extracting structured data, schema_keys={list(schema.keys())}")

            response = await self.generate_text(prompt)
            json_str = self._extract_json(response)
            result = json.loads(json_str)

            logger.debug(f"Extracted structured data: {list(result.keys())}")
            return result

        except Exception as e:
            logger.warning(f"Structured data extraction failed: {str(e)}")
            return {}

    async def extract_clauses(self, text: str) -> List[Dict[str, str]]:
        """
        Extract individual clauses from contract text.
        """
        prompt = f"""Extract all clauses from this contract text.
Return a JSON array where each item has:
- "title": clause title or number
- "content": the full text of the clause

CONTRACT:
{text[:12000]}

Return ONLY the JSON array, no other text."""

        try:
            logger.debug("Extracting clauses from contract")

            response = await self.generate_text(prompt)
            json_str = self._extract_json(response)
            clauses = json.loads(json_str)

            logger.info(f"Extracted {len(clauses)} clauses")
            return clauses

        except Exception as e:
            logger.warning(f"LLM clause extraction failed, using fallback: {str(e)}")
            return self._fallback_clause_extraction(text)

    def _extract_json(self, response: str) -> str:
        """
        Extract JSON from a response that may contain markdown code blocks.
        """
        json_str = response.strip()

        # Try to extract from markdown code blocks first
        if "```json" in json_str:
            match = re.search(r"```json\s*([\s\S]*?)\s*```", json_str)
            if match:
                json_str = match.group(1)
        elif "```" in json_str:
            match = re.search(r"```\s*([\s\S]*?)\s*```", json_str)
            if match:
                json_str = match.group(1)

        json_str = json_str.strip()

        # If no code block found, try to find JSON object or array in text
        if not json_str.startswith(("{", "[")):
            obj_match = re.search(r"(\{[\s\S]*\})", json_str)
            arr_match = re.search(r"(\[[\s\S]*\])", json_str)

            if obj_match and arr_match:
                if json_str.find("{") < json_str.find("["):
                    json_str = obj_match.group(1)
                else:
                    json_str = arr_match.group(1)
            elif obj_match:
                json_str = obj_match.group(1)
            elif arr_match:
                json_str = arr_match.group(1)
            else:
                # If it looks like JSON but just has some noise, try cleaning
                pass 

        return json_str.strip()

    def _fallback_clause_extraction(self, text: str) -> List[Dict[str, str]]:
        """
        Fallback clause extraction using regex patterns.
        """
        clauses: List[Dict[str, str]] = []
        parts = re.split(r'(CLAUSE \d+|SECTION \d+|\d+\)|\d+\.)', text)

        current_title = ""
        for part in parts:
            if re.match(r'(CLAUSE \d+|SECTION \d+|\d+\)|\d+\.)', part):
                current_title = part.strip()
            elif current_title and part.strip():
                clauses.append({
                    "title": current_title,
                    "content": part.strip()
                })
                current_title = ""

        if clauses:
            return clauses

        return [{"title": "Full Contract", "content": text}]


# Singleton instance with thread-safe initialization
_gateway_instance: Optional[OllamaGateway] = None


def get_llm_gateway() -> OllamaGateway:
    """
    Get or create the LLM gateway singleton.
    """
    global _gateway_instance

    if _gateway_instance is None:
        with _gateway_lock:
            if _gateway_instance is None:
                logger.info("Creating new Multi-Provider LLM Gateway singleton instance")
                _gateway_instance = OllamaGateway()

    return _gateway_instance
