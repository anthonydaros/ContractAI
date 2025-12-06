from pathlib import Path
from ...domain.interfaces.document_parser import IDocumentParser

class TXTParser(IDocumentParser):
    def supports(self, extension: str) -> bool:
        return extension.lower() == '.txt'

    def parse(self, file_path: Path) -> str:
        return file_path.read_text(encoding='utf-8')
