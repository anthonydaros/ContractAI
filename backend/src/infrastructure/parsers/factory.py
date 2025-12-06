from pathlib import Path
from ...domain.interfaces.document_parser import IDocumentParser
from .pdf_parser import PDFParser
from .docx_parser import DOCXParser
from .txt_parser import TXTParser

class DocumentParserFactory:
    def __init__(self):
        self._parsers = [
            PDFParser(),
            DOCXParser(),
            TXTParser()
        ]

    def get_parser(self, file_path: Path) -> IDocumentParser:
        extension = file_path.suffix
        for parser in self._parsers:
            if parser.supports(extension):
                return parser
        raise ValueError(f"Unsupported file type: {extension}")
