# 🚧 Sprint 05: Frontend Foundation - Status Report

**Data:** 18/01/2026
**Status:** 🟡 Em Andamento / Bloqueado
**Objetivo:** Estabelecer a base do Frontend (React), Autenticação e Layout Principal.

---

## ✅ O Que Já Foi Feito

### 1. Infraestrutura
* [x] Projeto criado com Vite + React + TypeScript.
* [x] Instalação e configuração do **Tailwind CSS** (Nota: Estamos usando a versão v4 ou compatível com PostCSS novo).
* [x] Configuração de Roteamento (`react-router-dom`).
* [x] **Service Layer:** Configuração básica do Axios (`api.ts`).

### 2. Autenticação & Segurança
* [x] **AuthContext:** Gerenciamento de estado global de usuário (Login/Logout).
* [x] **ProtectedRoute:** Componente que bloqueia acesso de não-logados.
* [x] **Integração:** Login funcional conectando com `POST /auth/login`.

### 3. Interface (UI/UX)
* [x] **Design System:** Componentes base criados (`Button`, `Input`, `StatsCard`).
* [x] **Tela de Login:** Visual completo e funcional.
* [x] **App Shell:** Layout com Sidebar lateral e Header fixo.
* [x] **Dashboard:** Tela inicial com cards de estatísticas (dados mockados).
* [x] **Documentos:** Tela de listagem criada (tabela), pronta para receber dados.

---

## 🛑 O Bloqueio Atual (Crítico)

**Problema:** "Tela Branca" ou Erro 304/HTML ao tentar listar documentos.
**Diagnóstico:** O Frontend está tentando buscar dados na própria porta (`localhost:5173`) em vez de ir para o Backend (`localhost:8000`).
**Tentativa de Solução:** Configuramos o **Vite Proxy** (`server.proxy` no `vite.config.ts`) e alteramos o `api.ts` para usar `baseURL: '/api'`.
**Status:** O usuário relatou que **"ainda está dando problema"** mesmo após essas mudanças.
**Suspeitas para o Próximo Chat:**
1.  Cache agressivo do Vite (precisa rodar com `--force`?).
2.  Erro de sintaxe no `vite.config.ts` (conflito entre plugins?).
3.  O Backend não está rodando ou o CORS ainda está interferindo de alguma forma estranha.

---

## 📝 Próximos Passos (Backlog Restante da Sprint)

1.  **🐞 FIX PRIORITÁRIO:** Resolver definitivamente a comunicação Frontend <-> Backend (fazer a tabela de documentos carregar).
2.  **[US-17] Upload no Frontend:** Fazer o botão "Novo Documento" funcionar (enviar arquivo para a API).
3.  **[US-18] Chatbot UI:** Criar a tela do chat e conectar com o endpoint de IA.