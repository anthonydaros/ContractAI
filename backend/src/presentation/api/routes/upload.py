"""
Document upload API routes.

This module provides endpoints for uploading and parsing contract documents
(PDF, DOCX, TXT) for subsequent analysis.
"""
import logging
import re
import tempfile
import uuid
from pathlib import Path
from typing import Dict, Any

from fastapi import APIRouter, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from ....infrastructure.parsers.factory import DocumentParserFactory
from .storage import store_uploaded_text

# Configure module logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])

# Configuration constants
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt'}
ALLOWED_MIMETYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# SECURITY: Regex pattern for safe filenames (alphanumeric, dots, hyphens, underscores)
SAFE_FILENAME_PATTERN = re.compile(r'^[a-zA-Z0-9][a-zA-Z0-9._-]*$')


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.

    Args:
        filename: Original filename from upload.

    Returns:
        Sanitized filename safe for filesystem operations.

    Raises:
        ValueError: If filename is invalid or potentially malicious.
    """
    if not filename:
        raise ValueError("Filename is required")

    # Remove any path components (prevent path traversal)
    basename = Path(filename).name

    # Check against safe pattern
    if not SAFE_FILENAME_PATTERN.match(basename):
        # Generate safe filename preserving extension
        extension = Path(basename).suffix.lower()
        safe_name = f"document_{uuid.uuid4().hex[:8]}{extension}"
        logger.warning(f"Unsafe filename sanitized: {filename} -> {safe_name}")
        return safe_name

    return basename


@router.post("/")
async def upload_document(file: UploadFile) -> JSONResponse:
    """
    Upload and parse a document for analysis.

    Accepts PDF, DOCX, or TXT files up to 10MB. The document is parsed
    and stored temporarily for subsequent analysis requests.

    Args:
        file: Uploaded file from multipart form data.

    Returns:
        JSONResponse with upload_id for analysis requests.

    Raises:
        HTTPException(400): If file type or size is invalid.
        HTTPException(500): If document parsing fails.

    Example:
        ```
        POST /upload/
        Content-Type: multipart/form-data
        file: <contract.pdf>

        Response: {"success": true, "upload_id": "upload_abc123..."}
        ```
    """
    # SECURITY: Sanitize filename to prevent path traversal
    try:
        safe_filename = sanitize_filename(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Validate extension
    extension = Path(safe_filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        logger.warning(f"Rejected file with unsupported extension: {extension}")
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {list(ALLOWED_EXTENSIONS)}"
        )

    # Validate MIME type if provided
    if file.content_type and file.content_type not in ALLOWED_MIMETYPES:
        logger.warning(f"Rejected file with invalid MIME type: {file.content_type}")
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type: {file.content_type}"
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        logger.warning(f"Rejected oversized file: {len(contents)} bytes")
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // 1024 // 1024}MB"
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    logger.info(f"Processing upload: {safe_filename} ({len(contents)} bytes)")

    # Save to temp file for parsing
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        tmp.write(contents)
        tmp_path = Path(tmp.name)

    try:
        # Parse document
        parser = DocumentParserFactory().get_parser(tmp_path)
        text = parser.parse(tmp_path)

        if not text or len(text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Document appears to be empty or could not be read"
            )

        # Generate upload ID and store text
        upload_id = f"upload_{uuid.uuid4().hex[:12]}"
        store_uploaded_text(upload_id, text)

        logger.info(f"Upload successful: {upload_id} ({len(text)} chars extracted)")

        return JSONResponse({
            "success": True,
            "upload_id": upload_id,
            "filename": safe_filename,
            "text_length": len(text),
            "text_preview": text[:500] + "..." if len(text) > 500 else text,
        })

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise

    except Exception as e:
        # SECURITY: Log full error internally, return generic message to client
        logger.error(f"Document parsing failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to parse document. Please ensure the file is valid and not corrupted."
        )

    finally:
        # Cleanup temp file
        try:
            if tmp_path.exists():
                tmp_path.unlink()
        except Exception as cleanup_error:
            logger.warning(f"Failed to cleanup temp file: {cleanup_error}")
