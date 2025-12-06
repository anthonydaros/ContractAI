"""
Parse Document Use Case.

This module provides the use case for parsing uploaded documents
into plain text for subsequent analysis. Supports PDF, DOCX, and TXT formats.

@module application/use_cases/parse_document
"""
from pathlib import Path
from typing import Optional

from ...infrastructure.parsers.factory import DocumentParserFactory


class ParseDocumentUseCase:
    """
    Use case for parsing contract documents into text.

    This use case handles the extraction of text content from various
    document formats (PDF, DOCX, TXT) using the appropriate parser.

    Attributes:
        parser_factory: Factory for creating document-specific parsers.

    Example:
        >>> use_case = ParseDocumentUseCase()
        >>> text = use_case.execute("/path/to/contract.pdf")
        >>> print(f"Extracted {len(text)} characters")
    """

    def __init__(self, parser_factory: Optional[DocumentParserFactory] = None) -> None:
        """
        Initialize the parse document use case.

        Args:
            parser_factory: Factory for creating document parsers.
                           Defaults to a new DocumentParserFactory instance.
        """
        self.parser_factory = parser_factory or DocumentParserFactory()

    def execute(self, file_path: str) -> str:
        """
        Parse a document and extract its text content.

        Determines the appropriate parser based on file extension and
        extracts the text content from the document.

        Args:
            file_path: Path to the document file to parse.

        Returns:
            Extracted text content from the document.

        Raises:
            FileNotFoundError: If the specified file does not exist.
            ValueError: If the file type is not supported.

        Example:
            >>> use_case = ParseDocumentUseCase()
            >>> text = use_case.execute("contract.pdf")
            >>> if "termination" in text.lower():
            ...     print("Contract contains termination clause")
        """
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        parser = self.parser_factory.get_parser(path)
        return parser.parse(path)
