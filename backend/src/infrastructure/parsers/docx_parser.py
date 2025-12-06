"""
DOCX Document Parser.

This module provides Microsoft Word DOCX parsing functionality
using the python-docx library. Extracts text from document paragraphs.

@module infrastructure/parsers/docx_parser
"""
import logging
from pathlib import Path
from typing import List

from docx import Document

from ...domain.interfaces.document_parser import IDocumentParser

# Configure module logger
logger = logging.getLogger(__name__)


class DOCXParser(IDocumentParser):
    """
    Parser for Microsoft Word DOCX document files.

    Uses python-docx to extract text content from DOCX documents.
    Extracts text from all paragraphs in the document body.

    Note:
        This parser extracts paragraph text only. Tables, headers,
        footers, and embedded objects are not included.

    Attributes:
        SUPPORTED_EXTENSION: The file extension this parser supports.

    Example:
        >>> parser = DOCXParser()
        >>> if parser.supports('.docx'):
        ...     text = parser.parse(Path('contract.docx'))
        ...     print(f"Extracted {len(text)} characters")
    """

    SUPPORTED_EXTENSION: str = '.docx'

    def supports(self, extension: str) -> bool:
        """
        Check if the parser supports DOCX files.

        Args:
            extension: File extension to check (e.g., '.docx').

        Returns:
            True if extension is '.docx' (case-insensitive), False otherwise.
        """
        return extension.lower() == self.SUPPORTED_EXTENSION

    def parse(self, file_path: Path) -> str:
        """
        Extract text content from a DOCX file.

        Opens the Word document and extracts text from each paragraph,
        concatenating the results with newline separators.

        Args:
            file_path: Path to the DOCX file to parse.

        Returns:
            Extracted text content from all paragraphs in the document.

        Raises:
            FileNotFoundError: If the DOCX file does not exist.
            RuntimeError: If DOCX parsing fails.

        Example:
            >>> parser = DOCXParser()
            >>> text = parser.parse(Path('/path/to/contract.docx'))
            >>> print(text[:100])  # First 100 characters
        """
        logger.debug(f"Parsing DOCX file: {file_path}")

        try:
            doc = Document(file_path)
            paragraphs: List[str] = [para.text for para in doc.paragraphs]

            full_text = "\n".join(paragraphs)
            logger.info(f"DOCX parsing complete: {len(full_text)} chars from {len(paragraphs)} paragraphs")

            return full_text

        except Exception as e:
            logger.error(f"DOCX parsing failed for {file_path}: {str(e)}")
            raise RuntimeError(f"Failed to parse DOCX: {str(e)}") from e
