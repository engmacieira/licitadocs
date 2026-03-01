"""
Robô Prova de Conceito (Mock) para CND Trabalhista (TST).
"""
from app.services.crawlers.base_crawler import BaseCrawler
from datetime import datetime, timedelta

class TSTCrawlerPoC(BaseCrawler):
    def fetch(self) -> dict:
        cnpj_alvo = self.execution_params.get("cnpj", "CNPJ_NAO_INFORMADO")
        
        print(f"🤖 [ROBÔ TST]: A iniciar a extração da CND Trabalhista para o CNPJ {cnpj_alvo}...")
        print(f"🤖 [ROBÔ TST]: A resolver Captcha (Simulação)...")
        print(f"🤖 [ROBÔ TST]: PDF descarregado com sucesso!")
        
        # Simula o arquivo PDF (em bytes) que baixaríamos da internet
        fake_pdf_content = b"%PDF-1.4\n%Fake TST Certificate Content\n%%EOF"
        
        # Simula uma validade de 180 dias
        expiration = datetime.now() + timedelta(days=180)
        
        return {
            "success": True,
            "message": "Certidão TST gerada com sucesso.",
            "file_metadata": {
                "filename": f"cnd_tst_{cnpj_alvo}.pdf",
                "expiration_date": expiration.date(),
                "is_structured": True
            },
            # 🔥 O robô agora devolve os raw bytes do arquivo baixado
            "file_content": fake_pdf_content 
        }