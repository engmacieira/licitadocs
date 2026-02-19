# 🗺️ Sprint 14: Painel Administrativo & Gestão de Clientes

**Objetivo:** Implementar o fluxo de atendimento do Administrador, permitindo a gestão de empresas, auditoria de cadastro e upload manual de certidões.
**Metodologia:** Kanban (Foco em fluxo unitário).
**Status:** Planejado.

---

## 🎯 Backlog de Funcionalidades (Escopo)

### 📦 1. Navegação & Permissões
* **[US-34] Sidebar Contextual (Role-Based)**
    * **Problema:** "o links do sidebar todos remetem as funções do painel usuário".
    * **Solução:** O Sidebar deve renderizar menus diferentes baseados na role (`admin` vs `client`).
    * **Admin Vê:** Dashboard Geral, Empresas, Upload Global.
    * **Client Vê:** Dashboard Pessoal, Meus Documentos.

### 📦 2. Gestão de Empresas (CRM)
* **[US-35] Listagem e Ativação**
    * **Problema:** "melhor a tela de gestão das empresas podendo mudar status de ativo/inativo".
    * **Solução:** Tabela de empresas com badge de status e botão "Toggle Status" (Ativar/Bloquear).

### 📦 3. Detalhes & Operação
* **[US-36] Perfil da Empresa (Dossiê)**
    * **Problema:** "visualizar a empresa recem contratada" e "visualizar e incluir as certidões".
    * **Solução:** Página `/admin/companies/:id` que mostra:
        * Dados cadastrais (CNPJ, Razão Social).
        * Documentos de Onboarding (para conferência).
        * Botão rápido para "Novo Upload de Certidão" vinculado a esta empresa.

---

## 🛠️ Plano de Execução (Kanban)

1.  **Card 1 (UI/UX):** Refatorar `Sidebar` para suportar menus condicionais.
2.  **Card 2 (Gestão):** Melhorar `CompaniesPage` com tabela real e actions de API.
3.  **Card 3 (Detalhes):** Criar página `CompanyDetails` (Visão do Admin sobre o Cliente).
4.  **Card 4 (Operação):** Integrar Upload manual dentro da tela de detalhes.