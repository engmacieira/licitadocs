/**
 * Utilitários de validação de documentos brasileiros.
 */

/**
 * Valida o dígito verificador de um CPF ou CNPJ.
 */
function validateDigits(digits: number[], weights: number[]): boolean {
  const soma = weights.reduce((acc, weight, i) => acc + digits[i] * weight, 0);
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  return dv === digits[weights.length];
}

/**
 * Valida matematicamente um CPF.
 */
export function isValidCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '');

  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  const digits = numeros.split('').map(Number);

  // 1º DV
  if (!validateDigits(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2])) return false;

  // 2º DV
  if (!validateDigits(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])) return false;

  return true;
}

/**
 * Valida matematicamente um CNPJ.
 */
export function isValidCNPJ(cnpj: string): boolean {
  const numeros = cnpj.replace(/\D/g, '');

  if (numeros.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numeros)) return false;

  const digits = numeros.split('').map(Number);

  // 1º DV
  if (!validateDigits(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])) return false;

  // 2º DV
  if (!validateDigits(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])) return false;

  return true;
}
