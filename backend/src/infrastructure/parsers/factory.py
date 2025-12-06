"""
Document Parser Factory.

This module provides a factory for creating document parsers based on
file extension. Implements the Factory pattern for parser instantiation.

@module infrastructure/parsers/factory
"""
import logging
from pathlib import Path
from typing import List

from ...domain.interfaces.document_parser import IDocumentParser
from .pdf_parser import PDFParser
from .docx_parser import DOCXParser
from .txt_parser import TXTParser

# Configure module logger
logger = logging.getLogger(__name__)


class DocumentParserFactory:
    """
    Factory for creating document parsers.

    Maintains a registry of available parsers and returns the appropriate
    parser based on file extension. Uses the Factory design pattern.

    Attributes:
        _parsers: List of registered parser instances.

    Example:
        >>> factory = DocumentParserFactory()
        >>> parser = factory.get_parser(Path('contract.pdf'))
        >>> text = parser.parse(Path('contract.pdf'))
    """

    def __init__(self) -> None:
        """
        Initialize the factory with default parsers.

        Registers PDF, DOCX, and TXT parsers by default.
        Additional parsers can be registered using `register_parser`.
        """
        self._parsers: List[IDocumentParser] = [
            PDFParser(),
            DOCXParser(),
            TXTParser()
        ]
        logger.debug(f"DocumentParserFactory initialized with {len(self._parsers)} parsers")

    def register_parser(self, parser: IDocumentParser) -> None:
        """
        Register an additional parser.

        Adds a new parser to the factory's registry. This allows
        extending support for additional file formats.

        Args:
            parser: Parser instance to register.

        Example:
            >>> factory = DocumentParserFactory()
            >>> factory.register_parser(CustomParser())
        """
        self._parsers.append(parser)
        logger.info(f"Registered new parser: {parser.__class__.__name__}")

    def get_parser(self, file_path: Path) -> IDocumentParser:
        """
        Get the appropriate parser for a file.

        Iterates through registered parsers and returns the first one
        that supports the file's extension.

        Args:
            file_path: Path to the file to be parsed.

        Returns:
            IDocumentParser: A parser instance that supports the file type.

        Raises:
            ValueError: If no parser supports the file extension.

        Example:
            >>> factory = DocumentParserFactory()
            >>> parser = factory.get_parser(Path('contract.pdf'))
            >>> isinstance(parser, PDFParser)
            True
        """
        extension = file_path.suffix
        logger.debug(f"Looking for parser for extension: {extension}")

        for parser in self._parsers:
            if parser.supports(extension):
                logger.debug(f"Found parser: {parser.__class__.__name__}")
                return parser

        logger.warning(f"No parser found for extension: {extension}")
        raise ValueError(f"Unsupported file type: {extension}")

    def get_supported_extensions(self) -> List[str]:
        """
        Get list of all supported file extensions.

        Returns:
            List of file extensions supported by registered parsers.

        Example:
            >>> factory = DocumentParserFactory()
            >>> extensions = factory.get_supported_extensions()
            >>> '.pdf' in extensions
            True
        """
        extensions: List[str] = []
        for parser in self._parsers:
            if isinstance(parser, PDFParser):
                extensions.append(PDFParser.SUPPORTED_EXTENSION)
            elif isinstance(parser, DOCXParser):
                extensions.append(DOCXParser.SUPPORTED_EXTENSION)
            elif isinstance(parser, TXTParser):
                extensions.append(TXTParser.SUPPORTED_EXTENSION)
        return extensions
