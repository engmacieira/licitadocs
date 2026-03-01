"""
Robô Prova de Conceito (Mock) para CND Trabalhista (TST).
"""
from app.services.crawlers.base_crawler import BaseCrawler

class TSTCrawlerPoC(BaseCrawler):
    def fetch(self) -> dict:
        # Pega o CNPJ que a fábrica vai injetar nos parâmetros
        cnpj_alvo = self.execution_params.get("cnpj", "CNPJ NÃO INFORMADO")
        
        print(f"🤖 [ROBÔ TST]: A iniciar a extração da CND Trabalhista para o CNPJ {cnpj_alvo}...")
        print(f"🤖 [ROBÔ TST]: A resolver Captcha (Simulação)...")
        print(f"🤖 [ROBÔ TST]: PDF descarregado com sucesso!")
        
        # O formato de resposta padronizado que o nosso sistema vai esperar
        return {
            "success": True,
            "message": "Certidão TST gerada com sucesso.",
            "file_metadata": {
                "filename": f"cnd_tst_{cnpj_alvo}.pdf",
                "expiration_days": 180,
                "is_structured": True
            }
        }