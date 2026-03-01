"""
Fábrica de Robôs (Strategy Factory).
Mapeia os nomes das estratégias (do Banco de Dados) para as classes Python corretas.
"""
from typing import Type, Dict, Any
from app.services.crawlers.base_crawler import BaseCrawler
# Removemos o PoC e importamos o Real
from app.services.crawlers.tst_crawler_v1 import TSTCrawlerV1 

class CrawlerFactory:
    
    # O "Dicionário de De-Para". O banco pede a string, a fábrica devolve a classe!
    _strategies: Dict[str, Type[BaseCrawler]] = {
        "TST_CRAWLER_V1": TSTCrawlerV1,
    }

    @classmethod
    def get_crawler(cls, strategy_name: str, execution_params: Dict[str, Any] = None) -> BaseCrawler:
        if not strategy_name:
            raise ValueError("O nome da estratégia (strategy_name) não foi fornecido.")
        
        crawler_class = cls._strategies.get(strategy_name)
        
        if not crawler_class:
            raise ValueError(f"A Estratégia '{strategy_name}' não é suportada pelo sistema ou não foi implementada.")
        
        return crawler_class(execution_params)