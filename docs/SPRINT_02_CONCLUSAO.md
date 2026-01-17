# 🏁 Log de Sprint: 02 - Gestão de Documentos

**Período:** 17/01/2026
**Status:** Concluído
**Objetivo Principal:** Implementar o upload seguro, armazenamento e listagem de documentos, criando o coração do produto "LicitaDoc".

## 🚀 Entregas Realizadas (O Que)
*Funcionalidades PRONTAS e TESTADAS.*

* **[Database]** Tabela `documents` criada com relacionamento para `companies` e status de validade.
* **[Storage]** Módulo de abstração de armazenamento (Local Storage implementado).
* **[Upload]** Endpoint `POST /documents/upload` com validação de tipo (PDF) e vínculo automático com a empresa do usuário.
* **[Listagem]** Endpoint `GET /documents` retornando apenas os arquivos da empresa logada (Isolamento de Dados).
* **[QA]** Testes automatizados usando **Mock** para simular o sistema de arquivos (evitando lixo no disco).

## 🧠 Retrospectiva (O Como)

### ✅ O que funcionou bem?
* **Correção Rápida de Auth:** A percepção de que o usuário precisava de uma empresa vinculada logo no cadastro foi crucial. O *fix* de "Auto-Empresa" resolveu o problema de dependência.
* **Mocking:** O uso de `unittest.mock` no teste de upload foi uma decisão sênior. Testamos a lógica sem depender de I/O real.
* **TDD:** A escrita dos testes antes (ou junto) do código garantiu que não quebrássemos o login ao mexer nos documentos.

### ⚠️ O que travou ou atrapalhou?
* **Senha Curta no Teste:** Tivemos um falso negativo nos testes porque usamos uma senha ("123") que violava nossa própria regra de validação (min 8 chars). Ajustado rapidamente.

## 🚧 Débito Técnico Gerado
* **Validade Automática:** O campo `status` ainda é estático. Precisaremos criar um *Job* (rotina) futuro que roda todo dia para marcar documentos como "Vencido" automaticamente baseada na `expiration_date`.

---
**Assinatura:** Tech Lead & Dev (Matheus e Mark)