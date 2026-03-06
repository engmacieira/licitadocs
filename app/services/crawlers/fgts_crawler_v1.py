"""
Robô Real para CRF FGTS (Caixa Econômica Federal).
Utiliza Playwright para navegação num sistema JSF legado e interceção do PDF.
"""
from datetime import datetime, timedelta
from app.services.crawlers.base_crawler import BaseCrawler
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

class FGTSCrawlerV1(BaseCrawler):
    def fetch(self) -> dict:
        cnpj_cru = self.execution_params.get("cnpj")
        
        if not cnpj_cru:
            return {"success": False, "message": "CNPJ não fornecido para a busca."}

        cnpj_limpo = "".join(filter(str.isdigit, cnpj_cru))
        print(f"🤖 [ROBÔ FGTS]: A iniciar navegador fantasma para o CNPJ {cnpj_limpo}...")

        try:
            # Iniciamos o Playwright de forma síncrona
            with sync_playwright() as p:
                # headless=True significa que o navegador não vai abrir janela visível
                browser = p.chromium.launch(headless=True)
                
                # Criamos um contexto preparado para aceitar downloads
                context = browser.new_context(accept_downloads=True)
                page = context.new_page()

                # 1. Aceder ao portal da Caixa
                url_caixa = "https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf"
                page.goto(url_caixa, wait_until="domcontentloaded") # Espera apenas o DOM básico carregar

                # 2. Preencher o formulário (MIRA MELHORADA)
                # O sistema PrimeFaces/JSF da Caixa costuma usar a classe .ui-inputtext
                try:
                    input_cnpj = page.locator("input.ui-inputtext, input[id*='inscricao'], input[type='text']").first
                    input_cnpj.wait_for(state="visible", timeout=15000)
                    input_cnpj.fill(cnpj_limpo)
                except PlaywrightTimeoutError:
                    browser.close()
                    return {"success": False, "message": "O site da Caixa não carregou o campo de CNPJ a tempo. Tente novamente."}
                
                # 3. Clicar em Consultar
                page.get_by_role("button", name="Consultar").click()

                # 4. Esperar que o sistema da Caixa processe a resposta
                # Se a empresa estiver regular, vai aparecer um botão para "Obter Certidão"
                try:
                    # Esperamos até 10 segundos pelo botão de imprimir/obter
                    botao_obter = page.get_by_role("button", name="Obter Certidão")
                    botao_obter.wait_for(timeout=10000)
                except PlaywrightTimeoutError:
                    browser.close()
                    return {
                        "success": False, 
                        "message": "Empresa com pendências no FGTS ou site da Caixa instável (Botão 'Obter' não encontrado)."
                    }

                # 5. Clicar no botão e intercetar o Download do PDF
                with page.expect_download() as download_info:
                    botao_obter.click()
                
                download = download_info.value
                
                # Lemos os raw bytes do ficheiro descarregado diretamente para a memória
                with open(download.path(), "rb") as f:
                    pdf_bytes = f.read()
                
                browser.close()

                # 6. Formatar o sucesso
                # FGTS costuma ter validade de 30 dias
                expiration = datetime.now() + timedelta(days=30)
                
                return {
                    "success": True,
                    "message": "CRF do FGTS emitido com sucesso via Playwright.",
                    "file_metadata": {
                        "filename": f"crf_fgts_{cnpj_limpo}.pdf",
                        "expiration_date": expiration.date(),
                        "is_structured": True
                    },
                    "file_content": pdf_bytes
                }

        except Exception as e:
            return {"success": False, "message": f"Erro inesperado no Webdriver: {str(e)}"}