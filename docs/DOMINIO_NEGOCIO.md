# 🧠 LicitaDocs - Mapa de Domínio e Regras de Negócio

Este documento consolida o conhecimento estratégico do sistema, obtido via engenharia reversa do código-fonte e documentação técnica.

---

## 1. Entidades de Negócio (Baseline Atual)

O sistema opera sobre um modelo de dados relacional e multi-tenant, onde a **Empresa** é a unidade central de negócio.

### 👤 Usuário (`User`)
*   **Conceito:** Indivíduo autenticado que interage com a plataforma.
*   **Papéis Globais (`UserRole`):**
    *   `ADMIN`: Staff interno da LicitaDocs com acesso total para suporte e moderação.
    *   `CLIENT`: Representante de uma empresa licitante.
*   **Atributos Críticos:** Credenciais (Email/Senha), CPF, e Status de Verificação de E-mail.

### 🏢 Empresa (`Company`)
*   **Conceito:** O Tenant do sistema. Representa a Pessoa Jurídica (PJ) que busca habilitação em licitações.
*   **Regra de Ouro:** Uma empresa só é considerada **REGULAR** se cumprir: Aceite de Termos + Pagamento Ativo + Procuração Assinada + Verificação Admin + E-mail do Owner Verificado.
*   **Atributos:** CNPJ (Chave única), Dados Cadastrais, Endereço e Flags de Onboarding.

### 🔗 Vínculo Usuário-Empresa (`UserCompanyLink`)
*   **Conceito:** Tabela associativa que permite a um Usuário gerenciar múltiplas Empresas (N:N).
*   **Níveis de Acesso Local (`UserCompanyRole`):**
    *   `MASTER`: Gestor total da conta (pode enviar documentos e gerenciar membros).
    *   `VIEWER`: Acesso apenas para consulta e download do Kit de Licitação.

### 📄 Documento (`Document`)
*   **Conceito:** O artefato físico bruto (PDF). Armazena o `file_path` e metadados de upload.
*   **Origem:** Diferencia `is_client_upload` (envio manual) de emissões automáticas.

### ✅ Certidão (`Certificate`)
*   **Conceito:** A "Inteligência" extraída do Documento. Contém datas de validade, códigos de autenticidade e status de regularidade.
*   **Relacionamento:** Vinculado 1:1 a um `Document`.

---

## 2. Segurança e Multi-tenancy

### Isolamento de Dados (Tenant Isolation)
*   **Regra Estrita:** O acesso a qualquer dado (Documento, Certidão, Dados da Empresa) é filtrado obrigatoriamente pela tabela `user_company_links`.
*   **Chave Mestra:** Usuários com papel `ADMIN` ignoram essa restrição para fins de auditoria e suporte técnico.
*   **Proteção Anti-IDOR:** Toda rota de download ou visualização valida se o `company_id` do recurso pertence à lista de empresas vinculadas ao usuário logado.

### RBAC (Role-Based Access Control)
1.  **Nível Sistema:** `ADMIN` vs `CLIENT` (Controla acesso a rotas de gestão global).
2.  **Nível Tenant:** `MASTER` vs `VIEWER` (Controla permissões de escrita/leitura dentro da empresa).

---

## 3. Cofre Digital e Ciclo de Vida

O Cofre Digital é o motor de conformidade do sistema, gerenciando a validade técnica dos documentos.

### Máquina de Estados (Status)
*   `PENDING`: Documento enviado pelo cliente, aguardando revisão administrativa.
*   `VALID`: Documento dentro do prazo de validade e verificado.
*   `WARNING`: Documento próximo ao vencimento (Gatilha alertas).
*   `EXPIRED`: Documento vencido (Empresa fica irregular para o sistema).
*   `ERROR`: Falha técnica na extração ou validação do documento.

### Fluxo de Automação (`Orchestrator`)
*   O sistema utiliza um `CrawlerFactory` para disparar robôs que buscam certidões automaticamente em órgãos públicos (CND Federal, FGTS, etc.).
*   Certidões capturadas são persistidas fisicamente no storage e registradas no banco com status `VALID`.

---

## 4. Fluxo de Onboarding (Conformidade)

A ativação de uma conta segue uma sequência lógica obrigatória (Semáforo do Dashboard):
1.  **Aceite de Termos:** Consentimento legal do usuário.
2.  **Pagamento Ativo:** Validação da assinatura (Infinite Pay).
3.  **Dados Cadastrais:** Preenchimento completo do perfil da PJ.
4.  **Procuração Digital:** Assinatura do documento que autoriza a LicitaDocs a representar a empresa.
5.  **Verificação Admin:** Revisão final manual pela equipe interna para liberar a operação plena.

---
**Documento gerado automaticamente via Processo de Engenharia Reversa - Março/2024.**
