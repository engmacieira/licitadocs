# 💸 Dívidas Técnicas e Melhorias Futuras

Este documento rastreia débitos técnicos conscientes e pontos de melhoria para garantir a evolução saudável do LicitaDoc.

---

## 🚨 Prioridade Crítica (Backend & Infra)

Estes itens representam riscos de segurança ou operação e devem ser priorizados antes do Go-Live oficial.

### 1. [Segurança] SECRET_KEY Hardcoded
* **Problema:** O arquivo `app/core/security.py` possui um valor padrão inseguro caso a variável de ambiente falhe.
* **Risco:** Vulnerabilidade crítica em produção se o `.env` não for carregado corretamente.
* **Ação:** Implementar check no `main.py` que impede a inicialização do servidor em ambiente `PROD` se a chave for a padrão.

### 2. [Segurança/Infra] Credenciais do Banco Expostas (Hardcoded)
* **Problema:** Para contornar um erro de encoding (cp1252) no Windows, a URL de conexão do PostgreSQL foi inserida diretamente nos arquivos `app/core/database.py` e `alembic/env.py`.
* **Risco:** A senha do banco (`licita_pass`) está versionada no Git. Em um projeto real, isso é vazamento de credencial.
* **Ação:** Investigar a configuração de locale do Windows/Python para carregar o `.env` corretamente e remover as strings fixas do código.

### 3. [Segurança] Route Guards por Role (Frontend)
* **Problema:** O componente `ProtectedRoute` verifica apenas se o usuário está logado. Um usuário "Cliente" tecnicamente consegue acessar a rota `/admin/dashboard` se digitar na URL (embora a API bloqueie os dados, a tela carrega).
* **Ação:** Criar componente `<RoleRoute role="admin" />` para redirecionar usuários sem permissão para o dashboard correto.

---

## ⚠️ Atenção (Investigação & Refatoração)

### 4. [Infra] Erro de Encoding no Windows (0xe7)
* **Problema:** O ambiente de desenvolvimento no Windows gera erros de `UnicodeDecodeError` ao ler arquivos `.env` ou mensagens de erro do driver `psycopg2` se houver caracteres especiais (acentos).
* **Ação:** Configurar variáveis de ambiente do sistema (`PYTHONUTF8=1`) ou ajustar o carregamento do `python-dotenv` para forçar UTF-8 explicitamente.

---

## 🧪 Qualidade & Testes

* (Sem alterações nesta seção, manter o que já existia se houver)

---

## ✅ Dívidas Pagas (Histórico Recente)

> Itens resolvidos e eliminados.

### ~~[Banco] Migrations com Alembic~~ (Pago na Sprint 12)
* **Solução:** O Alembic foi configurado com sucesso. O uso de `Base.metadata.create_all` foi removido e agora todo o ciclo de vida do banco é gerido via versionamento de schema.


# 💸 Dívidas Técnicas e Melhorias Futuras Pós Sprint 13

Este documento rastreia débitos técnicos conscientes e pontos de melhoria para garantir a evolução saudável do LicitaDoc.

---

## 🚨 Prioridade Crítica (Backend & Infra)

Estes itens representam riscos de segurança ou operação e devem ser priorizados antes do Go-Live oficial.

### 1. [Segurança] SECRET_KEY Hardcoded
* **Problema:** O arquivo `app/core/security.py` possui um valor padrão inseguro caso a variável de ambiente falhe.
* **Ação:** Implementar check no `main.py` que impede a inicialização em PROD se a chave for padrão.

### 2. [Segurança/Infra] Credenciais do Banco Expostas
* **Problema:** Hardcode da string de conexão no `database.py` e `env.py` devido a erro de encoding no Windows.
* **Ação:** Resolver configuração de locale do Windows e voltar a usar `os.getenv()`.

### 3. [Segurança] Endpoint de Simulação de Pagamento (Novo Sprint 13)
* **Problema:** A rota `/auth/simulate-payment` permite ativar usuários sem validação real financeira.
* **Risco:** Fraude/Uso indevido em produção.
* **Ação:** Remover esta rota ou protegê-la com chave de API interna; Substituir por Webhook real (Stripe/Pagar.me).

### 4. [Infra] Armazenamento Local de Arquivos (Novo Sprint 13)
* **Problema:** O `file_helper.py` salva uploads na pasta local `storage/`.
* **Risco:** Em ambientes containerizados (Docker/K8s), arquivos locais são efêmeros (somem se o container recriar).
* **Ação:** Migrar para **Object Storage (S3/MinIO)** antes do deploy oficial.

---

## ⚠️ Atenção (Refatoração & Manutenção)

### 5. [Backend] Mapeamento Manual de DTOs (Novo Sprint 13)
* **Problema:** O `auth_router.py` faz conversão manual de campos (`legal_name` -> `razao_social`).
* **Risco:** Aumenta a chance de erro humano em manutenções futuras.
* **Ação:** Utilizar `validation_alias` do Pydantic ou padronizar o idioma entre Frontend e Banco de Dados.

### 6. [Frontend] Route Guards por Role
* **Problema:** Usuários "Cliente" conseguem acessar rotas "/admin" (visualmente).
* **Ação:** Criar componente `<RoleRoute role="admin" />`.

---

## 🧪 Qualidade & Testes

### 7. [QA] Testes End-to-End (E2E)
* **Ação:** Configurar Cypress/Playwright para testar o fluxo de cadastro completo (Onboarding).

---

## ✅ Dívidas Pagas

### ~~[Banco] Migrations com Alembic~~ (Pago na Sprint 12)
* **Solução:** Alembic configurado e rodando.

### ~~[UX] Feedback Visual (Toasts)~~ (Pago na Sprint 11)
* **Solução:** Biblioteca `sonner` implementada.

# 💸 Dívidas Técnicas & Melhorias Futuras

Este documento rastreia pontos do código que precisam de refatoração, otimização ou correções de longo prazo.

---

## 🔴 Alta Prioridade (Impedem Escala)
- [ ] **Migração de Storage (Local -> S3/MinIO):** Atualmente o sistema salva arquivos na pasta `/uploads` do container. Isso não escala e perde dados se o container for recriado.
- [ ] **Validação de CNPJ no Backend:** O Frontend valida, mas a API ainda aceita qualquer string no campo CNPJ da empresa.
- [ ] **Filtro de Documentos por Empresa (Admin):** O endpoint `GET /documents` para Admin retorna *todos* os documentos do banco. Precisamos permitir filtrar por `company_id` via Query Param (ex: `/documents?company_id=...`).

## 🟡 Média Prioridade (Manutenibilidade)
- [ ] **Refatorar `StatsCard`:** O componente está misturando lógica de apresentação (cores) com dados. Mover para um padrão de variantes do Tailwind.
- [ ] **Centralizar Regras de Permissão:** Mover a lógica `if user.role == 'admin'` dos Routers para um `PermissionService` ou Decorators reutilizáveis.
- [ ] **Hardcoded PDF:** A validação `file.filename.endswith('.pdf')` está hardcoded no Router. Mover para uma constante de configuração `ALLOWED_EXTENSIONS`.

## 🟢 Baixa Prioridade (Cosmético/DX)
- [ ] **Paginação Real no Dashboard:** As listas de "Recentes" trazem apenas 5 itens, mas não há link para "Ver Todos" paginado no Backend.
- [ ] **Seeds de Teste:** Criar um script `seed.py` mais robusto que popule o banco com dados aleatórios (Faker) para testes de carga.