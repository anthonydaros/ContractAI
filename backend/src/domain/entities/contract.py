from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from .clause import Clause

@dataclass
class Contract:
    """Contract aggregate root."""
    id: str
    name: str
    source: str  # 'mock' | 'upload'
    content: str
    clauses: List[Clause] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def extract_clauses(self, extracted: List[dict]) -> None:
        """Populate clauses from extraction result."""
        self.clauses = [
            Clause(
                id=f"clause_{i+1}",
                title=c.get("title", f"Clause {i+1}"),
                content=c["content"],
                position=i
            )
            for i, c in enumerate(extracted)
        ]
