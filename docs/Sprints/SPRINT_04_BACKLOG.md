# 🗺️ Sprint 04: O Consultor de Licitações (IA Chat)

**Objetivo:** Implementar um assistente conversacional (Chatbot) que atua como um especialista em licitações. Ele traduz os termos complexos dos editais para os documentos padronizados da plataforma e auxilia na redação de declarações.
**Status:** Planejamento
**Tecnologia:** Google Gemini API.

---

## 🎯 Backlog de Funcionalidades

### 🧠 1. Infraestrutura de IA
* **[US-07] Configuração do Gemini Client**
    * Instalar SDK `google-generativeai`.
    * Configurar `GOOGLE_API_KEY` no `.env`.
    * Criar módulo `app/core/ai_client.py` centralizando a conexão.

### 📚 2. Base de Conhecimento (Contexto)
* **[US-08] Catálogo de Documentos**
    * Criar uma lista padronizada (Enum ou Tabela) de documentos que a LicitaDoc oferece (Ex: "CND Federal", "CND Trabalhista", "Balanço Patrimonial", "Atestado de Capacidade").
    * **Objetivo:** A IA precisa receber essa lista no prompt para saber o que temos disponível.

### 💬 3. O Chatbot (Consultor)
* **[US-09] Endpoint de Chat (`POST /ai/chat`)**
    * Input: Mensagem do usuário (ex: "O edital pede 'Prova de Regularidade com a Seguridade Social'. O que é isso?").
    * Processamento: O sistema monta um prompt injetando o Catálogo ([US-08]) + a Pergunta.
    * Prompt System: *"Você é um especialista em licitações. O usuário perguntará sobre um termo. Compare com a lista abaixo e diga qual documento corresponde. Se for uma declaração, redija o texto."*
    * Output: Resposta explicativa.

* **[US-10] Gerador de Declarações**
    * Funcionalidade onde o usuário pede: *"Gere uma declaração de que não emprego menores"*.
    * A IA devolve o texto formal pronto para copiar e colar (ou salvar como PDF futuramente).

---

## 🛠️ Plano Técnico de Execução

1.  **Setup:** Configurar API Key do Gemini.
2.  **Core:** Criar função `ask_gemini(message: str, context: list)`.
3.  **Router:** Criar `ai_router.py` com a rota de chat.
4.  **Teste:**
    * Pergunta: *"Preciso da Certidão de Falência e Concordata."*
    * Resposta Esperada da IA: *"No nosso sistema, isso corresponde à **Certidão de Distibuição Cível**. Pode usar esse documento."*

---

## 📝 Definição de Pronto (DoD)
* [ ] Rota `/ai/chat` funcionando.
* [ ] IA consegue identificar corretamente que "Prova de Regularidade com o FGTS" = "CRF do FGTS".
* [ ] IA consegue gerar um texto de "Declaração de Idoneidade" quando solicitado.
* [ ] O catálogo de documentos do sistema é enviado no contexto da IA.