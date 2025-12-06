"""
Tests for the health check endpoint.
"""


def test_health_check_returns_healthy(client):
    """Test that /health returns status healthy."""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "contract-negotiator-backend"
