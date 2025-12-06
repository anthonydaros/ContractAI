from abc import ABC, abstractmethod
from pathlib import Path

class IDocumentParser(ABC):
    @abstractmethod
    def parse(self, file_path: Path) -> str:
        """Extract text from document."""
        pass

    @abstractmethod
    def supports(self, extension: str) -> bool:
        """Check if parser supports file type."""
        pass
