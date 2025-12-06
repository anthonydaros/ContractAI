"""
Tests for the contracts endpoints.
"""


class TestListContracts:
    """Tests for GET /contracts/"""

    def test_list_contracts_returns_all(self, client):
        """Test that listing contracts returns all mock contracts."""
        response = client.get("/contracts/")

        assert response.status_code == 200
        data = response.json()
        assert "contracts" in data
        assert len(data["contracts"]) == 3  # fair, abusive, confusing

    def test_list_contracts_response_format(self, client):
        """Test that contract list items have correct structure."""
        response = client.get("/contracts/")

        assert response.status_code == 200
        contracts = response.json()["contracts"]

        for contract in contracts:
            assert "id" in contract
            assert "name" in contract
            assert "description" in contract
            assert "risk_level" in contract
            assert "preview" in contract
            assert contract["preview"].endswith("...")


class TestGetContract:
    """Tests for GET /contracts/{contract_id}"""

    def test_get_contract_by_id_success(self, client):
        """Test retrieving a specific contract by ID."""
        response = client.get("/contracts/fair")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "fair"
        assert data["name"] == "Fair Rental Agreement"
        assert data["risk_level"] == "low"
        assert "content" in data
        assert len(data["content"]) > 0

    def test_get_contract_by_id_not_found(self, client):
        """Test that non-existent contract returns 404."""
        response = client.get("/contracts/nonexistent")

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_get_abusive_contract(self, client):
        """Test retrieving the abusive contract."""
        response = client.get("/contracts/abusive")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "abusive"
        assert data["risk_level"] == "high"

    def test_get_confusing_contract(self, client):
        """Test retrieving the confusing contract."""
        response = client.get("/contracts/confusing")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "confusing"
        assert data["risk_level"] == "medium"
