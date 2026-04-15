# 🤖 Instruções e Boas Práticas - Jules AI (LicitaDocs)

⚠️ **DIRETRIZ SUPREMA (LEITURA OBRIGATÓRIA)**:
Antes de qualquer análise ou sugestão, o Jules **DEVE** processar o arquivo `docs/00REGRAS_CODIGO.md`. Nenhuma ação ou código gerado pode violar o **Protocolo de Tolerância Zero para Adivinhação**.

---

## 🏗️ Consciência de Pipeline (Como você opera)
Você é executado de forma automatizada pelo GitHub Actions (CI/CD) em 3 passos atômicos. Você não tem interface de chat. Suas respostas são lidas por scripts Python e salvas diretamente no repositório. 

**REGRA DE SAÍDA CRÍTICA:** Se for solicitado código puro, retorne APENAS o código. NÃO inclua blocos de formatação markdown (como ```python) ou explicações como "Aqui está o código". Isso causará erro de sintaxe na esteira.

---

## 📊 Passo 01: Auditoria de Cobertura (Coverage)
* **Meta Global**: Manter a média de cobertura do projeto em **90%**.
* **Meta por Arquivo**: Mínimo de **80%** de cobertura individual.
* **Ação**: Você receberá trechos de código que falharam no Pytest/Vitest. Você deve gerar o arquivo de teste unitário focado ESTRITAMENTE em cobrir as "missing lines".

## 🛡️ Passo 02: Segurança e Clean Code
* **Foco de Segurança**: Identificar condições de corrida (*race conditions*), falhas de sanitização, injeção de dependências inseguras e vazamento de dados.
* **Foco Clean Code**: Garantir que todo código alterado tenha Docstrings (Python) ou JSDoc (TypeScript) precisas.
* **Ação**: Se o código estiver perfeito, retorne EXATAMENTE `"STATUS: APROVADO"`. Se houver falhas, reescreva e devolva todo o arquivo corrigido para sobrescrevermos a versão com defeito.

## 🚀 Passo 03: Gestão de Release (Changelog)
* **Ação**: Você receberá um log cru de comandos `git log`. 
* **Missão**: Traduzir esses termos técnicos em um **Release Notes** amigável, profissional e bem estruturado para humanos lerem, agrupando por Novidades, Correções e Melhorias.

## 📦 Protocolo de Entrega e Commit
* **Mensagem de Commit Obrigatória**: Toda e qualquer alteração realizada por você DEVE começar estritamente com o prefixo `🤖 AI (Jules):`.
* **Exemplo**: `🤖 AI (Jules): Otimização Global v1.0.5 - Cobertura de testes e ajuste de Docstrings`.
* **Importância**: Este prefixo é o gatilho que aciona a nossa esteira de testes reais e deploy em produção. Se você esquecer o prefixo, o sistema não entrará no ar.

---

### ⚙️ Metadados de Configuração (Uso do Sistema CI)
JULES_METRICS: GLOBAL_TARGET=90, FILE_TARGET=80