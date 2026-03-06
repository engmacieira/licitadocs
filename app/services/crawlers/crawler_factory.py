"""
Fábrica de Robôs (Strategy Factory).
Mapeia os nomes das estratégias (do Banco de Dados) para as classes Python corretas.
"""
from typing import Type, Dict, Any
from app.services.crawlers.base_crawler import BaseCrawler
from app.services.crawlers.tst_crawler_v1 import TSTCrawlerV1
from app.services.crawlers.cartao_cnpj_crawler import CartaoCNPJCrawler 
# 🔥 Importamos o robô do FGTS
from app.services.crawlers.fgts_crawler_v1 import FGTSCrawlerV1

class CrawlerFactory:
    
    _strategies: Dict[str, Type[BaseCrawler]] = {
        "TST_CRAWLER_V1": TSTCrawlerV1,
        "CARTAO_CNPJ_BRASIL_API": CartaoCNPJCrawler,
        # 🔥 Registamos a estratégia
        "FGTS_CRAWLER_V1": FGTSCrawlerV1, 
    }

    @classmethod
    def get_crawler(cls, strategy_name: str, execution_params: Dict[str, Any] = None) -> BaseCrawler:
        if not strategy_name:
            raise ValueError("O nome da estratégia (strategy_name) não foi fornecido.")
        
        crawler_class = cls._strategies.get(strategy_name)
        
        if not crawler_class:
            raise ValueError(f"A Estratégia '{strategy_name}' não é suportada pelo sistema ou não foi implementada.")
        
        return crawler_class(execution_params)