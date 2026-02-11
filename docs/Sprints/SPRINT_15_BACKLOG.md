# 📋 Sprint 15: Profissionalização & Multi-Tenancy

**Período:** [Data Início] a [Data Fim]
**Status:** 🚧 Planejada

---

## 🎯 Objetivo
Profissionalizar a estrutura de dados do sistema, implementando cadastros completos (PF e PJ) com validações reais e habilitando a arquitetura **Multi-Tenancy Real** (N:N), onde um usuário pode pertencer a múltiplas empresas e uma empresa pode ter múltiplos usuários com níveis de acesso distintos.

---

## 🛠️ Backlog Técnico & Funcional

### 1. Modelagem de Dados (Core Database)
- [ ] **Migration: Expansão de Empresas:**
    - Adicionar colunas em `companies`: `nome_fantasia`, `telefone`, `whatsapp`, `responsavel_nome`, `responsavel_cpf`.
    - Adicionar colunas de Endereço: `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep`.
- [ ] **Migration: Expansão de Usuários:**
    - Adicionar colunas em `users`: `cpf`, `rg`, `genero`, `celular`.
- [ ] **Migration: Tabela Associativa (`company_members`):**
    - Criar tabela para relação N:N entre `users` e `companies`.
    - Campos: `user_id`, `company_id`, `role` (Enum: 'MASTER', 'VIEWER'), `created_at`.
- [ ] **Script de Migração de Dados (Data Migration):**
    - Script para converter a relação atual (coluna `company_id` na tabela `users`) para a nova tabela associativa, garantindo que usuários atuais virem 'MASTER' de suas empresas.

### 2. Backend (API & Regras de Negócio)
- [ ] **Atualização de Schemas Pydantic:**
    - Atualizar `CompanySchema` e `UserSchema` com os novos campos.
    - Implementar validações de formato (Regex) para CPF e CNPJ.
- [ ] **Lógica de Autenticação (Refatoração):**
    - [ ] Validar unicidade de CNPJ no registro.
    - [ ] Tratar cenários de conflito:
        1.  *Usuário novo / Empresa nova:* Fluxo normal.
        2.  *Usuário novo / Empresa existente:* Bloquear e avisar para pedir convite.
        3.  *Usuário existente / Empresa nova:* Redirecionar para login + criação interna.
- [ ] **Gestão de Membros (Novos Endpoints):**
    - [ ] `POST /companies/{id}/members`: Master adiciona novo usuário (gera senha provisória).
    - [ ] `GET /companies/{id}/members`: Listar equipe da empresa.
    - [ ] `DELETE /companies/{id}/members/{user_id}`: Revogar acesso de um membro.
- [ ] **Contexto Multi-Empresa:**
    - Endpoint `/users/me/companies` para listar todas as empresas às quais o usuário tem acesso.

### 3. Frontend (Interfaces)
- [ ] **Novo Fluxo de Cadastro (`/register`):**
    - Formulário Wizard (Passo a passo) ou Long Form.
    - Campos completos com máscaras (React Input Mask).
- [ ] **Tela: Minha Empresa (`/admin/company-settings`):**
    - Formulário para o usuário 'MASTER' editar todos os dados cadastrais da empresa.
- [ ] **Tela: Meus Dados (`/profile`):**
    - Formulário para usuário editar seus dados pessoais (Nome, Telefone, Senha).
- [ ] **Tela: Gestão de Equipe:**
    - Interface para listar os membros atuais.
    - Botão "Novo Membro" (Modal simples: Nome, Email, CPF).
    - Exibição de Modal com a "Senha Provisória" após criação.
- [ ] **Seletor de Contexto (Empresa):**
    - Componente no Sidebar/Header para o usuário trocar de empresa ativa (caso tenha mais de uma).

---

## 📅 Definição de Pronto (DoD)
1.  Banco de dados migrado com sucesso e dados antigos preservados na nova estrutura associativa.
2.  Novo usuário consegue se cadastrar preenchendo o formulário completo (CPF, Endereço, etc).
3.  Usuário Master consegue adicionar um segundo usuário (Viewer) na sua empresa.
4.  Usuário convidado consegue logar com a senha provisória e ver *apenas* os documentos daquela empresa.
5.  Frontend aplica máscaras em todos os campos de documento e telefone.
6.  Testes automatizados cobrindo a criação de membros e permissões de acesso.