"""
Pytest configuration and fixtures for ContractAI Backend tests.

This module provides common fixtures for testing FastAPI endpoints,
mocking external services, and generating test data.
"""
import io
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

# Import the FastAPI app
import sys
sys.path.insert(0, str(__file__).rsplit('/tests', 1)[0])
from src.presentation.api.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_analysis_response():
    """Standard mock response for contract analysis."""
    return {
        "contract_type": "Test Contract Agreement",
        "overall_risk": "medium",
        "summary": "This is a test contract with moderate risk clauses.",
        "clauses": [
            {
                "clause_id": "CLAUSE 1",
                "original_text": "The tenant agrees to pay rent monthly.",
                "topic": "Payment Terms",
                "risk_level": "low",
                "risk_explanation": "Standard payment clause with clear terms.",
                "law_reference": "Civil Code Art. 1234",
                "suggested_rewrite": "The tenant agrees to pay rent on the first day of each month."
            },
            {
                "clause_id": "CLAUSE 2",
                "original_text": "Landlord may terminate at any time.",
                "topic": "Termination",
                "risk_level": "high",
                "risk_explanation": "Unilateral termination clause favoring landlord.",
                "law_reference": "Tenant Protection Act Section 5",
                "suggested_rewrite": "Either party may terminate with 30 days written notice."
            },
            {
                "clause_id": "CLAUSE 3",
                "original_text": "No pets allowed.",
                "topic": "Restrictions",
                "risk_level": "medium",
                "risk_explanation": "Common restriction but may limit tenant options.",
                "law_reference": None,
                "suggested_rewrite": None
            }
        ],
        "total_issues": 2,
        "recommendation": "NEGOTIATE"
    }


@pytest.fixture
def mock_ollama_gateway(mock_analysis_response):
    """Mock the OllamaGateway for testing without LLM calls."""
    with patch('src.presentation.api.routes.analysis.get_llm_gateway') as mock:
        gateway_instance = MagicMock()
        gateway_instance.analyze_contract = AsyncMock(return_value=mock_analysis_response)
        mock.return_value = gateway_instance
        yield mock


@pytest.fixture
def sample_txt_file():
    """Create a sample TXT file for upload testing."""
    content = b"This is a test contract document.\n\nCLAUSE 1: Test clause content."
    return io.BytesIO(content)


@pytest.fixture
def sample_pdf_content():
    """Create minimal PDF-like content for testing."""
    # Real PDF parsing requires actual PDF bytes, using text fallback
    return b"%PDF-1.4\nTest PDF content"


@pytest.fixture
def sample_docx_content():
    """Create minimal DOCX-like content for testing."""
    # Real DOCX parsing requires actual DOCX bytes
    return b"PK\x03\x04Test DOCX content"


@pytest.fixture
def clear_storage():
    """Clear the in-memory storage before and after tests."""
    from src.presentation.api.routes.storage import _uploaded_texts, _storage_lock

    with _storage_lock:
        _uploaded_texts.clear()

    yield

    with _storage_lock:
        _uploaded_texts.clear()


@pytest.fixture
def stored_upload_id(clear_storage):
    """Create a stored upload for testing analysis endpoints."""
    from src.presentation.api.routes.storage import store_uploaded_text

    upload_id = "test-upload-123"
    text = "This is a test contract for analysis."
    store_uploaded_text(upload_id, text)

    return upload_id
