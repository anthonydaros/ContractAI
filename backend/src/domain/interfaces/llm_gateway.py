from abc import ABC, abstractmethod
from typing import List, Dict, Any

class ILLMGateway(ABC):
    @abstractmethod
    async def generate_text(self, prompt: str, model: str = "llama3") -> str:
        """Generate text from a prompt."""
        pass  # pragma: no cover

    @abstractmethod
    async def get_embeddings(self, text: str) -> List[float]:
        """Get vector embeddings for text."""
        pass  # pragma: no cover

    @abstractmethod
    async def extract_structured_data(self, text: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured data from text based on schema."""
        pass  # pragma: no cover
