"""
Testes de Integração: Repositórios.
Valida se as operações CRUD (Create, Read, Update, Delete) 
estão efetivamente gravando e lendo no Banco de Dados em Memória.
"""
import pytest

from app.repositories.user_repository import UserRepository
from app.repositories.company_repository import CompanyRepository
from app.schemas.user_schemas import UserCreate
from app.schemas.company_schemas import CompanyCreate, CompanyUpdate

# ==========================================
# 🧑‍💻 1. TESTES DE USER_REPOSITORY
# ==========================================

def test_create_user_success(db_session):
    """Cenário: Salvar um usuário válido no banco e validar criptografia."""
    user_in = UserCreate(
        email="qa_integration@teste.com",
        password="senha_forte_123",
        cpf="000.000.001-91" # O Pydantic já vai limpar essa máscara
    )
    
    # Chama o repositório passando a sessão de banco temporária
    user = UserRepository.create_user(db_session, user_in)
    
    assert user.id is not None # O banco de dados gerou um UUID
    assert user.email == "qa_integration@teste.com"
    assert user.cpf == "00000000191"
    # Regra de Segurança Crítica: Garantir que a senha virou Hash e não foi salva em texto plano!
    assert user.password_hash != "senha_forte_123" 

def test_create_user_duplicate_email_or_cpf(db_session):
    """
    Cenário: O banco de dados deve bloquear (IntegrityError) cadastros duplicados.
    O nosso repositório deve capturar isso e lançar um ValueError amigável.
    """
    user_in = UserCreate(email="duplicado@teste.com", password="senha123", cpf="00000000272")
    
    # Primeiro cadastro tem que passar
    UserRepository.create_user(db_session, user_in)
    
    # O segundo cadastro idêntico tem que explodir
    with pytest.raises(ValueError) as exc_info:
        UserRepository.create_user(db_session, user_in)
    
    assert "Email ou CPF já cadastrado" in str(exc_info.value)

def test_get_user_by_email(db_session):
    """Cenário: Buscar um usuário existente."""
    user_in = UserCreate(email="busca@teste.com", password="senha123", cpf="00000000353")
    UserRepository.create_user(db_session, user_in)
    
    found_user = UserRepository.get_by_email(db_session, "busca@teste.com")
    assert found_user is not None
    assert found_user.email == "busca@teste.com"

# ==========================================
# 🏢 2. TESTES DE COMPANY_REPOSITORY
# ==========================================

def test_create_company_success(db_session):
    """
    Cenário: Salvar uma empresa e garantir que o alias do Schema (razao_social) 
    foi mapeado corretamente para a coluna da Tabela.
    """
    # Usando model_validate para simular exatamente o que a API recebe do JSON
    company_in = CompanyCreate.model_validate({
        "cnpj": "00.000.001/0001-36", 
        "razao_social": "Empresa QA S.A."
    })
    
    company = CompanyRepository.create(db_session, company_in)
    
    assert company.id is not None
    assert company.cnpj == "00000001000136"
    assert company.razao_social == "Empresa QA S.A." # Coluna do banco

def test_update_company(db_session):
    """Cenário: Atualizar o nome de uma empresa."""
    # 1. Setup (Prepara o terreno)
    company_in = CompanyCreate.model_validate({"cnpj": "00000002000180", "razao_social": "Antiga S.A."})
    company = CompanyRepository.create(db_session, company_in)
    
    # 2. Ação (O que queremos testar)
    update_data = CompanyUpdate.model_validate({"razao_social": "Nova LTDA"})
    updated_company = CompanyRepository.update(db_session, company.id, update_data)
    
    # 3. Validação
    assert updated_company.razao_social == "Nova LTDA"

def test_delete_company(db_session):
    """Cenário: Deletar uma empresa e confirmar que sumiu."""
    # 1. Setup
    company_in = CompanyCreate.model_validate({"cnpj": "00000003000125", "razao_social": "Para Deletar"})
    company = CompanyRepository.create(db_session, company_in)
    
    # Confirma que existe antes de deletar
    assert CompanyRepository.get_by_id(db_session, company.id) is not None
    
    # 2. Ação
    result = CompanyRepository.delete(db_session, company.id)
    assert result is True
    
    # 3. Validação final
    assert CompanyRepository.get_by_id(db_session, company.id) is None