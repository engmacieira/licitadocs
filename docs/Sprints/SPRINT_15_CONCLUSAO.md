# Conclusão da Sprint 15: Multi-Tenancy e Governança Corporativa

**Período:** 12/02/2026 - 13/02/2026
**Status:** ✅ CONCLUÍDO
**Versão Gerada:** v1.0.4

---

## 🎯 Objetivo Alcançado
O objetivo principal foi transformar a arquitetura do sistema para suportar **Múltiplas Empresas (Multi-Tenancy)** e **Gestão de Equipes**. Saímos de um modelo onde "1 Usuário = 1 Empresa" para um modelo flexível onde "1 Usuário = N Empresas", com níveis de permissão distintos.

O Frontend foi profundamente refatorado para gerenciar o **Contexto da Empresa**, permitindo que o usuário alterne entre organizações sem fazer logout.

---

## 🚀 Principais Entregas

### 1. Arquitetura Multi-Tenant (Backend)
* **Modelagem de Dados:** Implementação da tabela `user_company_links` (N:N) com suporte a *roles* (`MASTER`, `VIEWER`).
* **Isolamento de Dados:** Refatoração de todos os Repositories (`Document`, `Dashboard`) para filtrar queries pelo `company_id` ativo, garantindo segurança entre tenants.
* **Router Híbrido:** Unificação do fluxo de autenticação para suportar Uploads `multipart/form-data` e JSON no mesmo endpoint de registro.

### 2. Frontend & UX (SaaS Experience)
* **Seletor de Contexto:** Novo componente no Sidebar que permite alternar a empresa ativa instantaneamente.
* **Dashboard Reativo:** Os gráficos e contadores agora recarregam automaticamente ao trocar de empresa.
* **Gestão de Membros:** Nova tela `/company-settings` permitindo convidar usuários via e-mail e gerenciar a equipe.
* **Cadastro Profissional:** Fluxo completo (`Registro` -> `Contrato` -> `Pagamento` -> `Login`) implementado.

### 3. Segurança e Qualidade
* **Senha Provisória:** Lógica de convite gera contas temporárias para novos membros.
* **Migrações de Banco:** Scripts Alembic criados para atualizar a estrutura do banco (campo `title`, tabela de links).
* **Testes:** Validação ponta a ponta do fluxo de cadastro e upload.

---

## 🛠 Desafios e Soluções (Dívidas Técnicas Resolvidas)

| Desafio | Solução Aplicada |
| :--- | :--- |
| **Erro no Dashboard** (`User has no company_id`) | O modelo de usuário mudou. Atualizamos o `dashboard_router` para receber `company_id` via query param e usar a tabela de links. |
| **Missing Column** (`documents.title`) | O código esperava um título que não existia no banco. Criamos uma migração Alembic (`Add title to documents`) e aplicamos. |
| **Uploads no Registro** | O `fetch` nativo não lidava bem com `FormData`. Migramos para `api.post` (Axios) com headers corretos. |

---

## 📊 Métricas da Sprint
* **Arquivos Alterados:** ~25 arquivos (Backend + Frontend).
* **Novas Telas:** 3 (Company Settings, Contract Sign, Payment).
* **Bugs Críticos Resolvidos:** 2 (Login Loop e Dashboard Crash).

---

## 🔮 Próximos Passos (Sugestão para Sprint 16)
Com a base sólida, agora podemos focar na **Inteligência** do sistema:
1.  **IA Real:** Ativar a leitura automática dos documentos enviados (OCR/LLM) para extrair data de validade.
2.  **Notificações:** Enviar e-mails reais de convite (SMTP/SendGrid).
3.  **Auditoria:** Criar logs de quem baixou ou excluiu documentos.