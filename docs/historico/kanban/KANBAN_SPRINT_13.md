# 🏗️ Kanban Board: Fluxo de Onboarding (Sprint 13)

**Objetivo:** Acompanhar o fluxo de desenvolvimento do Novo Cadastro de Fornecedores.
**Regra:** Mova os itens de [ ] (To Do) para [x] (Done) ou use a seção "DOING".

---

## 🚨 DOING (Em Andamento Agora)
> *Onde o foco total deve estar. Máximo 1 item por vez.*

---

## 📅 TO DO (Fila de Espera)
> *Backlog priorizado por ordem de execução.*

---

## ✅ DONE (Entregue & Testado)
> *O que já está em produção ou mergeado.*

* [x] **[Setup]** Login Admin funcionando no PostgreSQL.
* [x] **[Infra]** Banco de Dados migrado e rodando.

* [Card 01] Landing Page (Entrada)**
    * [x] Criar componente `LandingPage.tsx` (Layout público).
    * [x] Adicionar botão "Conhecer Mais" (Scroll para features).
    * [x] Adicionar botão "Cadastrar" (Link para `/register`).
    * [x] Ajustar rotas no `App.tsx` para a Landing ser a home (`/`).

* [Card 02] Tela de Cadastro (Formulário + Upload)
* [x] Criar Schema Zod (`companyRegisterSchema`) com validação de CNPJ.
* [x] Criar Componente `RegisterForm` (Wizard ou Step-by-Step).
    * [x] Passo 1: Dados da Empresa (CNPJ, Razão Social, Email Admin).
    * [x] Passo 2: Upload de Documentos (Contrato Social + Cartão CNPJ).
* [x] Integrar com serviço de Upload.

* [Card 03] Backend de Registro (API)
* [x] Criar Schema Pydantic `CompanyCreateRequest`.
* [x] Ajustar `auth_router.py` -> `POST /register`.
    * [x] Deve receber JSON + Arquivos (Multipart).
    * [x] Deve criar `Company`, `User` (Admin) e salvar `Documents` no Storage.

* [Card 04] Tela de Contrato & Procuração
* [x] Criar página de visualização de PDF (Contrato de Adesão).
* [x] Adicionar Checkbox "Li e Aceito os Termos".
* [x] Adicionar Checkbox "Assinar Procuração Digital".
* [x] Bloquear avanço se não aceitar.

* [Card 05] Tela de Pagamento (Mock)
* [x] Criar tela de "Checkout Simulado".
* [x] Exibir resumo do plano.
* [x] Botão "Pagar e Finalizar" (Redireciona para Dashboard).