# 🏁 Log de Sprint: Sprint 08 - Operação Concierge & IA Contextual

**Período:** [Data]
**Status:** ✅ Concluído
**Versão:** v0.8.0 (MVP Concierge)

## 🚀 Entregas Realizadas
1.  **[Admin] Painel de Controle:**
    * Dashboard exclusivo para listar empresas clientes.
    * Upload Administrativo: Envio de arquivos em nome do cliente com definição de validade.
2.  **[Cliente] Cofre Digital:**
    * Interface "Read-Only": Cliente vê, busca e baixa, mas não altera.
    * Semáforo de Validade: Badges (Verde/Amarelo/Vermelho) baseados na data de expiração.
3.  **[IA] Agente Concierge (RAG Simples):**
    * Chatbot flutuante no Dashboard.
    * "Bibliotecário": A IA lê o banco de dados do cliente e responde apenas com base no que existe lá.
    * Filtro de Assunto: Ignora perguntas fora do contexto (ex: futebol).
4.  **[Core] Segurança & Rotas:**
    * Login Inteligente: Redireciona `/admin/dashboard` ou `/dashboard` baseado na role.
    * Proteção de Dados: Garantia que o chat de um cliente não acessa dados de outro.

## 🛠️ Mudanças Técnicas
* **Backend:** * Atualização para `google-genai` (SDK v2).
    * Novos campos em `Document`: `expiration_date`, `uploaded_by_id`.
    * Endpoint `/ai/chat` agora busca contexto no Banco de Dados.
* **Frontend:**
    * Nova estrutura de pastas: `pages/Admin` vs `pages/Dashboard`.
    * Componente `ChatWidget` flutuante.

## 🔮 Próximos Passos (Sprint 09)
Agora que o processo manual funciona, podemos começar a automatizar:
* **Automação:** Robôs para buscar certidões no governo automaticamente?
* **Notificações:** E-mail avisando que o documento venceu?
* **Pagamentos:** Bloquear acesso se não pagar?