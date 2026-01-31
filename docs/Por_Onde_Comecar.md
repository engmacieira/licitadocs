# 🚀 Guia de Início Rápido (Contexto do Projeto)

**Projeto:** LicitaDoc (SaaS de Gestão de Documentos para Licitações)
**Versão Atual:** v0.7.0 (Multi-Tenancy Core Stable)
**Data:** 30/01/2026

## 🏗️ Status Atual
O sistema é um Monorepo seguro e preparado para múltiplos clientes.
* **Frontend:** React + Tailwind + Axios Centralizado (Porta 5173).
* **Backend:** FastAPI + SQLite + Multi-Tenancy Lógico (Porta 8000).

## 🏆 Últimas Conquistas (Sprint 07)
1.  **Multi-Tenancy:** Usuários e Documentos agora são isolados por Empresa.
2.  **Segurança:** Correção crítica no script de Admin e nas rotas de Upload.
3.  **Arquitetura:** Frontend refatorado para não depender de URLs fixas (`localhost`).

## 📍 Onde Paramos?
O sistema funciona \"end-to-end\": Login -> Upload -> Listagem Segura.
Porém, a interface ainda é \"crua\" (sem feedback visual de erros/sucesso) e a IA ainda é um endpoint isolado sem chat na interface.

## 🎯 Objetivo Imediato (Sprint 08)
**Foco: UX e Inteligência.**
1.  **Interface de Chat com IA:** Criar a tela onde o usuário conversa com os documentos.
2.  **Feedback Visual:** Implementar Toasts (Notificações) para substituir os `alert()` e erros no console.
3.  **Migração da Lib de IA:** Atualizar o `google.generativeai` para evitar quebra futura.

## 📂 Arquivos Chave para Leitura
* `frontend/src/contexts/AuthContext.tsx` (Lógica de Login ajustada).
* `app/models/user_model.py` (Estrutura de vínculo Usuário-Empresa).
* `app/routers/document_router.py` (Lógica de isolamento).