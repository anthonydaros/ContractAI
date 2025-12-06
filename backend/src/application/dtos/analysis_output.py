from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ClauseAnalysisDTO(BaseModel):
    clause_id: str
    original_text: str
    risk_level: str
    risk_explanation: str
    suggested_rewrite: str

class AnalysisOutput(BaseModel):
    contract_id: str
    overall_risk: str
    summary: str
    clauses: List[ClauseAnalysisDTO]
    recommendation: str
    analyzed_at: datetime
