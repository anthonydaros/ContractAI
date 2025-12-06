from pathlib import Path
from ...infrastructure.parsers.factory import DocumentParserFactory

class ParseDocumentUseCase:
    def __init__(self, parser_factory: DocumentParserFactory = None):
        self.parser_factory = parser_factory or DocumentParserFactory()

    def execute(self, file_path: str) -> str:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        parser = self.parser_factory.get_parser(path)
        return parser.parse(path)
