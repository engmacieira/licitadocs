# 🚀 Guia do Projeto LicitaDoc

**Visão do Produto:** Plataforma "Concierge" de Gestão de Documentos para Licitações.
**Status Atual:** v0.7.0 (Multi-Tenancy Stable).

## 🎯 O Modelo de Negócio (Concierge)
Diferente de um Google Drive, aqui **o Cliente não trabalha**.
1.  **Cliente:** Entra para consultar se a empresa está apta (Dashboard) e baixar certidões.
2.  **Operação (Nós):** Buscamos, validamos e subimos os documentos para o cliente.
3.  **IA:** Atua como "Tradutor Jurídico", explicando o conteúdo das certidões para o cliente.

## 🏗️ Estado Técnico (v0.7.0)
* **Backend:** Pronto para isolar dados. Um cliente só vê o que é dele.
* **Frontend:**
    * Login: ✅ Funcionando.
    * Upload: ✅ Funcionando (Tecnicamente), mas precisará ser movido para a área Admin.
    * IA Chat: 🚧 Existente, mas genérico (precisa virar Contextual/RAG).

## 📍 Próximos Passos (Sprint 08)
O foco agora é **Separar as Visões**:
1.  **Criar Dashboard do Cliente:** Uma tela "Vitrine" onde ele vê os documentos (mas não edita).
2.  **Refinar Upload (Admin):** Permitir que o Admin selecione *para qual empresa* está enviando o documento.
3.  **IA Contextual:** Fazer o chat responder perguntas sobre um documento específico da lista.

## 🛠️ Comandos Úteis
* **Backend:** `uvicorn app.main:app --reload`
* **Frontend:** `npm run dev`
* **Criar Admin:** `python -m app.scripts.create_first_admin`
* **Testes:** `python -m pytest`

# 🚀 Guia do Projeto LicitaDoc

**Visão do Produto:** Plataforma "Concierge" de Gestão de Documentos para Licitações.
**Status Atual:** v0.8.0 (MVP Operacional).

## 🎯 O Fluxo de Uso
1.  **O Cliente Contrata:** Admin cria a empresa no sistema.
2.  **A Operação Trabalha:** Admin acessa `/admin/upload`, seleciona o cliente e sobe as certidões com data de validade.
3.  **O Cliente Consulta:** Acessa `/dashboard` para baixar o PDF ou perguntar para a IA ("Tenho certidão de falência?").

## 🏗️ Stack Tecnológico
* **Frontend:** React + Tailwind + Lucide Icons.
* **Backend:** FastAPI + SQLite + SQLAlchemy.
* **IA:** Google Gemini 2.0 Flash (via `google-genai`).

## 🛠️ Comandos Essenciais
* **Backend:** `uvicorn app.main:app --reload`
* **Frontend:** `npm run dev`
* **Criar Admin:** `python -m app.scripts.create_first_admin`

## 📍 Roteiro de Desenvolvimento
* [x] **Sprint 01-06:** Configuração, Banco, Auth.
* [x] **Sprint 07:** Multi-Tenancy (Isolamento de Dados).
* [x] **Sprint 08:** Modelo Concierge (Admin Upload + Chat Contextual).
* [ ] **Sprint 09:** Notificações de Vencimento (E-mail/Zap).