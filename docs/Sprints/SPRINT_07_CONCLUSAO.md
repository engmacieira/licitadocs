# 🏁 Log de Sprint: Sprint 07 - Multi-Tenancy & Core Foundation

**Período:** [Data de Início] até 30/01/2026
**Status:** ✅ Concluído
**Objetivo Principal:** Implementar isolamento de dados (Multi-Tenancy) e refatorar a comunicação Frontend-Backend.

## 🚀 Entregas Realizadas
1.  **[Core/Banco] Vínculo Usuário-Empresa:**
    * Tabela `users` alterada para incluir `company_id`.
    * Script `create_first_admin` corrigido para vincular Admin à Empresa Matriz.
    * Rota de Registro (`/auth/register`) cria empresa e vincula usuário automaticamente.
2.  **[Segurança] Isolamento de Dados:**
    * `DocumentRepository` agora filtra obrigatoriamente pelo `company_id`.
    * Usuários não conseguem acessar documentos de outras empresas nem via API direta.
3.  **[Frontend] Refatoração de Arquitetura:**
    * `api.ts` centralizado com `baseURL` dinâmica.
    * Remoção de todas as URLs hardcoded (`127.0.0.1`).
    * Correção de envio de arquivos (Remoção de header manual para fix do Boundary).
    * Correção de Login (Uso de `URLSearchParams` para OAuth2 Compliance).
4.  **[QA] Qualidade:**
    * Implementação de testes de integração para validar o isolamento (23 testes passando).

## 🧠 Retrospectiva

### ✅ O que funcionou bem?
* A decisão de "parar e testar" antes de ir para o frontend salvou muito tempo de debug.
* O uso de `URLSearchParams` no React simplificou a autenticação OAuth2.

### ⚠️ Desafios Encontrados
* **Erro 422 no Login:** O Frontend enviava JSON, mas o FastAPI esperava Form Data. Solucionado ajustando o `AuthContext`.
* **Erro 400 no Upload:** O envio manual do header `Content-Type` quebrava o boundary do arquivo. Solucionado deixando o Axios gerenciar.
* **Banco de Dados:** Precisamos resetar o banco (`licita_doc.db`) pois não temos sistema de migração automática (Alembic) ainda.

## 🚧 Débitos Gerados
* A biblioteca do Google Gemini (`google.generativeai`) está obsoleta e gerando warnings nos testes. Precisamos atualizar para `google.genai` na próxima Sprint.