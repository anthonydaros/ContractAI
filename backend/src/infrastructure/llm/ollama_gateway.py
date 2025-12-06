import os
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from openai import OpenAI
from ...domain.interfaces.llm_gateway import ILLMGateway

load_dotenv()

class OllamaGateway(ILLMGateway):
    """Gateway for Ollama server using OpenAI-compatible API."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.3
    ):
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.api_key = api_key or os.getenv("OLLAMA_API_KEY", "")
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        self.temperature = temperature

        # Initialize OpenAI client with Ollama endpoint
        # Ollama via Open WebUI uses /api instead of /v1
        self.client = OpenAI(
            base_url=f"{self.base_url}/api",
            api_key=self.api_key if self.api_key else "ollama",  # Ollama accepts any key
        )

    async def generate_text(self, prompt: str, system: Optional[str] = None) -> str:
        """Generate text completion using chat API."""
        messages = []

        if system:
            messages.append({"role": "system", "content": system})

        messages.append({"role": "user", "content": prompt})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=4096,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            raise RuntimeError(f"LLM generation failed: {str(e)}")

    async def analyze_contract(self, contract_text: str) -> Dict[str, Any]:
        """Analyze a contract and extract clause-by-clause analysis."""

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

            # Try to parse JSON from response
            # Handle case where response might have markdown code blocks
            json_str = response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]

            return json.loads(json_str.strip())

        except json.JSONDecodeError as e:
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
            raise RuntimeError(f"Contract analysis failed: {str(e)}")

    async def get_embeddings(self, text: str) -> List[float]:
        """Generate embeddings for text."""
        embedding_model = os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")

        try:
            response = self.client.embeddings.create(
                model=embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            raise RuntimeError(f"Embedding generation failed: {str(e)}")

    async def extract_structured_data(self, text: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured data from text based on schema."""
        prompt = f"""Extract the following information from the text.
Return ONLY valid JSON matching this schema:
{json.dumps(schema, indent=2)}

TEXT:
{text[:3000]}...
"""
        try:
            response = await self.generate_text(prompt)
            json_str = response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]
            return json.loads(json_str.strip())
        except Exception:
            return {}

    async def extract_clauses(self, text: str) -> List[Dict[str, str]]:
        """Extract individual clauses from contract text."""

        prompt = f"""Extract all clauses from this contract text.
Return a JSON array where each item has:
- "title": clause title or number
- "content": the full text of the clause

CONTRACT:
{text}

Return ONLY the JSON array, no other text."""

        try:
            response = await self.generate_text(prompt)

            # Parse JSON
            json_str = response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]

            return json.loads(json_str.strip())
        except Exception:
            # Fallback: split by common patterns
            clauses = []
            import re
            parts = re.split(r'(CLAUSE \d+|SECTION \d+|\d+\)|\d+\.)', text)

            current_title = ""
            for i, part in enumerate(parts):
                if re.match(r'(CLAUSE \d+|SECTION \d+|\d+\)|\d+\.)', part):
                    current_title = part.strip()
                elif current_title and part.strip():
                    clauses.append({
                        "title": current_title,
                        "content": part.strip()
                    })
                    current_title = ""

            return clauses if clauses else [{"title": "Full Contract", "content": text}]


# Singleton instance
_gateway_instance: Optional[OllamaGateway] = None

def get_llm_gateway() -> OllamaGateway:
    """Get or create the LLM gateway singleton."""
    global _gateway_instance
    if _gateway_instance is None:
        _gateway_instance = OllamaGateway()
    return _gateway_instance
