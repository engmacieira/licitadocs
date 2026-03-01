"""
Testes Unitários: Motor de Automação (Strategy Pattern).
Garante que a Fábrica consegue instanciar os robôs corretos e lidar com erros.
"""
import pytest
from app.services.crawlers.crawler_factory import CrawlerFactory
from app.services.crawlers.tst_crawler_poc import TSTCrawlerPoC

def test_crawler_factory_valid_strategy():
    """Cenário: A fábrica deve devolver a classe correta quando o nome for válido."""
    # Simulamos os parâmetros que viriam do banco/requisição
    params = {"cnpj": "12345678000190"}
    
    # Invocamos a fábrica
    crawler = CrawlerFactory.get_crawler("TST_CRAWLER_V1", execution_params=params)
    
    # 1. Validamos se a classe devolvida é realmente o robô do TST
    assert isinstance(crawler, TSTCrawlerPoC)
    
    # 2. Validamos se os parâmetros foram injetados corretamente no construtor
    assert crawler.execution_params["cnpj"] == "12345678000190"
    
    # 3. Validamos se a execução (mock) retorna a estrutura de dados exigida
    result = crawler.fetch()
    assert result["success"] is True
    assert result["file_metadata"]["is_structured"] is True
    assert "12345678000190" in result["file_metadata"]["filename"]

def test_crawler_factory_invalid_strategy():
    """Cenário: A fábrica deve dar um erro claro se o banco pedir um robô que não existe."""
    with pytest.raises(ValueError) as exc_info:
        CrawlerFactory.get_crawler("ROBO_INVENTADO_QUE_NAO_EXISTE")
    
    assert "não é suportada pelo sistema" in str(exc_info.value)

def test_crawler_factory_empty_strategy():
    """Cenário: A fábrica deve falhar se não passarmos nenhuma estratégia."""
    with pytest.raises(ValueError) as exc_info:
        CrawlerFactory.get_crawler("")
    
    assert "não foi fornecido" in str(exc_info.value)