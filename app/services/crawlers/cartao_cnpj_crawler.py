"""
Robô Real para Cartão CNPJ.
Consome a BrasilAPI (Gratuita) e gera um PDF estruturado em memória.
"""
import requests
from app.services.crawlers.base_crawler import BaseCrawler
from fpdf import FPDF

class CartaoCNPJCrawler(BaseCrawler):
    def fetch(self) -> dict:
        cnpj_cru = self.execution_params.get("cnpj")
        
        if not cnpj_cru:
            return {"success": False, "message": "CNPJ não fornecido para a busca."}

        cnpj_limpo = "".join(filter(str.isdigit, cnpj_cru))
        print(f"🤖 [ROBÔ CARTÃO CNPJ]: A consultar a BrasilAPI para o CNPJ {cnpj_limpo}...")

        try:
            # 1. Consulta HTTP à API aberta
            url = f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}"
            response = requests.get(url, timeout=10)
            
            # Se a empresa não existir na Receita, a API devolve 404
            if response.status_code == 404:
                return {"success": False, "message": "CNPJ não encontrado na base da Receita Federal."}
                
            response.raise_for_status()
            dados = response.json()

            # 2. "Desenhar" o PDF em Memória usando FPDF
            pdf = FPDF()
            pdf.add_page()
            
            # Título
            pdf.set_font("helvetica", "B", 14)
            pdf.cell(0, 10, "COMPROVANTE DE INSCRIÇÃO E SITUAÇÃO CADASTRAL", ln=True, align="C")
            pdf.ln(5)
            
            # Função auxiliar para criar as linhas da tabela
            def add_linha(rotulo, valor):
                pdf.set_font("helvetica", "B", 10)
                pdf.cell(50, 8, f"{rotulo}:", border=1)
                pdf.set_font("helvetica", "", 10)
                # Pega apenas os primeiros 75 caracteres para não quebrar a linha do PDF
                valor_str = str(valor)[:75] if valor else "N/A"
                pdf.cell(0, 8, f" {valor_str}", border=1, ln=True)

            # Preencher os dados
            add_linha("CNPJ", dados.get("cnpj", ""))
            add_linha("Razão Social", dados.get("razao_social", ""))
            add_linha("Nome Fantasia", dados.get("nome_fantasia", ""))
            add_linha("Situação Cadastral", dados.get("descricao_situacao_cadastral", ""))
            add_linha("Data de Abertura", dados.get("data_inicio_atividade", ""))
            add_linha("CNAE Principal", f"{dados.get('cnae_fiscal', '')} - {dados.get('cnae_fiscal_descricao', '')}")
            add_linha("Natureza Jurídica", dados.get("natureza_juridica", ""))
            add_linha("Município / UF", f"{dados.get('municipio', '')} / {dados.get('uf', '')}")

            # 3. Converter o PDF para bytes cru (o que o Orquestrador espera)
            # No fpdf2, pdf.output() retorna um bytearray nativamente
            pdf_bytes = bytes(pdf.output())

            return {
                "success": True,
                "message": "Cartão CNPJ gerado com sucesso via BrasilAPI.",
                "file_metadata": {
                    "filename": f"cartao_cnpj_{cnpj_limpo}.pdf",
                    "expiration_date": None, # Cartões CNPJ não têm validade estrita
                    "is_structured": True
                },
                "file_content": pdf_bytes
            }

        except requests.exceptions.Timeout:
            return {"success": False, "message": "A BrasilAPI demorou muito a responder."}
        except requests.exceptions.RequestException as e:
            return {"success": False, "message": f"Erro de comunicação com a API: {str(e)}"}
        except Exception as e:
            return {"success": False, "message": f"Erro interno ao desenhar o PDF: {str(e)}"}