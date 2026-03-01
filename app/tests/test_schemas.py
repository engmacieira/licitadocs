"""
Testes Unitários: Schemas (Pydantic).
Garante que a porta de entrada da API não aceita lixo.
"""
import pytest
from pydantic import ValidationError

from app.schemas.user_schemas import UserCreate
from app.schemas.company_schemas import CompanyCreate

# ==========================================
# 🛡️ 1. TESTES DE USUÁRIO (UserCreate)
# ==========================================

def test_user_create_happy_path():
    """Cenário: Dados perfeitos, incluindo CPF com máscara."""
    user = UserCreate(
        email="teste_qa@licitadocs.com",
        password="senha_forte_123",
        cpf="000.000.001-91"
    )
    assert user.email == "teste_qa@licitadocs.com"
    assert user.password == "senha_forte_123"
    assert user.cpf == "00000000191"  # O validator tem que ter limpado os pontos!

def test_user_create_invalid_email():
    """Cenário: E-mail mal formatado (sem @)."""
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(email="email_esquisito_sem_arroba", password="senha_segura_123")
    
    assert "value is not a valid email address" in str(exc_info.value) or "email" in str(exc_info.value)

def test_user_create_short_password():
    """Cenário: Senha com menos de 8 caracteres."""
    with pytest.raises(ValidationError):
        UserCreate(email="teste@teste.com", password="123")

def test_user_create_invalid_cpf_length():
    """Cenário: CPF com menos (ou mais) de 11 dígitos."""
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(email="teste@teste.com", password="senha_segura_123", cpf="123456") # Só 6 dígitos
    
    assert "exatamente 11 dígitos" in str(exc_info.value)

# ==========================================
# 🏢 2. TESTES DE EMPRESA (CompanyCreate)
# ==========================================

def test_company_create_happy_path():
    """Cenário: Empresa com dados perfeitos usando o alias 'razao_social'."""
    company = CompanyCreate(
        cnpj="00.000.001/0001-36",
        razao_social="Cofre Digital S.A.", # Usando o alias definido no Field
        email_corporativo="contato@cofre.com"
    )
    assert company.cnpj == "00000001000136"  # Limpo da máscara
    assert company.name == "Cofre Digital S.A." # Pydantic joga do alias para o field original

def test_company_create_invalid_cnpj():
    """Cenário: CNPJ faltando dígitos."""
    with pytest.raises(ValidationError) as exc_info:
        CompanyCreate(cnpj="12.345/0001", razao_social="Empresa Errada")
    
    assert "exatamente 14 dígitos" in str(exc_info.value)

def test_company_create_missing_required_fields():
    """Cenário: Tentar criar empresa sem a Razão Social (que é obrigatória)."""
    with pytest.raises(ValidationError):
        # Passando apenas o CNPJ, deve quebrar por falta do alias "razao_social" (name)
        CompanyCreate(cnpj="00000001000136")