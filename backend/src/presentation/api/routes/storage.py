# In-memory storage for uploaded texts (MVP only)
# In production, use Redis or database
from typing import Optional, Dict

uploaded_texts: Dict[str, str] = {}

def store_uploaded_text(upload_id: str, text: str) -> None:
    """Store uploaded text for later analysis."""
    uploaded_texts[upload_id] = text

def get_uploaded_text(upload_id: str) -> Optional[str]:
    """Retrieve uploaded text by ID."""
    return uploaded_texts.get(upload_id)
