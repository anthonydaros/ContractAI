from pathlib import Path
from docx import Document
from ...domain.interfaces.document_parser import IDocumentParser

class DOCXParser(IDocumentParser):
    def supports(self, extension: str) -> bool:
        return extension.lower() == '.docx'

    def parse(self, file_path: Path) -> str:
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
