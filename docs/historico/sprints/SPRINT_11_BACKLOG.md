# 🗺️ Sprint 11: UX, Polimento Visual & Feedback

**Objetivo:** Transformar o sistema funcional (v0.9.0) em um produto agradável (v1.0.0-RC), eliminando a sensação de "sistema travado" e melhorando o feedback para o usuário.
**Status:** Planejamento
**Tecnologia Principal:** React, TailwindCSS, Sonner (Toasts).

---

## 🎯 Backlog de Funcionalidades (Escopo)

### 📦 1. Experiência do Usuário (UX)
* **[US-UX-01] Feedback de Ações (Toasts)**
    * **O que é:** Substituir `alert()` e erros silenciosos por notificações visuais flutuantes.
    * **Critério:** Ao salvar, deletar ou falhar, deve aparecer um Toast verde (sucesso) ou vermelho (erro) no canto da tela.

* **[US-UX-02] Estados de Carregamento (Skeletons)**
    * **O que é:** Mostrar barras cinzas pulsantes enquanto os dados carregam, em vez de tela branca.
    * **Onde:** Tabela de Documentos, Dashboard e Chat da IA.

### 📦 2. Melhorias na Interface (UI)
* **[US-UI-01] Dashboard do Cliente (Refatoração Visual)**
    * **O que é:** Melhorar o visual dos Cards e da Tabela de documentos do cliente.
    * **Detalhe:** Usar ícones de status coloridos (✅ Válido, ⚠️ Vencendo) mais evidentes.

* **[US-UI-02] Barra de Progresso no Upload**
    * **O que é:** No admin, mostrar visualmente que o arquivo está subindo.
    * **Critério:** Evitar que o usuário clique 2x no botão "Enviar".

---

## 🛠️ Plano Técnico de Execução

1.  **Setup de Libs:**
    * Instalar `sonner` (Toasts) e `clsx/tailwind-merge` (se necessário para estilos dinâmicos).
    
2.  **Frontend (Components):**
    * Criar componente `<LoadingSkeleton />`.
    * Configurar `<Toaster />` no `App.tsx`.
    
3.  **Frontend (Integração):**
    * Alterar `documentService` e `aiService` para disparar toasts em caso de erro (via interceptor ou no componente).
    * Adicionar estados `isLoading` nas páginas principais.

4.  **Backend (Ajuste Fino):**
    * Nenhum ajuste previsto no Backend (ele já está pronto para servir os dados).

---

## 📝 Definição de Pronto (DoD)
* [ ] O sistema não usa mais `alert()` nativo do navegador.
* [ ] Navegar entre páginas mostra feedback de carregamento instantâneo.
* [ ] Erros de API (400/500) aparecem de forma amigável na tela.