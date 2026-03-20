import pytest
import requests
from unittest.mock import patch, MagicMock
from app.services.crawlers.tst_crawler_v1 import TSTCrawlerV1

@pytest.fixture
def crawler():
    return TSTCrawlerV1({"cnpj": "12.345.678/0001-90"})

@patch("app.services.crawlers.tst_crawler_v1.requests.get")
def test_tst_crawler_happy_path(mock_get, crawler):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.content = b"%PDF-test-content"
    mock_get.return_value = mock_response
    
    result = crawler.fetch()
    
    assert result["success"] is True
    assert "descarregada" in result["message"]
    assert result["file_content"] == b"%PDF-test-content"
    assert "expiration_date" in result["file_metadata"]

@patch("app.services.crawlers.tst_crawler_v1.requests.get")
def test_tst_crawler_http_error(mock_get, crawler):
    mock_response = MagicMock()
    mock_response.status_code = 403
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)
    mock_get.return_value = mock_response
    
    result = crawler.fetch()
    assert result["success"] is False
    assert "rejeitou a conexão: 403" in result["message"]

@patch("app.services.crawlers.tst_crawler_v1.requests.get")
def test_tst_crawler_timeout(mock_get, crawler):
    mock_get.side_effect = requests.exceptions.Timeout()
    result = crawler.fetch()
    assert result["success"] is False
    assert "Timeout" in result["message"]
