from pathlib import Path
import fitz  # PyMuPDF
from ...domain.interfaces.document_parser import IDocumentParser

class PDFParser(IDocumentParser):
    def supports(self, extension: str) -> bool:
        return extension.lower() == '.pdf'

    def parse(self, file_path: Path) -> str:
        doc = fitz.open(file_path)
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        return "\n".join(text_parts)
