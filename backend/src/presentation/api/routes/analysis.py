"""
Contract analysis API routes.

This module provides endpoints for analyzing contracts using AI/LLM,
identifying risks, and generating recommendations.

Security:
    - Contract text size is validated to prevent DoS attacks
    - Error messages are sanitized to prevent information leakage
"""
import logging
import uuid
from datetime import datetime
from typing import Optional, Literal, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .contracts import MOCK_CONTRACTS
from .storage import get_uploaded_text
from ....infrastructure.llm.ollama_gateway import get_llm_gateway

# Configure module logger
logger = logging.getLogger(__name__)

# Security: Maximum contract size to prevent DoS and token limit issues
MAX_CONTRACT_LENGTH = 100000  # ~100K characters (approximately 25K tokens)

router = APIRouter(prefix="/analyze", tags=["analysis"])

class AnalyzeRequest(BaseModel):
    """
    Request model for contract analysis.

    Attributes:
        source: Source type - 'mock' for demo contracts, 'upload' for user uploads.
        contract_id: ID of mock contract (required if source='mock').
        upload_id: ID of uploaded document (required if source='upload').
    """
    source: Literal["mock", "upload"] = Field(..., description="Contract source type")
    contract_id: Optional[str] = Field(None, description="Mock contract ID")
    upload_id: Optional[str] = Field(None, description="Upload session ID")


class ClauseAnalysisResponse(BaseModel):
    """
    Analysis result for a single contract clause.

    Attributes:
        clause_id: Unique identifier for the clause.
        original_text: Original text of the clause.
        topic: Category/topic of the clause (e.g., 'payment', 'liability').
        risk_level: Risk assessment (low/medium/high/critical).
        risk_explanation: Detailed explanation of identified risks.
        law_reference: Optional reference to relevant legislation.
        suggested_rewrite: AI-suggested improved version of the clause.
    """
    clause_id: str
    original_text: str
    topic: str
    risk_level: str
    risk_explanation: str
    law_reference: Optional[str] = None
    suggested_rewrite: Optional[str] = None


class AnalysisResponse(BaseModel):
    """
    Complete contract analysis response.

    Attributes:
        analysis_id: Unique ID for this analysis session.
        contract_id: ID of the analyzed contract.
        contract_name: Display name of the contract.
        contract_type: Detected type (e.g., 'Employment', 'NDA', 'Service Agreement').
        overall_risk: Overall risk level (low/medium/high/critical).
        summary: Executive summary of the analysis.
        clauses: List of individual clause analyses.
        total_issues: Count of high/critical risk clauses.
        recommendation: Final recommendation (SIGN/NEGOTIATE/DO_NOT_SIGN).
        analyzed_at: ISO timestamp of analysis completion.
    """
    analysis_id: str
    contract_id: str
    contract_name: str
    contract_type: str
    overall_risk: str
    summary: str
    clauses: List[ClauseAnalysisResponse]
    total_issues: int
    recommendation: str
    analyzed_at: str

@router.post("/", response_model=AnalysisResponse)
async def analyze_contract(request: AnalyzeRequest) -> AnalysisResponse:
    """
    Analyze a contract using AI/LLM to identify risks and generate recommendations.

    This endpoint accepts either a mock contract ID or an upload session ID,
    retrieves the contract text, and performs AI-powered analysis to identify
    problematic clauses and suggest improvements.

    Args:
        request: Analysis request containing source type and contract/upload ID.

    Returns:
        AnalysisResponse: Complete analysis with risk assessment and recommendations.

    Raises:
        HTTPException(400): If contract_id or upload_id is invalid.
        HTTPException(500): If analysis fails due to internal error.
    """
    # Get contract text based on source
    contract_text = ""
    contract_id = ""
    contract_name = ""

    if request.source == "mock":
        if not request.contract_id or request.contract_id not in MOCK_CONTRACTS:
            logger.warning(f"Invalid contract_id requested: {request.contract_id}")
            raise HTTPException(status_code=400, detail="Invalid contract_id")

        contract = MOCK_CONTRACTS[request.contract_id]
        contract_text = contract["content"]
        contract_id = contract["id"]
        contract_name = contract["name"]
        logger.info(f"Analyzing mock contract: {contract_id}")

    elif request.source == "upload":
        uploaded_text = get_uploaded_text(request.upload_id) if request.upload_id else None
        if not uploaded_text:
            logger.warning(f"Invalid or expired upload_id: {request.upload_id}")
            raise HTTPException(status_code=400, detail="Invalid upload_id or upload expired")

        contract_text = uploaded_text
        contract_id = request.upload_id
        contract_name = f"Uploaded Document ({request.upload_id[:8]})"
        logger.info(f"Analyzing uploaded document: {contract_id}")

    if not contract_text or len(contract_text.strip()) == 0:
        raise HTTPException(status_code=400, detail="No contract text to analyze")

    # Security: Validate contract size to prevent DoS and token limit issues
    if len(contract_text) > MAX_CONTRACT_LENGTH:
        logger.warning(f"Contract too large: {len(contract_text)} chars (max: {MAX_CONTRACT_LENGTH})")
        raise HTTPException(
            status_code=413,
            detail=f"Contract too large. Maximum {MAX_CONTRACT_LENGTH:,} characters allowed."
        )

    # Perform AI analysis
    try:
        gateway = get_llm_gateway()
        analysis_result = await gateway.analyze_contract(contract_text)

        # Build response with validated clause data
        clauses = []
        for clause in analysis_result.get("clauses", []):
            clauses.append(ClauseAnalysisResponse(
                clause_id=clause.get("clause_id", "Unknown"),
                original_text=clause.get("original_text", ""),
                topic=clause.get("topic", "general"),
                risk_level=clause.get("risk_level", "medium"),
                risk_explanation=clause.get("risk_explanation", ""),
                law_reference=clause.get("law_reference"),
                suggested_rewrite=clause.get("suggested_rewrite")
            ))

        logger.info(f"Analysis completed for {contract_id}: {len(clauses)} clauses analyzed")

        return AnalysisResponse(
            analysis_id=str(uuid.uuid4()),
            contract_id=contract_id,
            contract_name=contract_name,
            contract_type=analysis_result.get("contract_type", "Unknown"),
            overall_risk=analysis_result.get("overall_risk", "medium"),
            summary=analysis_result.get("summary", "Analysis completed."),
            clauses=clauses,
            total_issues=analysis_result.get("total_issues", len([c for c in clauses if c.risk_level in ["high", "critical"]])),
            recommendation=analysis_result.get("recommendation", "NEGOTIATE"),
            analyzed_at=datetime.utcnow().isoformat()
        )

    except Exception as e:
        # SECURITY: Log full error internally, return generic message to client
        logger.error(f"Analysis failed for contract {contract_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Analysis failed. Please try again or contact support."
        )
