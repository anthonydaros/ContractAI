from dataclasses import dataclass

@dataclass(frozen=True)
class Clause:
    """Immutable clause entity."""
    id: str
    title: str
    content: str
    position: int
