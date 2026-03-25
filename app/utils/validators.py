import re

def validar_matematica_cpf(v: str) -> str:
    """
    Executa a validação matemática do CPF.
    Garante integridade dos dados antes da persistência no banco.
    """
    if not v:
        return v
        
    # 1. Limpeza de formatação
    numeros = re.sub(r'\D', '', v)
    
    # 2. Verificação de tamanho básico e sequências repetidas
    if len(numeros) != 11 or numeros == numeros[0] * 11:
        raise ValueError('CPF inválido ou mal formatado')
        
    # 3. Cálculo do 1º dígito verificador
    soma = sum(int(numeros[i]) * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    if resto == 10: resto = 0
    if resto != int(numeros[9]):
        raise ValueError('CPF inválido (1º dígito falhou)')

    # 4. Cálculo do 2º dígito verificador
    soma = sum(int(numeros[i]) * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    if resto == 10: resto = 0
    if resto != int(numeros[10]):
        raise ValueError('CPF inválido (2º dígito falhou)')

    return numeros
