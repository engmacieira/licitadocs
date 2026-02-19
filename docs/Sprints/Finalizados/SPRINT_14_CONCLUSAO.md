# 🏁 Conclusão da Sprint 14: Gestão Corporativa e Dashboards

**Período:** 11/02/2026
**Status:** ✅ Concluída com Sucesso

---

## 1. Resumo Executivo
Nesta sprint, transformamos o **LicitaDocs** de um sistema administrativo simples para uma plataforma **SaaS Multi-tenant funcional**. Implementamos o ciclo de vida completo da gestão de clientes (Empresas), desde o bloqueio de acesso até o envio centralizado de documentos. Além disso, entregamos Dashboards personalizados para cada perfil (Admin vs Cliente), garantindo que cada usuário veja apenas o que é relevante e seguro para ele.

---

## 2. Objetivos Alcançados (Definition of Done)

### 🏢 Gestão de Empresas (Backoffice)
- [x] **Status Ativo/Bloqueado:** Implementado o "botão de pânico" (Power) que bloqueia instantaneamente o acesso do usuário dono da empresa.
- [x] **Listagem Inteligente:** O Admin agora vê o status real da empresa (refletindo o status do usuário owner) na listagem.
- [x] **Prontuário da Empresa:** Nova tela de detalhes (`/admin/companies/:id`) com abas de Visão Geral e Documentos.

### 📂 Gestão de Documentos
- [x] **Upload Centralizado:** Nova tela exclusiva para Admins enviarem arquivos selecionando a empresa destino.
- [x] **Blindagem de Upload:** Bloqueamos via Backend (API) e Frontend a capacidade de clientes fazerem upload. Apenas Admins podem "alimentar" o sistema.
- [x] **Validação de Arquivos:** Implementada restrição de segurança para aceitar apenas `.pdf` no backend.
- [x] **Download Seguro:** Rota de download que verifica a propriedade do arquivo antes de entregar o binário.

### 📊 Dashboards Inteligentes
- [x] **Dashboard Admin:** Visão macro com totais de empresas, documentos e listas de atividades recentes.
- [x] **Dashboard Cliente:** Visão focada no status da assinatura (Ativa/Bloqueada) e nos últimos documentos recebidos.

---

## 3. Artefatos Técnicos Produzidos

### Backend (`/app`)
* **Routers:**
    * `dashboard_router.py`: Novos endpoints de estatísticas segregadas.
    * `document_router.py`: Refatorado para remover upload de cliente e adicionar validação `.pdf`.
    * `admin_router.py`: Adicionado `toggle_status` e `upload` centralizado.
* **Security:**
    * `dependencies.py`: Adicionada função `get_current_active_user` para blindagem extra.
* **Tests:**
    * Atualizados `test_multitenancy.py` e `test_documents.py` para refletir a regra de negócio "Client Cannot Upload".

### Frontend (`/src`)
* **Pages:**
    * `Admin/Dashboard`: Cards de métricas e listas recentes.
    * `Admin/Upload`: Seletor de empresa + Drag & Drop.
    * `Dashboard` (Cliente): Cards de status e lista de downloads.
* **Components:**
    * `StatsCard.tsx`: Componente visual para exibir métricas com tendências.
* **Services:**
    * `dashboardService.ts`: Integração com os novos endpoints.

---

## 4. Métricas de Qualidade
* **Testes Automatizados:** 100% dos testes críticos de segurança (Multitenancy e Roles) estão passando.
* **Segurança:** Correção crítica aplicada no Login (validação de `is_active`) e no Upload (validação de extensão).
* **UX:** Feedback visual imediato (Toasts) em todas as ações de upload e alteração de status.

---

## 5. Lições Aprendidas
1.  **"Bloquear a si mesmo":** Durante o desenvolvimento do bloqueio de empresas, aprendemos a importância de validar se o admin não está bloqueando a própria conta matriz.
2.  **Testes como Documentação:** A quebra dos testes antigos foi fundamental para nos alertar que a regra de negócio de upload havia mudado drasticamente.
3.  **Schema do Pydantic:** O uso de `AliasPath` foi crucial para mapear o status do usuário (`owner.is_active`) dentro do objeto da empresa, evitando queries complexas manuais.

---

## 6. Próximos Passos (Sugestão para Sprint 15)
* **Assinatura Digital:** Implementar o fluxo real de assinatura de contratos (Card pendente).
* **Notificações:** Avisar o cliente por e-mail quando um novo documento for postado.
* **Refatoração de Storage:** Mover o salvamento de arquivos do disco local (`uploads/`) para um serviço de nuvem (AWS S3 ou similar) para escalabilidade.