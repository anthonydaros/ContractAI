"""
Contract Analysis Orchestrator.

This module provides the main orchestration layer for contract analysis,
coordinating between document parsing, clause extraction, and AI analysis.

@module application/orchestrator
"""
from typing import Dict, Any

from .use_cases.parse_document import ParseDocumentUseCase


class ContractAnalysisOrchestrator:
    """
    Orchestrates the contract analysis workflow.

    Coordinates the flow from document parsing through AI analysis,
    managing the interaction between use cases and infrastructure services.

    Note:
        This is a simplified implementation for the MVP. Full clause extraction
        and multi-step analysis pipelines are handled by the LLM gateway directly.

    Attributes:
        parse_document: Use case for parsing uploaded documents.

    Example:
        >>> orchestrator = ContractAnalysisOrchestrator()
        >>> result = await orchestrator.analyze_document("contract.pdf")
    """

    def __init__(self) -> None:
        """Initialize the orchestrator with required use cases."""
        self.parse_document = ParseDocumentUseCase()

    async def analyze_document(self, file_path: str) -> Dict[str, Any]:
        """
        Parse a document and return preview information.

        This method handles the document parsing step. Full contract analysis
        including clause extraction and risk assessment is performed by the
        analysis route using the LLM gateway directly.

        Args:
            file_path: Path to the document file to analyze.

        Returns:
            Dict containing:
                - text_preview: First 200 characters of extracted text
                - text_length: Total length of extracted text

        Raises:
            ValueError: If the file type is not supported.
            RuntimeError: If document parsing fails.
        """
        text = self.parse_document.execute(file_path)

        return {
            "text_preview": text[:200] if text else "",
            "text_length": len(text) if text else 0,
        }
