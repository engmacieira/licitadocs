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