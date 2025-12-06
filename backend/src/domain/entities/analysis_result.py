from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from typing import Optional, Tuple

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass(frozen=True)
class ClauseAnalysis:
    """Value object representing analysis of a single clause."""
    clause_id: str
    original_text: str
    topic: str
    risk_level: RiskLevel
    risk_explanation: str
    law_reference: Optional[str]
    suggested_rewrite: str
    diff_highlights: Tuple[str, ...]

@dataclass(frozen=True)
class AnalysisResult:
    """Value object for complete analysis output."""
    contract_id: str
    contract_type: str
    overall_risk: RiskLevel
    summary: str
    clauses_analysis: Tuple[ClauseAnalysis, ...]
    total_issues: int
    recommendation: str
    analyzed_at: datetime = field(default_factory=datetime.utcnow)
