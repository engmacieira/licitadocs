import pytest
from app.services.crawlers.crawler_factory import CrawlerFactory
from app.services.crawlers.tst_crawler_v1 import TSTCrawlerV1
from app.services.crawlers.cartao_cnpj_crawler import CartaoCNPJCrawler
from app.services.crawlers.fgts_crawler_v1 import FGTSCrawlerV1

def test_crawler_factory_get_all_registered_strategies():
    strategies = [
        ("TST_CRAWLER_V1", TSTCrawlerV1),
        ("CARTAO_CNPJ_BRASIL_API", CartaoCNPJCrawler),
        ("FGTS_CRAWLER_V1", FGTSCrawlerV1),
    ]
    
    for name, expected_class in strategies:
        crawler = CrawlerFactory.get_crawler(name, {"test": "param"})
        assert isinstance(crawler, expected_class)
        assert crawler.execution_params == {"test": "param"}

def test_crawler_factory_missing_name():
    with pytest.raises(ValueError) as exc:
        CrawlerFactory.get_crawler("")
    assert "não foi fornecido" in str(exc.value)

def test_crawler_factory_invalid_strategy():
    with pytest.raises(ValueError) as exc:
        CrawlerFactory.get_crawler("NON_EXISTENT_STRATEGY")
    assert "não é suportada" in str(exc.value)
