"""
Fábrica de Robôs (Strategy Factory).
Mapeia os nomes das estratégias (do Banco de Dados) para as classes Python corretas.
"""
from typing import Type, Dict, Any
from app.services.crawlers.base_crawler import BaseCrawler
from app.services.crawlers.tst_crawler_poc import TSTCrawlerPoC

class CrawlerFactory:
    
    # O "Dicionário de De-Para". Para adicionar um robô novo no futuro, 
    # basta importá-lo e adicionar uma linha aqui!
    _strategies: Dict[str, Type[BaseCrawler]] = {
        "TST_CRAWLER_V1": TSTCrawlerPoC,
        # "RECEITA_FEDERAL_API": ReceitaFederalAPI,
        # "SEFAZ_SP_SCRAPER": SefazSPScraper,
    }

    @classmethod
    def get_crawler(cls, strategy_name: str, execution_params: Dict[str, Any] = None) -> BaseCrawler:
        """
        Instancia e devolve o robô correto baseado no nome da estratégia.
        """
        if not strategy_name:
            raise ValueError("O nome da estratégia (strategy_name) não foi fornecido.")
        
        # Procura a classe correspondente no dicionário
        crawler_class = cls._strategies.get(strategy_name)
        
        if not crawler_class:
            raise ValueError(f"A Estratégia '{strategy_name}' não é suportada pelo sistema ou não foi implementada.")
        
        # Devolve a classe já instanciada com os parâmetros (O Robô pronto a usar)
        return crawler_class(execution_params)