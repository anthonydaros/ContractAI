"""
Tests for document parsers and factory.
"""
import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

from src.infrastructure.parsers.factory import DocumentParserFactory
from src.infrastructure.parsers.pdf_parser import PDFParser
from src.infrastructure.parsers.docx_parser import DOCXParser
from src.infrastructure.parsers.txt_parser import TXTParser


class TestTXTParser:
    """Tests for TXT parser."""

    def test_supports_txt_extension(self):
        """Test that TXT parser supports .txt extension."""
        parser = TXTParser()
        assert parser.supports('.txt') is True
        assert parser.supports('.TXT') is True

    def test_does_not_support_other_extensions(self):
        """Test that TXT parser rejects other extensions."""
        parser = TXTParser()
        assert parser.supports('.pdf') is False
        assert parser.supports('.docx') is False

    def test_parse_txt_file(self):
        """Test parsing a real TXT file."""
        parser = TXTParser()

        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("Test contract content.\n\nCLAUSE 1: Test clause.")
            tmp_path = Path(f.name)

        try:
            result = parser.parse(tmp_path)
            assert "Test contract content" in result
            assert "CLAUSE 1" in result
        finally:
            tmp_path.unlink()

    def test_parse_txt_unicode_error(self):
        """Test TXT parser handles unicode decode errors."""
        parser = TXTParser()

        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as f:
            # Write invalid UTF-8 bytes
            f.write(b'\x80\x81\x82\x83')
            tmp_path = Path(f.name)

        try:
            with pytest.raises(RuntimeError) as exc_info:
                parser.parse(tmp_path)
            assert "Failed to decode" in str(exc_info.value)
        finally:
            tmp_path.unlink()

    def test_parse_txt_file_not_found(self):
        """Test TXT parser handles file not found."""
        parser = TXTParser()

        with pytest.raises(RuntimeError) as exc_info:
            parser.parse(Path('/nonexistent/file.txt'))
        assert "Failed to read" in str(exc_info.value)


class TestPDFParser:
    """Tests for PDF parser."""

    def test_supports_pdf_extension(self):
        """Test that PDF parser supports .pdf extension."""
        parser = PDFParser()
        assert parser.supports('.pdf') is True
        assert parser.supports('.PDF') is True

    def test_does_not_support_other_extensions(self):
        """Test that PDF parser rejects other extensions."""
        parser = PDFParser()
        assert parser.supports('.txt') is False
        assert parser.supports('.docx') is False

    def test_parse_pdf_file_mocked(self):
        """Test PDF parsing with mocked fitz."""
        parser = PDFParser()

        mock_page = MagicMock()
        mock_page.get_text.return_value = "PDF content here"

        mock_doc = MagicMock()
        mock_doc.__iter__ = lambda self: iter([mock_page])
        mock_doc.__len__ = lambda self: 1

        with patch('src.infrastructure.parsers.pdf_parser.fitz.open', return_value=mock_doc):
            result = parser.parse(Path('test.pdf'))

        assert "PDF content" in result
        mock_doc.close.assert_called_once()

    def test_parse_pdf_error(self):
        """Test PDF parser error handling."""
        parser = PDFParser()

        with patch('src.infrastructure.parsers.pdf_parser.fitz.open', side_effect=Exception("PDF error")):
            with pytest.raises(RuntimeError) as exc_info:
                parser.parse(Path('test.pdf'))
            assert "Failed to parse PDF" in str(exc_info.value)


class TestDOCXParser:
    """Tests for DOCX parser."""

    def test_supports_docx_extension(self):
        """Test that DOCX parser supports .docx extension."""
        parser = DOCXParser()
        assert parser.supports('.docx') is True
        assert parser.supports('.DOCX') is True

    def test_does_not_support_other_extensions(self):
        """Test that DOCX parser rejects other extensions."""
        parser = DOCXParser()
        assert parser.supports('.txt') is False
        assert parser.supports('.pdf') is False

    def test_parse_docx_file_mocked(self):
        """Test DOCX parsing with mocked Document."""
        parser = DOCXParser()

        mock_para1 = MagicMock()
        mock_para1.text = "First paragraph"
        mock_para2 = MagicMock()
        mock_para2.text = "Second paragraph"

        mock_doc = MagicMock()
        mock_doc.paragraphs = [mock_para1, mock_para2]

        with patch('src.infrastructure.parsers.docx_parser.Document', return_value=mock_doc):
            result = parser.parse(Path('test.docx'))

        assert "First paragraph" in result
        assert "Second paragraph" in result

    def test_parse_docx_error(self):
        """Test DOCX parser error handling."""
        parser = DOCXParser()

        with patch('src.infrastructure.parsers.docx_parser.Document', side_effect=Exception("DOCX error")):
            with pytest.raises(RuntimeError) as exc_info:
                parser.parse(Path('test.docx'))
            assert "Failed to parse DOCX" in str(exc_info.value)


class TestDocumentParserFactory:
    """Tests for document parser factory."""

    def test_get_parser_for_pdf(self):
        """Test getting parser for PDF file."""
        factory = DocumentParserFactory()
        parser = factory.get_parser(Path('contract.pdf'))
        assert isinstance(parser, PDFParser)

    def test_get_parser_for_docx(self):
        """Test getting parser for DOCX file."""
        factory = DocumentParserFactory()
        parser = factory.get_parser(Path('contract.docx'))
        assert isinstance(parser, DOCXParser)

    def test_get_parser_for_txt(self):
        """Test getting parser for TXT file."""
        factory = DocumentParserFactory()
        parser = factory.get_parser(Path('contract.txt'))
        assert isinstance(parser, TXTParser)

    def test_get_parser_unsupported_type(self):
        """Test that unsupported file types raise ValueError."""
        factory = DocumentParserFactory()

        with pytest.raises(ValueError) as exc_info:
            factory.get_parser(Path('contract.xyz'))
        assert "Unsupported file type" in str(exc_info.value)

    def test_register_parser(self):
        """Test registering a custom parser."""
        factory = DocumentParserFactory()

        mock_parser = MagicMock()
        mock_parser.supports.return_value = True

        factory.register_parser(mock_parser)

        # Should find the mock parser for any extension since it returns True
        result = factory.get_parser(Path('test.custom'))
        assert result == mock_parser

    def test_get_supported_extensions(self):
        """Test getting list of supported extensions."""
        factory = DocumentParserFactory()
        extensions = factory.get_supported_extensions()

        assert '.pdf' in extensions
        assert '.docx' in extensions
        assert '.txt' in extensions
        assert len(extensions) == 3
