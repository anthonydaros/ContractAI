"""
Plain Text Document Parser.

This module provides plain text file parsing functionality.
Simply reads the file content with UTF-8 encoding.

@module infrastructure/parsers/txt_parser
"""
import logging
from pathlib import Path

from ...domain.interfaces.document_parser import IDocumentParser

# Configure module logger
logger = logging.getLogger(__name__)


class TXTParser(IDocumentParser):
    """
    Parser for plain text document files.

    Reads text files directly with UTF-8 encoding. This is the simplest
    parser implementation as no conversion is needed.

    Attributes:
        SUPPORTED_EXTENSION: The file extension this parser supports.
        ENCODING: Character encoding used when reading files.

    Example:
        >>> parser = TXTParser()
        >>> if parser.supports('.txt'):
        ...     text = parser.parse(Path('contract.txt'))
        ...     print(f"Read {len(text)} characters")
    """

    SUPPORTED_EXTENSION: str = '.txt'
    ENCODING: str = 'utf-8'

    def supports(self, extension: str) -> bool:
        """
        Check if the parser supports TXT files.

        Args:
            extension: File extension to check (e.g., '.txt').

        Returns:
            True if extension is '.txt' (case-insensitive), False otherwise.
        """
        return extension.lower() == self.SUPPORTED_EXTENSION

    def parse(self, file_path: Path) -> str:
        """
        Read text content from a plain text file.

        Reads the entire file content using UTF-8 encoding.

        Args:
            file_path: Path to the TXT file to read.

        Returns:
            Full text content of the file.

        Raises:
            FileNotFoundError: If the text file does not exist.
            UnicodeDecodeError: If the file is not valid UTF-8.
            RuntimeError: If file reading fails.

        Example:
            >>> parser = TXTParser()
            >>> text = parser.parse(Path('/path/to/contract.txt'))
            >>> print(text[:100])  # First 100 characters
        """
        logger.debug(f"Parsing TXT file: {file_path}")

        try:
            text = file_path.read_text(encoding=self.ENCODING)
            logger.info(f"TXT parsing complete: {len(text)} chars")
            return text

        except UnicodeDecodeError as e:
            logger.error(f"TXT encoding error for {file_path}: {str(e)}")
            raise RuntimeError(f"Failed to decode text file: {str(e)}") from e

        except Exception as e:
            logger.error(f"TXT parsing failed for {file_path}: {str(e)}")
            raise RuntimeError(f"Failed to read text file: {str(e)}") from e
