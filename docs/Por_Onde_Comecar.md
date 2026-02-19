# 🧭 Por Onde Começar (Save State - Sprint 19)

**Projeto:** Sistema de Gestão de Documentos (Cofre Digital Inteligente)
**Stack:** FastAPI (Python), PostgreSQL, React (TypeScript), Tailwind CSS.
**Momento Atual:** Início da **Sprint 19** (Fortaleza Digital - QA Senior & Hardening).

---

## 📍 Onde Paramos (Status do Sistema)
Acabamos de concluir a **Sprint 18**, entregando a autonomia total do sistema.
* **O que funciona hoje:** * Autenticação e Autorização (JWT com Roles Admin/Client).
  * Upload de Documentos para a AWS S3 (via SDK no Backend).
  * O **Cofre Inteligente**, que unifica arquivos legados e certidões estruturadas usando o padrão *Unified DTO*.
  * O painel de **Configurações (Settings)**, onde o Administrador faz o CRUD completo de Categorias e Tipos de Documentos, totalmente protegido por regras de Integridade Relacional no banco de dados.
* **Qualidade Atual:** O backend possui testes de integração básicos (auth, uploads e settings) passando em 100%, mas a cobertura geral ainda precisa subir. O frontend não possui testes automatizados ainda.

---

## 🎯 Nossa Missão Agora (Sprint 19)
O sistema tem uma base funcional excelente. A missão desta Sprint é **Endurecer (Hardening) o produto e agir como um QA Senior**. Vamos validar exaustivamente a segurança, estabilidade e resiliência de ambas as camadas (Backend e Frontend).

**O Backlog da Sprint 19 está dividido em duas fases (conforme `SPRINT_19_BACKLOG.md`):**
1. **A Fundação:** Expandir a cobertura de Testes Unitários e de Integração (Pytest no Backend e configurar Vitest/RTL no Frontend) para os caminhos felizes e erros esperados.
2. **O Estresse (QA Senior):** Tentar invadir rotas Admin com usuário comum (ACL Bypass), testar vazamento de dados entre empresas (Multi-tenancy bypass), testar arquivos maliciosos/vazios e validar a resiliência do Frontend (prevenção de double-clicks e quedas de internet).

---

## 🚀 Próximo Passo Imediato (Call to Action para a IA)

Você, como meu Tech Lead (Mark), deve me guiar na **Fase 1 do Backend**. 

Gostaria de começar estruturando a nossa suíte de testes do Backend para atingir uma alta cobertura. 
**Qual deve ser o nosso primeiro passo prático em código?** Devemos refinar o nosso `conftest.py` para facilitar os mocks de segurança, ou já criar o `test_backend_security.py` para testarmos o bypass de permissões das rotas de admin?