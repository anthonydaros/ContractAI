from pydantic import BaseModel
from typing import Optional

class ContractInput(BaseModel):
    contract_id: Optional[str] = None
    file_path: Optional[str] = None
    raw_text: Optional[str] = None
    source: str = "upload"  # 'mock' or 'upload'
