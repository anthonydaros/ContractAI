"""
Tests for the Ollama LLM Gateway.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import json

from src.infrastructure.llm.ollama_gateway import (
    OllamaGateway,
    get_llm_gateway,
    _gateway_instance,
    _gateway_lock
)


@pytest.fixture(autouse=True)
def reset_singleton():
    """Reset the singleton instance before each test."""
    import src.infrastructure.llm.ollama_gateway as gateway_module
    gateway_module._gateway_instance = None
    yield
    gateway_module._gateway_instance = None


class TestOllamaGatewayInit:
    """Tests for OllamaGateway initialization."""

    def test_init_with_defaults(self):
        """Test initialization with default values."""
        with patch.dict('os.environ', {}, clear=True):
            gateway = OllamaGateway()

            assert gateway.base_url == "http://localhost:11434"
            assert gateway.model == "llama3.1:8b"
            assert gateway.temperature == 0.3

    def test_init_with_env_vars(self):
        """Test initialization with environment variables."""
        env_vars = {
            "OLLAMA_BASE_URL": "https://test.ollama.com",
            "OLLAMA_API_KEY": "test-key",
            "OLLAMA_MODEL": "test-model"
        }

        with patch.dict('os.environ', env_vars, clear=True):
            gateway = OllamaGateway()

            assert gateway.base_url == "https://test.ollama.com"
            assert gateway.api_key == "test-key"
            assert gateway.model == "test-model"

    def test_init_with_explicit_args(self):
        """Test initialization with explicit arguments."""
        gateway = OllamaGateway(
            base_url="https://custom.ollama.com",
            api_key="custom-key",
            model="custom-model",
            temperature=0.7
        )

        assert gateway.base_url == "https://custom.ollama.com"
        assert gateway.api_key == "custom-key"
        assert gateway.model == "custom-model"
        assert gateway.temperature == 0.7


class TestSingletonPattern:
    """Tests for singleton pattern."""

    def test_singleton_pattern(self):
        """Test that get_llm_gateway returns same instance."""
        gateway1 = get_llm_gateway()
        gateway2 = get_llm_gateway()

        assert gateway1 is gateway2

    def test_singleton_creates_instance_once(self):
        """Test that singleton only creates one instance."""
        with patch('src.infrastructure.llm.ollama_gateway.OllamaGateway') as mock_class:
            mock_instance = MagicMock()
            mock_class.return_value = mock_instance

            # Call twice
            get_llm_gateway()
            get_llm_gateway()

            # Should only be called once
            mock_class.assert_called_once()


class TestGenerateText:
    """Tests for generate_text method."""

    @pytest.mark.asyncio
    async def test_generate_text_success(self):
        """Test successful text generation."""
        gateway = OllamaGateway()

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Generated response"

        with patch.object(gateway.client.chat.completions, 'create', return_value=mock_response):
            result = await gateway.generate_text("Test prompt")

        assert result == "Generated response"

    @pytest.mark.asyncio
    async def test_generate_text_with_system_message(self):
        """Test text generation with system message."""
        gateway = OllamaGateway()

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Response"

        with patch.object(gateway.client.chat.completions, 'create', return_value=mock_response) as mock_create:
            await gateway.generate_text("User prompt", system="System message")

            # Check that system message was included
            call_args = mock_create.call_args
            messages = call_args.kwargs['messages']
            assert len(messages) == 2
            assert messages[0]['role'] == 'system'
            assert messages[0]['content'] == 'System message'

    @pytest.mark.asyncio
    async def test_generate_text_error_handling(self):
        """Test error handling in text generation."""
        gateway = OllamaGateway()

        with patch.object(gateway.client.chat.completions, 'create', side_effect=Exception("API Error")):
            with pytest.raises(RuntimeError) as exc_info:
                await gateway.generate_text("Test prompt")

            assert "LLM generation failed" in str(exc_info.value)


class TestAnalyzeContract:
    """Tests for analyze_contract method."""

    @pytest.mark.asyncio
    async def test_analyze_contract_success(self):
        """Test successful contract analysis."""
        gateway = OllamaGateway()

        mock_json_response = json.dumps({
            "contract_type": "Test Contract",
            "overall_risk": "medium",
            "summary": "Test summary",
            "clauses": [
                {
                    "clause_id": "CLAUSE 1",
                    "original_text": "Test clause",
                    "topic": "General",
                    "risk_level": "low",
                    "risk_explanation": "No issues",
                    "law_reference": None,
                    "suggested_rewrite": None
                }
            ],
            "total_issues": 0,
            "recommendation": "SIGN"
        })

        with patch.object(gateway, 'generate_text', new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = mock_json_response

            result = await gateway.analyze_contract("Test contract text")

        assert result["contract_type"] == "Test Contract"
        assert result["overall_risk"] == "medium"
        assert len(result["clauses"]) == 1

    @pytest.mark.asyncio
    async def test_analyze_contract_with_code_blocks(self):
        """Test parsing JSON wrapped in markdown code blocks."""
        gateway = OllamaGateway()

        json_data = {
            "contract_type": "NDA",
            "overall_risk": "low",
            "summary": "Safe contract",
            "clauses": [],
            "total_issues": 0,
            "recommendation": "SIGN"
        }
        response_with_blocks = f"```json\n{json.dumps(json_data)}\n```"

        with patch.object(gateway, 'generate_text', new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = response_with_blocks

            result = await gateway.analyze_contract("Test contract")

        assert result["contract_type"] == "NDA"

    @pytest.mark.asyncio
    async def test_analyze_contract_invalid_json(self):
        """Test handling of invalid JSON response."""
        gateway = OllamaGateway()

        with patch.object(gateway, 'generate_text', new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = "This is not valid JSON"

            result = await gateway.analyze_contract("Test contract")

        # Should return error response instead of raising
        assert result["contract_type"] == "Unknown"
        assert "error" in result

    @pytest.mark.asyncio
    async def test_analyze_contract_llm_error(self):
        """Test handling of LLM errors during analysis."""
        gateway = OllamaGateway()

        with patch.object(gateway, 'generate_text', new_callable=AsyncMock) as mock_generate:
            mock_generate.side_effect = RuntimeError("LLM Error")

            with pytest.raises(RuntimeError) as exc_info:
                await gateway.analyze_contract("Test contract")

            assert "Contract analysis failed" in str(exc_info.value)


class TestExtractJson:
    """Tests for _extract_json method."""

    def test_extract_pure_json(self):
        """Test extracting pure JSON."""
        gateway = OllamaGateway()

        json_str = '{"key": "value"}'
        result = gateway._extract_json(json_str)

        assert json.loads(result) == {"key": "value"}

    def test_extract_json_from_markdown_block(self):
        """Test extracting JSON from ```json blocks."""
        gateway = OllamaGateway()

        response = 'Here is the result:\n```json\n{"key": "value"}\n```\nEnd'
        result = gateway._extract_json(response)

        assert json.loads(result) == {"key": "value"}

    def test_extract_json_from_plain_block(self):
        """Test extracting JSON from ``` blocks."""
        gateway = OllamaGateway()

        response = 'Result:\n```\n{"key": "value"}\n```'
        result = gateway._extract_json(response)

        assert json.loads(result) == {"key": "value"}

    def test_extract_json_from_text(self):
        """Test extracting embedded JSON from text."""
        gateway = OllamaGateway()

        response = 'The analysis shows {"key": "value"} in the contract.'
        result = gateway._extract_json(response)

        assert json.loads(result) == {"key": "value"}

    def test_extract_json_array(self):
        """Test extracting JSON array."""
        gateway = OllamaGateway()

        response = 'Found items: [{"id": 1}, {"id": 2}]'
        result = gateway._extract_json(response)

        assert json.loads(result) == [{"id": 1}, {"id": 2}]

    def test_extract_json_no_json_found(self):
        """Test error when no JSON found."""
        gateway = OllamaGateway()

        with pytest.raises(ValueError) as exc_info:
            gateway._extract_json("No JSON here")

        assert "No JSON structure found" in str(exc_info.value)

    def test_extract_json_object_before_array(self):
        """Test extracting JSON when object appears before array in text."""
        gateway = OllamaGateway()

        # Both object and array exist, but object ({) appears first
        response = 'Result: {"type": "obj"} and also [1, 2, 3] here'
        result = gateway._extract_json(response)

        assert json.loads(result) == {"type": "obj"}

    def test_extract_json_array_before_object(self):
        """Test extracting JSON when array appears before object in text."""
        gateway = OllamaGateway()

        # Both exist, but array ([) appears first
        response = 'Data: [1, 2, 3] and then {"key": "val"}'
        result = gateway._extract_json(response)

        assert json.loads(result) == [1, 2, 3]

    def test_extract_json_only_array_in_text(self):
        """Test extracting JSON array when no object exists."""
        gateway = OllamaGateway()

        # Only array, no object braces
        response = 'Items found: [{"a": 1}, {"b": 2}] end'
        result = gateway._extract_json(response)

        assert json.loads(result) == [{"a": 1}, {"b": 2}]

    def test_extract_json_array_only_no_objects(self):
        """Test extracting array when NO object braces exist in text."""
        gateway = OllamaGateway()

        # Pure array with no outer {} at all - only numbers
        response = 'Numbers: [1, 2, 3, 4, 5] end of list'
        result = gateway._extract_json(response)

        assert json.loads(result) == [1, 2, 3, 4, 5]


class TestFallbackClauseExtraction:
    """Tests for fallback clause extraction."""

    def test_fallback_extracts_numbered_clauses(self):
        """Test fallback extraction with numbered clauses."""
        gateway = OllamaGateway()

        text = """CLAUSE 1 - Introduction
This is the introduction.

CLAUSE 2 - Terms
These are the terms.

CLAUSE 3 - Conclusion
This is the conclusion."""

        clauses = gateway._fallback_clause_extraction(text)

        assert len(clauses) >= 2

    def test_fallback_with_no_clauses(self):
        """Test fallback when no clause markers found."""
        gateway = OllamaGateway()

        text = "This is just plain text with no clause markers."

        clauses = gateway._fallback_clause_extraction(text)

        # Should return full contract as single entry
        assert len(clauses) == 1
        assert clauses[0]["title"] == "Full Contract"


class TestGetEmbeddings:
    """Tests for get_embeddings method."""

    @pytest.mark.asyncio
    async def test_get_embeddings_success(self):
        """Test successful embedding generation."""
        gateway = OllamaGateway()

        mock_response = MagicMock()
        mock_response.data = [MagicMock()]
        mock_response.data[0].embedding = [0.1, 0.2, 0.3]

        with patch.object(gateway.client.embeddings, 'create', return_value=mock_response):
            result = await gateway.get_embeddings("Test text")

        assert result == [0.1, 0.2, 0.3]

    @pytest.mark.asyncio
    async def test_get_embeddings_error(self):
        """Test error handling in embedding generation."""
        gateway = OllamaGateway()

        with patch.object(gateway.client.embeddings, 'create', side_effect=Exception("Embedding error")):
            with pytest.raises(RuntimeError) as exc_info:
                await gateway.get_embeddings("Test text")

            assert "Embedding generation failed" in str(exc_info.value)


class TestExtractStructuredData:
    """Tests for extract_structured_data method."""

    @pytest.mark.asyncio
    async def test_extract_structured_data_success(self):
        """Test successful structured data extraction."""
        gateway = OllamaGateway()

        schema = {"name": "string", "date": "string"}
        mock_response = json.dumps({"name": "Test", "date": "2024-01-01"})

        with patch.object(gateway, 'generate_text', new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = mock_response

            result = await gateway.extract_structured_data("Test text", schema)

        assert result["name"] == "Test"
        assert result["date"] == "2024-01-01"

    @pytest.mark.asyncio
    async def test_extract_structured_data_failure(self):
        """Test handling of extraction failure."""
        gateway = OllamaGateway()

        with patch.object(gateway, 'generate_text', new_callable=AsyncMock) as mock_generate:
            mock_generate.side_effect = Exception("Extraction error")

            result = await gateway.extract_structured_data("Test", {})

        # Should return empty dict on failure
        assert result == {}


class TestExtractClauses:
    """Tests for extract_clauses method."""

    @pytest.mark.asyncio
    async def test_extract_clauses_success(self):
        """Test successful clause extraction."""
        gateway = OllamaGateway()

        mock_response = json.dumps([
            {"title": "Clause 1", "content": "First clause"},
            {"title": "Clause 2", "content": "Second clause"}
        ])

        with patch.object(gateway, 'generate_text', new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = mock_response

            result = await gateway.extract_clauses("Contract text")

        assert len(result) == 2
        assert result[0]["title"] == "Clause 1"

    @pytest.mark.asyncio
    async def test_extract_clauses_fallback(self):
        """Test fallback clause extraction when LLM fails."""
        gateway = OllamaGateway()

        contract_text = """CLAUSE 1 - Terms
The terms of agreement.

CLAUSE 2 - Payment
Payment details here."""

        with patch.object(gateway, 'generate_text', new_callable=AsyncMock) as mock_generate:
            mock_generate.side_effect = Exception("LLM Error")

            result = await gateway.extract_clauses(contract_text)

        # Should use fallback extraction
        assert len(result) >= 1
