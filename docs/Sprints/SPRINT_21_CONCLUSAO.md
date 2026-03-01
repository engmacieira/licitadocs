# 🏁 Log de Sprint: 21 - Motor de Automação de Certidões (Strategy Pattern)

**Período:** (Preencha a data de hoje)
**Status:** Concluído
**Foco:** Construir a arquitetura base (Backend e Banco de Dados) para a automação de busca de certidões.

## 🚀 Entregas Realizadas
* **[Banco de Dados]** Tabela `document_automation_configs` criada via Alembic (Migration manual). Relação 1:1 estabelecida com `DocumentType`.
* **[Backend/Arquitetura]** Padrão *Strategy* implementado via `CrawlerFactory`. O backend agora pode estanciar robôs de forma polimórfica usando a string `strategy_name`.
* **[Frontend]** Modal de Tipos de Documentos (`TypeModal` no Admin) atualizado para enviar e receber configurações de automação via *Nested JSON*.
* **[Scripting]** O `seed_document_types.py` foi atualizado para semear as configurações de automação nativamente, incluindo lógica de retrocompatibilidade.

## 🧠 Retrospectiva (O Como)
### ✅ O que funcionou bem?
* O uso de Pydantic para aninhar a criação das duas tabelas (Catálogo + Automação) numa única chamada de API limpou bastante a complexidade do frontend.
* A separação da lógica de extração na pasta `app/services/crawlers/` deixou o router de documentos intacto.

### ⚠️ Lições Aprendidas / Obstáculos
* Tivemos uma falha de "cego" no Alembic porque o ficheiro `env.py` não conseguiu detectar a nova modelagem automaticamente. A solução (e lição) foi assumir o controlo e escrever a *migration* DDL à mão em Python, garantindo precisão e confiança no esquema final.

---
**Status Final:** Arquitetura Base 100% pronta para começar a receber a lógica de *Scraping* real ou integrações via API (ex: Receita Federal).