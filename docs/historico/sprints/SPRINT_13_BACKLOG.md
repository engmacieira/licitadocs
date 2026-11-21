# 🗺️ Sprint 13: Fluxo de Onboarding (Self-Service)

**Objetivo:** Implementar o fluxo público onde a própria empresa se cadastra, envia documentos iniciais e cria sua conta.
**Metodologia:** Kanban
**Status:** Em Andamento

---

## 🎯 Backlog de Funcionalidades (Escopo)

### 📦 1. Fluxo de Entrada (Público)
* **[US-31] Landing Page & Navegação**
    * **O que é:** Página inicial pública (`/`) com apresentação básica e direcionamento para Login ou Cadastro.
    * **Referência:** "acessar página inicial --> clicar em botão conhecer mais..."

### 📦 2. Cadastro Inteligente
* **[US-32] Formulário de Registro com Upload**
    * **O que é:** Tela de cadastro que coleta dados da Empresa + Usuário Admin E permite upload imediato de "Contrato Social" e "Cartão CNPJ".
    * **Backend:** Endpoint `POST /auth/register` que suporta `multipart/form-data`.
    * **Regra de Negócio:** O usuário é criado com status `PENDING` até completar o fluxo.

### 📦 3. Formalização
* **[US-33] Aceite de Contrato**
    * **O que é:** Tela que exibe o contrato da plataforma e exige um "De acordo" antes de prosseguir.

---

## 🛠️ Plano de Execução (Kanban)

1.  **Card 1 (Frontend):** Criar `LandingPage.tsx` e ajustar rotas públicas no React.
2.  **Card 2 (Backend):** Criar Schema e Rota de Registro (`schemas/auth_schemas.py` e `routers/auth_router.py`) suportando arquivos.
3.  **Card 3 (Integração):** Criar tela de Registro no Frontend conectada a essa rota.

---