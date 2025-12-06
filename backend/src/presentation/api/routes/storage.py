"""
In-memory storage for uploaded document texts.

This module provides thread-safe temporary storage for document text
extracted during upload, enabling subsequent analysis requests.

Note: This is MVP-only storage. For production, use Redis or a database
with proper TTL and persistence.

@module routes/storage
"""
import logging
import threading
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

# Configure module logger
logger = logging.getLogger(__name__)

# Thread-safe lock for storage operations
_storage_lock = threading.Lock()

# In-memory storage with timestamp for expiration
_uploaded_texts: Dict[str, Dict[str, Any]] = {}

# Storage configuration
STORAGE_TTL_HOURS = 1  # Documents expire after 1 hour


def _cleanup_expired() -> None:
    """
    Remove expired entries from storage.

    Called internally during storage operations to prevent memory leaks.
    This is a simple MVP approach; production should use Redis TTL.
    """
    now = datetime.utcnow()
    expired_keys = [
        key for key, value in _uploaded_texts.items()
        if now - value["timestamp"] > timedelta(hours=STORAGE_TTL_HOURS)
    ]

    for key in expired_keys:
        del _uploaded_texts[key]
        logger.debug(f"Expired storage entry removed: {key}")

    if expired_keys:
        logger.info(f"Cleaned up {len(expired_keys)} expired storage entries")


def store_uploaded_text(upload_id: str, text: str) -> None:
    """
    Store uploaded document text for later analysis.

    Thread-safe storage of document text with automatic cleanup
    of expired entries.

    Args:
        upload_id: Unique identifier for the upload session.
        text: Extracted text content from the uploaded document.

    Example:
        >>> store_uploaded_text("upload_abc123", "Contract text here...")
    """
    with _storage_lock:
        # Cleanup expired entries before adding new one
        _cleanup_expired()

        _uploaded_texts[upload_id] = {
            "text": text,
            "timestamp": datetime.utcnow()
        }
        logger.debug(f"Stored text for upload_id: {upload_id} ({len(text)} chars)")


def get_uploaded_text(upload_id: str) -> Optional[str]:
    """
    Retrieve uploaded document text by ID.

    Thread-safe retrieval of previously stored document text.
    Returns None if the upload_id doesn't exist or has expired.

    Args:
        upload_id: Unique identifier from the upload session.

    Returns:
        The stored document text, or None if not found/expired.

    Example:
        >>> text = get_uploaded_text("upload_abc123")
        >>> if text:
        ...     analyze(text)
    """
    with _storage_lock:
        # Cleanup expired entries
        _cleanup_expired()

        entry = _uploaded_texts.get(upload_id)
        if entry is None:
            logger.debug(f"Upload not found: {upload_id}")
            return None

        # Check if entry has expired
        if datetime.utcnow() - entry["timestamp"] > timedelta(hours=STORAGE_TTL_HOURS):
            del _uploaded_texts[upload_id]
            logger.debug(f"Upload expired: {upload_id}")
            return None

        logger.debug(f"Retrieved text for upload_id: {upload_id}")
        return entry["text"]


def delete_uploaded_text(upload_id: str) -> bool:
    """
    Delete uploaded document text by ID.

    Thread-safe deletion of stored document text.

    Args:
        upload_id: Unique identifier from the upload session.

    Returns:
        True if the entry was deleted, False if not found.

    Example:
        >>> if delete_uploaded_text("upload_abc123"):
        ...     print("Deleted successfully")
    """
    with _storage_lock:
        if upload_id in _uploaded_texts:
            del _uploaded_texts[upload_id]
            logger.debug(f"Deleted upload: {upload_id}")
            return True
        return False


def get_storage_stats() -> Dict[str, int]:
    """
    Get storage statistics for monitoring.

    Thread-safe retrieval of storage statistics.

    Returns:
        Dict with 'count' (number of entries) and 'total_chars' (total text size).

    Example:
        >>> stats = get_storage_stats()
        >>> print(f"Stored: {stats['count']} documents")
    """
    with _storage_lock:
        _cleanup_expired()

        count = len(_uploaded_texts)
        total_chars = sum(len(entry["text"]) for entry in _uploaded_texts.values())

        return {
            "count": count,
            "total_chars": total_chars
        }
