"""
Tests for the analysis endpoint.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock


class TestAnalyzeMockContract:
    """Tests for analyzing mock contracts."""

    def test_analyze_mock_contract_success(self, client, mock_ollama_gateway):
        """Test successful analysis of a mock contract."""
        response = client.post(
            "/analyze/",
            json={"source": "mock", "contract_id": "fair"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "analysis_id" in data
        assert data["contract_id"] == "fair"
        assert data["contract_name"] == "Fair Rental Agreement"
        assert "clauses" in data
        assert len(data["clauses"]) > 0

    def test_analyze_abusive_contract(self, client, mock_ollama_gateway):
        """Test analysis of the abusive contract."""
        response = client.post(
            "/analyze/",
            json={"source": "mock", "contract_id": "abusive"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["contract_id"] == "abusive"
        assert data["contract_name"] == "Aggressive NDA"

    def test_analyze_confusing_contract(self, client, mock_ollama_gateway):
        """Test analysis of the confusing contract."""
        response = client.post(
            "/analyze/",
            json={"source": "mock", "contract_id": "confusing"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["contract_id"] == "confusing"

    def test_analyze_invalid_mock_id(self, client):
        """Test that invalid mock contract ID returns 400."""
        response = client.post(
            "/analyze/",
            json={"source": "mock", "contract_id": "nonexistent"}
        )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()

    def test_analyze_missing_contract_id(self, client):
        """Test that missing contract_id returns 400."""
        response = client.post(
            "/analyze/",
            json={"source": "mock"}
        )

        assert response.status_code == 400


class TestAnalyzeUploadedContract:
    """Tests for analyzing uploaded contracts."""

    def test_analyze_uploaded_contract_success(self, client, mock_ollama_gateway, stored_upload_id):
        """Test successful analysis of an uploaded contract."""
        response = client.post(
            "/analyze/",
            json={"source": "upload", "upload_id": stored_upload_id}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["contract_id"] == stored_upload_id
        assert "Uploaded Document" in data["contract_name"]

    def test_analyze_invalid_upload_id(self, client, clear_storage):
        """Test that invalid upload_id returns 400."""
        response = client.post(
            "/analyze/",
            json={"source": "upload", "upload_id": "invalid-upload-123"}
        )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower() or "expired" in response.json()["detail"].lower()

    def test_analyze_missing_upload_id(self, client):
        """Test that missing upload_id returns 400."""
        response = client.post(
            "/analyze/",
            json={"source": "upload"}
        )

        assert response.status_code == 400


class TestAnalysisResponseFormat:
    """Tests for analysis response structure."""

    def test_analyze_response_format(self, client, mock_ollama_gateway):
        """Test that analysis response has correct structure."""
        response = client.post(
            "/analyze/",
            json={"source": "mock", "contract_id": "fair"}
        )

        assert response.status_code == 200
        data = response.json()

        # Check required fields
        assert "analysis_id" in data
        assert "contract_id" in data
        assert "contract_name" in data
        assert "contract_type" in data
        assert "overall_risk" in data
        assert "summary" in data
        assert "clauses" in data
        assert "total_issues" in data
        assert "recommendation" in data
        assert "analyzed_at" in data

    def test_analyze_clause_structure(self, client, mock_ollama_gateway):
        """Test that clause responses have correct structure."""
        response = client.post(
            "/analyze/",
            json={"source": "mock", "contract_id": "fair"}
        )

        assert response.status_code == 200
        clauses = response.json()["clauses"]

        for clause in clauses:
            assert "clause_id" in clause
            assert "original_text" in clause
            assert "topic" in clause
            assert "risk_level" in clause
            assert "risk_explanation" in clause
            # Optional fields may be None
            assert "law_reference" in clause
            assert "suggested_rewrite" in clause

    def test_analyze_clause_without_suggestion(self, client, mock_analysis_response):
        """Test that clauses without suggestions are handled correctly."""
        # Modify response to have clause without suggestion
        mock_analysis_response["clauses"][2]["suggested_rewrite"] = None

        with patch('src.presentation.api.routes.analysis.get_llm_gateway') as mock:
            gateway_instance = MagicMock()
            gateway_instance.analyze_contract = AsyncMock(return_value=mock_analysis_response)
            mock.return_value = gateway_instance

            response = client.post(
                "/analyze/",
                json={"source": "mock", "contract_id": "fair"}
            )

        assert response.status_code == 200
        clauses = response.json()["clauses"]
        # Find clause without suggestion
        clause_without_suggestion = [c for c in clauses if c.get("suggested_rewrite") is None]
        assert len(clause_without_suggestion) >= 1


class TestAnalysisErrorHandling:
    """Tests for analysis error handling."""

    def test_analyze_llm_error_handling(self, client):
        """Test handling when LLM gateway raises an error."""
        with patch('src.presentation.api.routes.analysis.get_llm_gateway') as mock:
            gateway_instance = MagicMock()
            gateway_instance.analyze_contract = AsyncMock(
                side_effect=RuntimeError("LLM generation failed")
            )
            mock.return_value = gateway_instance

            response = client.post(
                "/analyze/",
                json={"source": "mock", "contract_id": "fair"}
            )

        assert response.status_code == 500
        assert "failed" in response.json()["detail"].lower()

    def test_analyze_contract_too_large(self, client, clear_storage):
        """Test that contracts over the size limit are rejected."""
        from src.presentation.api.routes.storage import store_uploaded_text

        # Create oversized content (over 100K chars)
        large_text = "x" * 100001
        upload_id = "large-upload-test"
        store_uploaded_text(upload_id, large_text)

        response = client.post(
            "/analyze/",
            json={"source": "upload", "upload_id": upload_id}
        )

        assert response.status_code == 413
        assert "too large" in response.json()["detail"].lower()

    def test_analyze_empty_contract_text(self, client, clear_storage):
        """Test that empty contract text returns 400."""
        from src.presentation.api.routes.storage import store_uploaded_text

        # Store empty/whitespace-only content
        upload_id = "empty-upload-test"
        store_uploaded_text(upload_id, "   ")

        response = client.post(
            "/analyze/",
            json={"source": "upload", "upload_id": upload_id}
        )

        assert response.status_code == 400
        assert "no contract text" in response.json()["detail"].lower()


class TestAnalysisRiskLevels:
    """Tests for different risk levels in analysis."""

    def test_analyze_all_risk_levels(self, client, mock_analysis_response):
        """Test that all risk levels are handled correctly."""
        # Add clauses with all risk levels
        mock_analysis_response["clauses"] = [
            {
                "clause_id": "CLAUSE 1",
                "original_text": "Low risk clause",
                "topic": "General",
                "risk_level": "low",
                "risk_explanation": "Safe clause",
                "law_reference": None,
                "suggested_rewrite": None
            },
            {
                "clause_id": "CLAUSE 2",
                "original_text": "Medium risk clause",
                "topic": "Payment",
                "risk_level": "medium",
                "risk_explanation": "Some concerns",
                "law_reference": None,
                "suggested_rewrite": "Improved text"
            },
            {
                "clause_id": "CLAUSE 3",
                "original_text": "High risk clause",
                "topic": "Liability",
                "risk_level": "high",
                "risk_explanation": "Significant issues",
                "law_reference": "Code Art. 123",
                "suggested_rewrite": "Better text"
            },
            {
                "clause_id": "CLAUSE 4",
                "original_text": "Critical risk clause",
                "topic": "Termination",
                "risk_level": "critical",
                "risk_explanation": "Major problems",
                "law_reference": "Law Section 456",
                "suggested_rewrite": "Completely revised"
            }
        ]

        with patch('src.presentation.api.routes.analysis.get_llm_gateway') as mock:
            gateway_instance = MagicMock()
            gateway_instance.analyze_contract = AsyncMock(return_value=mock_analysis_response)
            mock.return_value = gateway_instance

            response = client.post(
                "/analyze/",
                json={"source": "mock", "contract_id": "fair"}
            )

        assert response.status_code == 200
        clauses = response.json()["clauses"]

        risk_levels = [c["risk_level"] for c in clauses]
        assert "low" in risk_levels
        assert "medium" in risk_levels
        assert "high" in risk_levels
        assert "critical" in risk_levels
