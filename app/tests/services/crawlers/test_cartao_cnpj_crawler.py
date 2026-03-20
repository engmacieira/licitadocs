import pytest
import requests
from unittest.mock import patch, MagicMock
from app.services.crawlers.cartao_cnpj_crawler import CartaoCNPJCrawler

@pytest.fixture
def crawler():
    return CartaoCNPJCrawler({"cnpj": "12.345.678/0001-90"})

@patch("app.services.crawlers.cartao_cnpj_crawler.requests.get")
def test_cartao_cnpj_crawler_happy_path(mock_get, crawler):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "cnpj": "12345678000190",
        "razao_social": "EMPRESA DE TESTE LTDA",
        "descricao_situacao_cadastral": "ATIVA",
        "data_inicio_atividade": "2020-01-01"
    }
    mock_get.return_value = mock_response
    
    # Execute
    result = crawler.fetch()
    
    # Verify
    assert result["success"] is True
    assert "sucesso" in result["message"]
    assert result["file_metadata"]["filename"] == "cartao_cnpj_12345678000190.pdf"
    assert "file_content" in result
    assert isinstance(result["file_content"], bytes)

def test_cartao_cnpj_crawler_missing_cnpj():
    crawler_no_cnpj = CartaoCNPJCrawler({})
    result = crawler_no_cnpj.fetch()
    assert result["success"] is False
    assert "não fornecido" in result["message"]

@patch("app.services.crawlers.cartao_cnpj_crawler.requests.get")
def test_cartao_cnpj_crawler_not_found(mock_get, crawler):
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_get.return_value = mock_response
    
    result = crawler.fetch()
    assert result["success"] is False
    assert "encontrado" in result["message"]

@patch("app.services.crawlers.cartao_cnpj_crawler.requests.get")
def test_cartao_cnpj_crawler_timeout(mock_get, crawler):
    mock_get.side_effect = requests.exceptions.Timeout()
    
    result = crawler.fetch()
    assert result["success"] is False
    assert "demorou muito" in result["message"]

@patch("app.services.crawlers.cartao_cnpj_crawler.requests.get")
def test_cartao_cnpj_crawler_network_error(mock_get, crawler):
    mock_get.side_effect = requests.exceptions.RequestException("Network down")
    
    result = crawler.fetch()
    assert result["success"] is False
    assert "Erro de comunicação" in result["message"]
