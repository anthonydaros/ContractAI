"""
Document Parser Interface.

This module defines the abstract interface for document parsers.
All concrete parser implementations must inherit from this interface.

@module domain/interfaces/document_parser
"""
from abc import ABC, abstractmethod
from pathlib import Path


class IDocumentParser(ABC):
    """
    Abstract base class for document parsers.

    This interface defines the contract for all document parsing implementations.
    Concrete parsers must implement both `parse` and `supports` methods.

    Example:
        >>> class MyParser(IDocumentParser):
        ...     def parse(self, file_path: Path) -> str:
        ...         return "parsed text"
        ...     def supports(self, extension: str) -> bool:
        ...         return extension == ".my"
    """

    @abstractmethod
    def parse(self, file_path: Path) -> str:
        """
        Extract text content from a document file.

        Args:
            file_path: Path to the document file to parse.

        Returns:
            Extracted text content from the document.

        Raises:
            FileNotFoundError: If the file does not exist.
            PermissionError: If the file cannot be read.
            ValueError: If the file format is invalid.
        """
        pass  # pragma: no cover

    @abstractmethod
    def supports(self, extension: str) -> bool:
        """
        Check if the parser supports a given file extension.

        Args:
            extension: File extension to check (e.g., '.pdf', '.docx').

        Returns:
            True if the parser can handle this file type, False otherwise.

        Example:
            >>> parser = PDFParser()
            >>> parser.supports('.pdf')
            True
            >>> parser.supports('.txt')
            False
        """
        pass  # pragma: no cover
