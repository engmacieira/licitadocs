# 🤖 Instruções e Boas Práticas - Jules AI (LicitaDocs)

⚠️ **DIRETRIZ SUPREMA (LEITURA OBRIGATÓRIA)**:
Antes de qualquer análise ou sugestão, o Jules **DEVE** processar o arquivo `docs/00REGRAS_CODIGO.md`. Nenhuma ação ou código gerado pode violar o **Protocolo de Tolerância Zero para Adivinhação**.

---

## 1. 📊 Auditoria de Cobertura (Coverage)
* **Meta Global**: Manter a média de cobertura do projeto em **90%**.
* **Meta por Arquivo**: Mínimo de **80%** de cobertura individual.
* **Ação**: Analisar os relatórios `coverage.json` (Backend) e `coverage-summary.json` (Frontend). Se um ficheiro estiver abaixo da meta, o Jules deve gerar testes unitários focados especificamente nas "missing lines" reportadas.

## 2. 🛡️ Segurança e Resiliência
* **Foco**: Identificar condições de corrida (*race conditions*), falhas de sanitização e vulnerabilidades em lógica de licitações.
* **Ação**: Propor cenários de teste de estresse para evitar erros 5xx sob carga elevada.

## 3. 📝 Documentação Clean Code
* **Padrão**: Todo o código novo ou alterado deve incluir Docstrings (Python) ou JSDoc (TypeScript).
* **Regra**: Se a lógica mudou, a documentação deve ser atualizada para refletir a nova realidade, seguindo os padrões do LicitaDocs.

## 4. 🚀 Gestão de Release e Versão
* **Análise**: Comparar o `git diff` para decidir o incremento da versão:
    1. **Patch**: Correções de bugs e melhorias internas.
    2. **Minor**: Novas funcionalidades (*features*) sem quebrar compatibilidade.
    3. **Major**: Mudanças estruturais ou *Breaking Changes*.
* **Sincronização**: Atualizar a variável `version` em `app/main.py` e gerar o ficheiro correspondente em `docs/release-notes/vX.X.X.md`.

---

### ⚙️ Metadados de Configuração (Uso do Sistema)