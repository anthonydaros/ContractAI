"""
Tests for the upload endpoint.
"""
import io
import pytest
from unittest.mock import patch, MagicMock


class TestUploadEndpoint:
    """Tests for POST /upload/"""

    def test_upload_txt_success(self, client, clear_storage):
        """Test successful TXT file upload."""
        content = b"This is a test contract document.\n\nCLAUSE 1: Test clause."
        file = io.BytesIO(content)

        response = client.post(
            "/upload/",
            files={"file": ("test_contract.txt", file, "text/plain")}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "upload_id" in data
        assert data["upload_id"].startswith("upload_")
        assert data["filename"] == "test_contract.txt"
        assert data["text_length"] > 0

    def test_upload_invalid_extension(self, client):
        """Test that invalid file extensions are rejected."""
        content = b"Some content"
        file = io.BytesIO(content)

        response = client.post(
            "/upload/",
            files={"file": ("test.exe", file, "application/octet-stream")}
        )

        assert response.status_code == 400
        assert "not supported" in response.json()["detail"].lower()

    def test_upload_invalid_mime_type(self, client):
        """Test that invalid MIME types are rejected."""
        content = b"Some content"
        file = io.BytesIO(content)

        response = client.post(
            "/upload/",
            files={"file": ("test.txt", file, "application/octet-stream")}
        )

        assert response.status_code == 415
        assert "unsupported media type" in response.json()["detail"].lower()

    def test_upload_file_too_large(self, client):
        """Test that files over 10MB are rejected."""
        # Create a file slightly over 10MB
        large_content = b"x" * (10 * 1024 * 1024 + 1)
        file = io.BytesIO(large_content)

        response = client.post(
            "/upload/",
            files={"file": ("large.txt", file, "text/plain")}
        )

        assert response.status_code == 413
        assert "too large" in response.json()["detail"].lower()

    def test_upload_empty_file(self, client):
        """Test that empty files are rejected."""
        file = io.BytesIO(b"")

        response = client.post(
            "/upload/",
            files={"file": ("empty.txt", file, "text/plain")}
        )

        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_upload_filename_sanitization(self, client, clear_storage):
        """Test that malicious filenames are sanitized."""
        content = b"Test content"
        file = io.BytesIO(content)

        # Try path traversal attack
        response = client.post(
            "/upload/",
            files={"file": ("../../../etc/passwd.txt", file, "text/plain")}
        )

        assert response.status_code == 200
        data = response.json()
        # Filename should be sanitized (not contain path traversal)
        assert ".." not in data["filename"]
        assert "/" not in data["filename"]

    def test_upload_special_characters_filename(self, client, clear_storage):
        """Test that filenames with special characters are sanitized."""
        content = b"Test content"
        file = io.BytesIO(content)

        response = client.post(
            "/upload/",
            files={"file": ("test<script>alert.txt", file, "text/plain")}
        )

        assert response.status_code == 200
        data = response.json()
        # Filename should be sanitized
        assert "<" not in data["filename"]
        assert ">" not in data["filename"]

    def test_upload_stores_text_for_retrieval(self, client, clear_storage):
        """Test that uploaded text is stored and retrievable."""
        from src.presentation.api.routes.storage import get_uploaded_text

        content = b"Contract content for testing storage"
        file = io.BytesIO(content)

        response = client.post(
            "/upload/",
            files={"file": ("contract.txt", file, "text/plain")}
        )

        assert response.status_code == 200
        upload_id = response.json()["upload_id"]

        # Verify text was stored
        stored_text = get_uploaded_text(upload_id)
        assert stored_text is not None
        assert "Contract content" in stored_text


class TestSanitizeFilename:
    """Tests for filename sanitization function."""

    def test_sanitize_empty_filename(self, client):
        """Test that empty filename returns 422 (FastAPI validation) or 400."""
        content = b"Some content"
        file = io.BytesIO(content)

        # Send with empty filename - FastAPI may reject with 422 for validation
        response = client.post(
            "/upload/",
            files={"file": ("", file, "text/plain")}
        )

        # FastAPI returns 422 for validation errors before our code runs
        assert response.status_code in (400, 422)

    def test_sanitize_none_filename(self, client):
        """Test handling of None filename."""
        from src.presentation.api.routes.upload import sanitize_filename

        with pytest.raises(ValueError) as exc_info:
            sanitize_filename(None)
        assert "required" in str(exc_info.value).lower()

    def test_sanitize_filename_valueerror_handling(self, client):
        """Test that ValueError from sanitize_filename returns 400."""
        content = b"Some content"
        file = io.BytesIO(content)

        # Mock sanitize_filename to raise ValueError
        with patch('src.presentation.api.routes.upload.sanitize_filename') as mock_sanitize:
            mock_sanitize.side_effect = ValueError("Invalid filename")

            response = client.post(
                "/upload/",
                files={"file": ("test.txt", file, "text/plain")}
            )

        assert response.status_code == 400
        assert "invalid filename" in response.json()["detail"].lower()


class TestUploadWithMockedParser:
    """Tests for upload with mocked document parsers."""

    def test_upload_pdf_with_mocked_parser(self, client, clear_storage):
        """Test PDF upload with mocked parser."""
        pdf_content = b"%PDF-1.4\nTest content"
        file = io.BytesIO(pdf_content)

        with patch('src.presentation.api.routes.upload.DocumentParserFactory') as mock_factory:
            mock_parser = MagicMock()
            mock_parser.parse.return_value = "Extracted PDF text content"
            mock_factory.return_value.get_parser.return_value = mock_parser

            response = client.post(
                "/upload/",
                files={"file": ("contract.pdf", file, "application/pdf")}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Extracted PDF text" in data["text_preview"]

    def test_upload_docx_with_mocked_parser(self, client, clear_storage):
        """Test DOCX upload with mocked parser."""
        docx_content = b"PK\x03\x04Fake DOCX"
        file = io.BytesIO(docx_content)

        with patch('src.presentation.api.routes.upload.DocumentParserFactory') as mock_factory:
            mock_parser = MagicMock()
            mock_parser.parse.return_value = "Extracted DOCX text content"
            mock_factory.return_value.get_parser.return_value = mock_parser

            response = client.post(
                "/upload/",
                files={"file": ("contract.docx", file,
                               "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_upload_parser_failure(self, client):
        """Test handling when parser fails."""
        content = b"Some content"
        file = io.BytesIO(content)

        with patch('src.presentation.api.routes.upload.DocumentParserFactory') as mock_factory:
            mock_parser = MagicMock()
            mock_parser.parse.side_effect = Exception("Parser error")
            mock_factory.return_value.get_parser.return_value = mock_parser

            response = client.post(
                "/upload/",
                files={"file": ("contract.txt", file, "text/plain")}
            )

        assert response.status_code == 500
        assert "failed to parse" in response.json()["detail"].lower()

    def test_upload_parser_returns_empty(self, client):
        """Test handling when parser returns empty text."""
        content = b"Some content"
        file = io.BytesIO(content)

        with patch('src.presentation.api.routes.upload.DocumentParserFactory') as mock_factory:
            mock_parser = MagicMock()
            mock_parser.parse.return_value = "   "  # Only whitespace
            mock_factory.return_value.get_parser.return_value = mock_parser

            response = client.post(
                "/upload/",
                files={"file": ("contract.txt", file, "text/plain")}
            )

        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_upload_temp_file_cleanup_failure(self, client, clear_storage):
        """Test that temp file cleanup failures are handled gracefully."""
        content = b"Test contract content"
        file = io.BytesIO(content)

        with patch('src.presentation.api.routes.upload.DocumentParserFactory') as mock_factory:
            mock_parser = MagicMock()
            mock_parser.parse.return_value = "Parsed text content"
            mock_factory.return_value.get_parser.return_value = mock_parser

            # Make unlink raise an exception
            with patch('pathlib.Path.unlink', side_effect=PermissionError("Cannot delete")):
                response = client.post(
                    "/upload/",
                    files={"file": ("contract.txt", file, "text/plain")}
                )

        # Should still succeed despite cleanup failure
        assert response.status_code == 200
        assert response.json()["success"] is True
