# 🏁 Log de Sprint: 04 - Inteligência Artificial (Consultor)

**Período:** 17/01/2026
**Status:** Concluído
**Foco:** Integração com LLM (Google Gemini) para assistência jurídica automatizada.

## 🚀 Entregas Realizadas (O Que)

* **[Infra]** Configuração do cliente `google-generativeai` e gestão segura de API Keys via `.env`.
* **[Knowledge Base]** Criação do `app/core/catalog.py`, contendo a definição oficial dos documentos aceitos pelo sistema.
* **[Service]** Implementação do `AIService` com engenharia de prompt para atuar como "Consultor de Licitações".
* **[API]** Novo endpoint `POST /ai/chat` que traduz dúvidas de editais para documentos do sistema.
* **[Qualidade]** Testes automatizados usando `unittest.mock` para simular o Google, garantindo testes rápidos e sem custo.

## 🧠 Retrospectiva (O Como)

### ✅ O que funcionou bem?
* **Adaptação de Escopo:** Percebemos que ler PDFs (OCR) era menos valioso agora do que explicar *o que* o edital pede. Pivotamos para um Chatbot Consultivo rapidamente.
* **Mocking nos Testes:** Decisão acertada de não chamar a API real do Google nos testes (`pytest`). Isso manteve a bateria de testes rodando em <1s e protegeu a cota da API Key.
* **Refatoração Pydantic:** Aproveitamos a sprint para modernizar os Schemas (`ConfigDict`), eliminando avisos de depreciação.

### ⚠️ Lições Aprendidas
* **Dependências Externas:** A biblioteca do Google mudou de nome/versão recentemente (`google.genai`), gerando warnings. Optamos por manter a versão estável atual e tratar a migração como débito técnico futuro.
* **Prompt Engineering:** O contexto do catálogo precisa ser mantido atualizado manualmente. No futuro, isso pode virar uma tabela no banco de dados.

---
**Assinatura:** Tech Lead & Dev (Matheus e Mark)