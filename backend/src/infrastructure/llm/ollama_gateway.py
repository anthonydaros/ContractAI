"""
Ollama LLM Gateway.

This module provides an interface to Ollama LLM servers using the
OpenAI-compatible API. It handles contract analysis, text generation,
embeddings, and structured data extraction.

@module infrastructure/llm/ollama_gateway
"""
import os
import json
import re
import logging
import threading
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv, find_dotenv
from openai import OpenAI

from ...domain.interfaces.llm_gateway import ILLMGateway

# Load environment variables from root .env (searches parent directories)
load_dotenv(find_dotenv(usecwd=True))

# Configure module logger
logger = logging.getLogger(__name__)

# Thread-safe lock for singleton initialization
_gateway_lock = threading.Lock()


class OllamaGateway(ILLMGateway):
    """
    Gateway for Ollama server using OpenAI-compatible API.

    This class provides methods for interacting with Ollama LLM servers,
    including text generation, contract analysis, embeddings, and
    structured data extraction.

    Attributes:
        base_url: The Ollama server base URL.
        api_key: API key for authentication (if required).
        model: The model name to use for generation.
        temperature: Sampling temperature for generation.
        client: OpenAI client configured for Ollama.

    Example:
        >>> gateway = OllamaGateway()
        >>> result = await gateway.analyze_contract("Contract text...")
        >>> print(result["overall_risk"])
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.3
    ) -> None:
        """
        Initialize the Ollama gateway.

        Args:
            base_url: Ollama server URL. Defaults to OLLAMA_BASE_URL env var
                     or http://localhost:11434.
            api_key: API key for authentication. Defaults to OLLAMA_API_KEY env var.
            model: Model name. Defaults to OLLAMA_MODEL env var or llama3.1:8b.
            temperature: Sampling temperature (0.0-1.0). Lower = more deterministic.
        """
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.api_key = api_key or os.getenv("OLLAMA_API_KEY", "")
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        self.temperature = temperature

        logger.info(f"Initializing OllamaGateway with base_url={self.base_url}, model={self.model}")

        # Initialize OpenAI client with Ollama endpoint
        # Ollama via Open WebUI uses /api instead of /v1
        self.client = OpenAI(
            base_url=f"{self.base_url}/api",
            api_key=self.api_key if self.api_key else "ollama",  # Ollama accepts any key
        )

    async def generate_text(
        self,
        prompt: str,
        system: Optional[str] = None
    ) -> str:
        """
        Generate text completion using the chat API.

        Args:
            prompt: The user prompt to generate a response for.
            system: Optional system message to set context.

        Returns:
            Generated text response from the model.

        Raises:
            RuntimeError: If LLM generation fails.

        Example:
            >>> response = await gateway.generate_text(
            ...     "Summarize this contract",
            ...     system="You are a legal expert"
            ... )
        """
        messages: List[Dict[str, str]] = []

        if system:
            messages.append({"role": "system", "content": system})

        messages.append({"role": "user", "content": prompt})

        try:
            logger.debug(f"Generating text with model={self.model}, prompt_length={len(prompt)}")

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=4096,
            )

            result = response.choices[0].message.content or ""
            logger.debug(f"Generated text, response_length={len(result)}")
            return result

        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}", exc_info=True)
            raise RuntimeError(f"LLM generation failed: {str(e)}")

    async def analyze_contract(self, contract_text: str) -> Dict[str, Any]:
        """
        Analyze a contract and extract clause-by-clause analysis.

        Performs comprehensive AI analysis of a contract, identifying
        individual clauses, assessing risk levels, and providing
        recommendations.

        Args:
            contract_text: The full text of the contract to analyze.

        Returns:
            Dict containing:
                - contract_type: Type of contract (e.g., "Rental Agreement")
                - overall_risk: Overall risk level (low/medium/high/critical)
                - summary: Executive summary of the analysis
                - clauses: List of clause analyses with risk levels
                - total_issues: Count of problematic clauses
                - recommendation: SIGN, NEGOTIATE, or DO_NOT_SIGN

        Raises:
            RuntimeError: If contract analysis fails.

        Example:
            >>> result = await gateway.analyze_contract(contract_text)
            >>> if result["recommendation"] == "DO_NOT_SIGN":
            ...     print("High risk contract!")
        """
        logger.info(f"Analyzing contract, length={len(contract_text)}")

        system_prompt = """You are an expert legal analyst specializing in contract review.
Your task is to analyze contracts and identify:
1. Individual clauses and their topics
2. Risk level for each clause (low, medium, high, critical)
3. Explanation of any risks found
4. Relevant legal references
5. Suggested rewrites for problematic clauses

Always respond in valid JSON format."""

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
- Keep explanations clear and concise"""

        try:
            response = await self.generate_text(analysis_prompt, system_prompt)

            # Parse JSON from response, handling markdown code blocks
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
            # Return a structured error response
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
        Generate embeddings for text.

        Creates a vector representation of the input text using
        the configured embedding model.

        Args:
            text: The text to generate embeddings for.

        Returns:
            List of floats representing the text embedding.

        Raises:
            RuntimeError: If embedding generation fails.

        Example:
            >>> embedding = await gateway.get_embeddings("Contract clause text")
            >>> print(f"Embedding dimension: {len(embedding)}")
        """
        embedding_model = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")

        try:
            logger.debug(f"Generating embeddings with model={embedding_model}")

            response = self.client.embeddings.create(
                model=embedding_model,
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

        Uses the LLM to extract specific fields from unstructured text
        according to the provided JSON schema.

        Args:
            text: The text to extract data from.
            schema: JSON schema defining the structure to extract.

        Returns:
            Dict containing extracted data matching the schema.
            Returns empty dict if extraction fails.

        Example:
            >>> schema = {"parties": ["string"], "effective_date": "string"}
            >>> data = await gateway.extract_structured_data(text, schema)
            >>> print(data["parties"])
        """
        # Limit text to avoid token limits
        truncated_text = text[:3000]

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

        Parses the contract text to identify and separate individual
        clauses with their titles and content.

        Args:
            text: The full contract text to parse.

        Returns:
            List of dicts, each containing:
                - title: Clause title or number
                - content: Full text of the clause

        Example:
            >>> clauses = await gateway.extract_clauses(contract_text)
            >>> for clause in clauses:
            ...     print(f"{clause['title']}: {clause['content'][:50]}...")
        """
        prompt = f"""Extract all clauses from this contract text.
Return a JSON array where each item has:
- "title": clause title or number
- "content": the full text of the clause

CONTRACT:
{text}

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
            # Fallback: split by common patterns
            return self._fallback_clause_extraction(text)

    def _extract_json(self, response: str) -> str:
        """
        Extract JSON from a response that may contain markdown code blocks.

        Handles multiple formats:
        - Pure JSON response
        - JSON wrapped in ```json ... ``` code blocks
        - JSON wrapped in ``` ... ``` code blocks
        - JSON embedded in text (finds first { or [ and matches to closing brace)

        Args:
            response: Raw LLM response text.

        Returns:
            Cleaned JSON string.

        Raises:
            ValueError: If no valid JSON structure is found.
        """
        json_str = response.strip()

        # Try to extract from markdown code blocks first
        if "```json" in json_str:
            # Extract content between ```json and ```
            match = re.search(r"```json\s*([\s\S]*?)\s*```", json_str)
            if match:
                json_str = match.group(1)
                logger.debug("Extracted JSON from ```json code block")
        elif "```" in json_str:
            # Extract content between ``` and ```
            match = re.search(r"```\s*([\s\S]*?)\s*```", json_str)
            if match:
                json_str = match.group(1)
                logger.debug("Extracted JSON from ``` code block")

        json_str = json_str.strip()

        # If no code block found, try to find JSON object or array in text
        if not json_str.startswith(("{", "[")):
            # Find first { or [ and match to its closing brace/bracket
            obj_match = re.search(r"(\{[\s\S]*\})", json_str)
            arr_match = re.search(r"(\[[\s\S]*\])", json_str)

            if obj_match and arr_match:
                # Use whichever appears first
                if json_str.find("{") < json_str.find("["):
                    json_str = obj_match.group(1)
                else:
                    json_str = arr_match.group(1)
                logger.debug("Extracted JSON from embedded text")
            elif obj_match:
                json_str = obj_match.group(1)
                logger.debug("Extracted JSON object from text")
            elif arr_match:
                json_str = arr_match.group(1)
                logger.debug("Extracted JSON array from text")
            else:
                logger.warning("No JSON structure found in response")
                raise ValueError("No JSON structure found in response")

        return json_str.strip()

    def _fallback_clause_extraction(self, text: str) -> List[Dict[str, str]]:
        """
        Fallback clause extraction using regex patterns.

        Used when LLM extraction fails.

        Args:
            text: Contract text to parse.

        Returns:
            List of extracted clauses.
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
            logger.debug(f"Fallback extraction found {len(clauses)} clauses")
            return clauses

        # If no clauses found, return full contract as single entry
        logger.debug("No clauses found, returning full contract")
        return [{"title": "Full Contract", "content": text}]


# Singleton instance with thread-safe initialization
_gateway_instance: Optional[OllamaGateway] = None


def get_llm_gateway() -> OllamaGateway:
    """
    Get or create the LLM gateway singleton.

    Thread-safe factory function that ensures only one gateway
    instance is created throughout the application lifecycle.

    Returns:
        The singleton OllamaGateway instance.

    Example:
        >>> gateway = get_llm_gateway()
        >>> result = await gateway.analyze_contract(text)
    """
    global _gateway_instance

    # Double-checked locking pattern for thread safety
    if _gateway_instance is None:
        with _gateway_lock:
            # Check again inside lock
            if _gateway_instance is None:
                logger.info("Creating new OllamaGateway singleton instance")
                _gateway_instance = OllamaGateway()

    return _gateway_instance
