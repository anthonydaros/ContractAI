"""
Tests for the in-memory storage module.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

from src.presentation.api.routes.storage import (
    store_uploaded_text,
    get_uploaded_text,
    delete_uploaded_text,
    get_storage_stats,
    _uploaded_texts,
    _storage_lock,
    STORAGE_TTL_HOURS
)


@pytest.fixture(autouse=True)
def clear_storage_between_tests():
    """Clear storage before and after each test."""
    with _storage_lock:
        _uploaded_texts.clear()
    yield
    with _storage_lock:
        _uploaded_texts.clear()


class TestStoreAndRetrieve:
    """Tests for storing and retrieving text."""

    def test_store_and_retrieve_text(self):
        """Test basic store and retrieve functionality."""
        upload_id = "test-123"
        text = "This is test contract text."

        store_uploaded_text(upload_id, text)
        retrieved = get_uploaded_text(upload_id)

        assert retrieved == text

    def test_retrieve_nonexistent_id(self):
        """Test that retrieving non-existent ID returns None."""
        result = get_uploaded_text("nonexistent-id")
        assert result is None

    def test_store_multiple_texts(self):
        """Test storing multiple texts with different IDs."""
        store_uploaded_text("id1", "Text 1")
        store_uploaded_text("id2", "Text 2")
        store_uploaded_text("id3", "Text 3")

        assert get_uploaded_text("id1") == "Text 1"
        assert get_uploaded_text("id2") == "Text 2"
        assert get_uploaded_text("id3") == "Text 3"

    def test_overwrite_existing_text(self):
        """Test that storing with same ID overwrites."""
        upload_id = "same-id"
        store_uploaded_text(upload_id, "Original text")
        store_uploaded_text(upload_id, "Updated text")

        assert get_uploaded_text(upload_id) == "Updated text"


class TestDelete:
    """Tests for deleting stored text."""

    def test_delete_text(self):
        """Test deleting stored text."""
        upload_id = "to-delete"
        store_uploaded_text(upload_id, "Text to delete")

        result = delete_uploaded_text(upload_id)
        assert result is True
        assert get_uploaded_text(upload_id) is None

    def test_delete_nonexistent_returns_false(self):
        """Test that deleting non-existent returns False."""
        result = delete_uploaded_text("nonexistent")
        assert result is False


class TestStorageStats:
    """Tests for storage statistics."""

    def test_storage_stats_empty(self):
        """Test stats when storage is empty."""
        stats = get_storage_stats()

        assert stats["count"] == 0
        assert stats["total_chars"] == 0

    def test_storage_stats_with_data(self):
        """Test stats with stored data."""
        store_uploaded_text("id1", "Hello")  # 5 chars
        store_uploaded_text("id2", "World!")  # 6 chars

        stats = get_storage_stats()

        assert stats["count"] == 2
        assert stats["total_chars"] == 11


class TestTTLExpiration:
    """Tests for TTL-based expiration."""

    def test_ttl_expiration_on_retrieve(self):
        """Test that expired entries are not returned."""
        upload_id = "expired-id"

        # Store with backdated timestamp
        with _storage_lock:
            _uploaded_texts[upload_id] = {
                "text": "Expired text",
                "timestamp": datetime.utcnow() - timedelta(hours=STORAGE_TTL_HOURS + 1)
            }

        # Should return None for expired entry
        result = get_uploaded_text(upload_id)
        assert result is None

    def test_non_expired_entry_retrieved(self):
        """Test that non-expired entries are returned."""
        upload_id = "fresh-id"
        text = "Fresh text"

        store_uploaded_text(upload_id, text)
        result = get_uploaded_text(upload_id)

        assert result == text

    def test_cleanup_removes_expired_on_store(self):
        """Test that cleanup runs when storing new text."""
        # Create expired entry
        with _storage_lock:
            _uploaded_texts["old-id"] = {
                "text": "Old text",
                "timestamp": datetime.utcnow() - timedelta(hours=STORAGE_TTL_HOURS + 1)
            }

        # Store new entry (should trigger cleanup)
        store_uploaded_text("new-id", "New text")

        # Old entry should be gone
        with _storage_lock:
            assert "old-id" not in _uploaded_texts

    def test_expired_entry_deleted_on_retrieval(self):
        """Test that expired entry is deleted during retrieval check."""
        upload_id = "expiring-id"

        # Directly insert an expired entry bypassing cleanup
        with _storage_lock:
            _uploaded_texts[upload_id] = {
                "text": "Expiring text",
                "timestamp": datetime.utcnow() - timedelta(hours=STORAGE_TTL_HOURS + 1)
            }

        # Mock _cleanup_expired to do nothing so we hit the expiry check
        with patch('src.presentation.api.routes.storage._cleanup_expired'):
            result = get_uploaded_text(upload_id)

        assert result is None
        # Entry should be deleted
        with _storage_lock:
            assert upload_id not in _uploaded_texts
