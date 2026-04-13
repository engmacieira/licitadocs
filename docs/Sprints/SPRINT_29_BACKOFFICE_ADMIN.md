# 🗺️ Sprint 29: Backoffice e Gestão Administrativa (Fase 3)

**Objetivo:** Fortalecer as ferramentas de operação interna, permitindo que a equipe LicitaDocs gerencie cadastros, modere documentos e responda chamados com eficiência e filtros avançados.
**Status:** Planejamento
**Tecnologia Principal:** React, Tailwind CSS, FastAPI, PostgreSQL.

---

## 🎯 Backlog da Sprint (User Stories)

### 📦 1. Experiência Administrativa (Painel Global)
* **[ ] [US-2901] Triagem de Novas Empresas:** Criar componente na `/admin/dashboard` para listar empresas recém-cadastradas aguardando a flag `is_admin_verified`.
* **[ ] [US-2902] Filtro de Upload Avançado:** No ecrã `/admin/upload`, substituir o select de empresas por um Autocomplete com busca por Razão Social ou CNPJ.
* **[ ] [US-2903] Inbox de Alta Volumetria:** Implementar filtros avançados na `/admin/inbox` (Filtrar por empresa específica, status pendente e tipo de mensagem).

### 📦 2. Moderação e Inteligência do Cofre
* **[x] [US-2904] Separação Visual do Cofre:** No Dashboard do Cliente, criar distinção clara entre "Certidões Oficiais" (enviadas pelo Admin) e "Documentos Enviados para Análise" (enviados pelo Cliente).
* **[ ] [US-2905] Sistema de Avisos de Moderação:** Na tela de detalhes da empresa (Admin), criar componente para inserir alertas rápidos sobre erros em documentos (Ex: "RG ilegível", "CNPJ desatualizado").
* **[ ] [US-2906] Visão Detalhada do Cliente:** Expandir o componente "Dados do Cliente" na área admin para exibir: IE, IM, Endereço completo, telefone e dados completos do responsável legal.

### 📦 3. Correções e Ajustes Finos
* **[ ] [US-2907] Automação de Pendências:** Garantir que o campo "Pendências a Corrigir" salve o histórico corretamente e dispare um alerta automático para a Inbox do cliente.

---

## 🛠️ Plano Técnico de Execução

1.  **Frontend (Components):** 
    - Desenvolver o `CompanyAutocomplete` usando `react-select` ou similar.
    - Criar o `ModerationAlertModal` para inserção de avisos rápidos.
    - Refatorar a `UnifiedTable` do Dashboard do Cliente para incluir a coluna/badge "Origem" (Admin/Cliente).
2.  **Backend (API):**
    - Criar endpoint de listagem de empresas com suporte a busca textual (ILike).
    - Adicionar suporte a query params de filtro na rota de mensagens admin.

---

## 📝 Definição de Pronto (DoD)
* [ ] Admin consegue buscar e selecionar uma empresa em < 1s no upload.
* [ ] Avisos de moderação inseridos pelo Admin aparecem instantaneamente na Inbox do Cliente.
* [ ] Dashboard do Cliente diferencia visualmente os documentos por origem.
* [ ] Filtros na Inbox do Admin retornam resultados precisos.

---
**Assinatura:** Jules (Software Engineer) & Matheus (Product Owner)
