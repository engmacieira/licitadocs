# 🗺️ Sprint 20: Faxina Arquitetural & Segurança (Tech Debt Paydown)

**Objetivo:** Eliminar vulnerabilidades críticas de hardcode, sanitizar dados de entrada e organizar o documento de dívidas técnicas para garantir um ambiente saudável antes de escalar integrações externas.
**Status:** Planejamento
**Tecnologia Principal:** FastAPI (Python), PostgreSQL, Pydantic, React.

---

## 🎯 Backlog de Funcionalidades (Escopo)
*Funcionalidades selecionadas do `DividasTecnicas.md` para esta sprint.*

### 📦 1. Segurança e Infraestrutura (Prioridade Crítica)
* **[US-TD1] Trava de Segurança da SECRET_KEY e Variáveis de Ambiente**
    * **O que é:** O sistema não pode rodar em Produção com chaves vazadas e strings de banco expostas.
    * **Critério de Aceite:** O `main.py` deve dar `sys.exit()` se o ambiente for PROD e a `SECRET_KEY` for a padrão. Remover a string hardcoded do PostgreSQL do `database.py` e usar exclusivamente o `.env`.
    * **Regra de Negócio:** Aplicação deve falhar rápido (Fail Fast) em produção se mal configurada.

* **[US-TD2] Remoção/Blindagem do Mock de Pagamento**
    * **O que é:** A rota `/auth/simulate-payment` no `auth_router.py` permite ativar qualquer usuário no banco, gerando risco de fraude.
    * **Critério de Aceite:** Rota completamente removida ou isolada para rodar apenas se a variável `ENV` for `development` ou `test`.

### 📦 2. Validações e Regras de Negócio Vazadas (Backend)
* **[US-TD3] Validação Rigorosa de CNPJ e CPF no Backend**
    * **O que é:** Atualmente a API aceita qualquer string no lugar de um CNPJ/CPF válido.
    * **Critério de Aceite:** Criar validadores customizados no Pydantic (`schemas/user_schemas.py` ou `company_schemas.py`) que checam dígito verificador e formato.
    * **Regra de Negócio:** Rejeitar com `422 Unprocessable Entity` payloads contendo documentos inválidos na matemática.

* **[US-TD4] Centralização de Permissões (RBAC Decorators)**
    * **O que é:** A lógica `if user.role != admin` está espalhada pelos routers de forma repetitiva.
    * **Critério de Aceite:** Criar um `Depends(require_role(UserRole.ADMIN))` centralizado em `core/security.py` ou `dependencies.py` para injetar nas rotas.

### 📦 3. Qualidade da API e Frontend
* **[US-TD5] Filtro de Documentos por Empresa (Painel Admin)**
    * **O que é:** Endpoint `GET /documents` para Admin retorna todos os documentos sem filtragem, o que não escala e onera o banco.
    * **Critério de Aceite:** A rota deve aceitar Query Parameter opcional `?company_id=UUID`.

* **[US-TD6] Atualização da Memória do Projeto**
    * **O que é:** Limpar o `DividasTecnicas.md` dando baixa no que já fizemos.
    * **Critério de Aceite:** Documento limpo, refletindo apenas as dívidas reais atuais.

---

## 🛠️ Plano Técnico de Execução

1.  **Refatoração de Config e Segurança:** * Ajustar `app/core/security.py` para não fornecer chave padrão insegura sem aviso severo.
    * Ajustar `app/core/database.py` para remover a string de localhost.
    * Atualizar `app/main.py` com a trava de verificação de ambiente.
2.  **Limpeza no Auth:** * Modificar `app/routers/auth_router.py` apagando a rota de `simulate_payment`.
3.  **Refatoração de Schemas (Pydantic):** * Inserir os métodos `@validator` para CPF e CNPJ nos schemas do Pydantic.
4.  **Refatoração de Dependências:** * Criar injeção de dependência de `Role` em `app/dependencies.py` e plugar nos routers administrativos.
5.  **Ajuste no Document Router:** * Adicionar o parâmetro `company_id: Optional[str] = None` na rota de listagem geral em `document_router.py`.
6.  **Documentação:** * Atualizar `docs/DividasTecnicas.md` e gerar o log da Sprint.

---

## 📝 Definição de Pronto (DoD)

* [ ] Código commited e pushado.
* [ ] Funcionalidades testadas manualmente (tentar passar CNPJ falso, tentar rodar com key padrão).
* [ ] Testes automatizados passando (Backend).
* [ ] Documentação (`DividasTecnicas.md` e `Por_Onde_Comecar.md`) limpa e atualizada.