"""
PDF Document Parser.

This module provides PDF parsing functionality using PyMuPDF (fitz).
Extracts text content from all pages of a PDF document.

@module infrastructure/parsers/pdf_parser
"""
import logging
from pathlib import Path
from typing import List

import fitz  # PyMuPDF

from ...domain.interfaces.document_parser import IDocumentParser

# Configure module logger
logger = logging.getLogger(__name__)


class PDFParser(IDocumentParser):
    """
    Parser for PDF document files.

    Uses PyMuPDF (fitz) to extract text content from PDF documents.
    Handles multi-page documents by concatenating text from all pages.

    Attributes:
        SUPPORTED_EXTENSION: The file extension this parser supports.

    Example:
        >>> parser = PDFParser()
        >>> if parser.supports('.pdf'):
        ...     text = parser.parse(Path('contract.pdf'))
        ...     print(f"Extracted {len(text)} characters")
    """

    SUPPORTED_EXTENSION: str = '.pdf'

    def supports(self, extension: str) -> bool:
        """
        Check if the parser supports PDF files.

        Args:
            extension: File extension to check (e.g., '.pdf').

        Returns:
            True if extension is '.pdf' (case-insensitive), False otherwise.
        """
        return extension.lower() == self.SUPPORTED_EXTENSION

    def parse(self, file_path: Path) -> str:
        """
        Extract text content from a PDF file.

        Opens the PDF document and extracts text from each page,
        concatenating the results with newline separators.

        Args:
            file_path: Path to the PDF file to parse.

        Returns:
            Extracted text content from all pages of the PDF.

        Raises:
            FileNotFoundError: If the PDF file does not exist.
            RuntimeError: If PDF parsing fails.

        Example:
            >>> parser = PDFParser()
            >>> text = parser.parse(Path('/path/to/contract.pdf'))
            >>> print(text[:100])  # First 100 characters
        """
        logger.debug(f"Parsing PDF file: {file_path}")

        try:
            doc = fitz.open(file_path)
            text_parts: List[str] = []

            for page_num, page in enumerate(doc):
                page_text = page.get_text()
                text_parts.append(page_text)
                logger.debug(f"Extracted {len(page_text)} chars from page {page_num + 1}")

            doc.close()

            full_text = "\n".join(text_parts)
            logger.info(f"PDF parsing complete: {len(full_text)} chars from {len(text_parts)} pages")

            return full_text

        except Exception as e:
            logger.error(f"PDF parsing failed for {file_path}: {str(e)}")
            raise RuntimeError(f"Failed to parse PDF: {str(e)}") from e
