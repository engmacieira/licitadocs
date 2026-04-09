# 🗺️ Sprint 27: Estabilidade e Experiência do Usuário (UX/Fixes)

**Objetivo:** Eliminar atritos críticos na jornada do cliente, garantir estabilidade de navegação e iniciar a implementação de ferramentas de retenção (Fase 1 do Roadmap).
**Status:** Planejamento
**Tecnologia Principal:** React (Vite), FastAPI, Python, Nginx/AWS.

---

## 🎯 Backlog da Sprint (User Stories)

### 📦 1. Estabilidade e Infraestrutura
* **[x] [US-2701] Fix do F5 (404 Not Found):** Configurar o roteamento no servidor de hospedagem (AWS/Nginx) para garantir que o refresh da página não quebre o SPA.
* **[x] [US-2702] Otimização de Cadastro:** Investigar e reduzir o tempo de resposta na criação de novas empresas (Alvo: < 3s). Adicionar Skeleton Loaders ou feedback visual claro.
* **[x] [US-2703] Debug do Chatbot IA:** Corrigir a falha de inicialização da IA em ambiente web/produção, validando chaves de API e CORS.

### 📦 2. Refinamento de UX (Frontend)
* **[x] [US-2704] Reset de Scroll:** Implementar `ScrollToTop` global ou nas páginas principais (Home, Sobre Nós, Demo) para garantir que a navegação comece sempre do topo.
* **[x] [US-2705] Reordenação do Dashboard:** Ajustar a sequência lógica das flags de onboarding no Dashboard do Cliente:
    1. Termo de Aceite
    2. Ativação do Plano (Pagamento)
    3. Dados Cadastrais
    4. Assinatura da Procuração
    5. Verificação da Equipe
* **[x] [US-2706] Segurança de Perfil:** Adicionar campo "Senha Atual" no formulário de alteração de senha em `/company-settings`.

### 📦 3. Fluxo de Onboarding & Documentos
* **[x] [US-2707] Sincronização em `/signature`:** Garantir que todos os dados da empresa (especialmente endereço) sejam carregados corretamente e forçar refresh ao entrar na página.
* **[x] [US-2708] Fix do Logout Pós-Assinatura:** Impedir o logout automático após o envio dos documentos assinados. Redirecionar para o Dashboard com mensagem de sucesso.
* **[x] [US-2709] Download de Kit ZIP:** Implementar a função "Baixar Kit Completo" no cofre do cliente, gerando um arquivo ZIP com as certidões organizadas.

---

## 🛠️ Plano Técnico de Execução

1.  **Infra:** Atualizar configuração do Nginx na AWS para `try_files $uri /index.html`.
2.  **Frontend:** 
    - Criar componente `ScrollToTop` e injetar no `App.tsx`.
    - Ajustar ordem do array de passos no `OnboardingWizard`.
    - Refatorar formulário de senha para incluir validação do backend.
3.  **Backend:**
    - Criar endpoint para geração de ZIP (usando `zipfile` do Python e `StreamingResponse`).
    - Otimizar query de `register` e verificar gargalos de I/O em uploads.

---

## 📝 Definição de Pronto (DoD)
* [ ] Refresh da página (F5) funcionando em todas as rotas sem 404.
* [ ] Flags do Dashboard na ordem solicitada pelo usuário.
* [ ] Download do Kit ZIP gerando arquivo válido.
* [ ] Fluxo de assinatura sem logout inesperado.
* [ ] Cobertura de testes manuais/automatizados para as correções.

---
**Assinatura:** Jules (Software Engineer) & Matheus (Product Owner)
