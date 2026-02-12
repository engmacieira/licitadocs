"""
Testes de Integração para o Fluxo de Registro (Sprint 15).
Verifica a criação atômica de Usuário + Empresa + Vínculo.
"""
import pytest
from app.models.user_model import User, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company

def test_register_success_complete_flow(client, db_session):
    """
    Testa o cenário ideal: 
    Novo Usuário + Nova Empresa -> Tudo criado e vinculado como MASTER.
    """
    db = db_session
    
    # [CORREÇÃO] Payload plano para Form Data (compatível com auth_router atual)
    payload = {
        "email": "empreendedor@teste.com",
        "password": "senhaForte123!",
        # Dados da empresa direto na raiz
        "cnpj": "99999999000100",
        "legal_name": "Minha Startup Ltda",
        "trade_name": "Startup Top"
    }
    
    # [CORREÇÃO] Usamos data=payload para enviar como Form
    response = client.post("/auth/register", data=payload)
    
    # 1. Validar Resposta da API
    if response.status_code != 201:
        print(f"Erro: {response.json()}")

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert "id" in data
    
    # 2. Validar Persistência do Usuário
    user_db = db.query(User).filter(User.email == payload["email"]).first()
    assert user_db is not None
    
    # 3. Validar Persistência da Empresa
    company_db = db.query(Company).filter(Company.cnpj == payload["cnpj"]).first()
    assert company_db is not None
    assert company_db.razao_social == payload["legal_name"]
    
    # 4. Validar Vínculo
    link = db.query(UserCompanyLink).filter(
        UserCompanyLink.user_id == user_db.id,
        UserCompanyLink.company_id == company_db.id
    ).first()
    
    assert link is not None, "Vínculo User-Company não foi criado!"
    assert link.role == UserCompanyRole.MASTER.value
    assert link.is_active is True

def test_register_fail_duplicate_cnpj(client, db_session):
    """
    Testa a integridade dos dados:
    Tentar cadastrar empresa com CNPJ já existente deve falhar e NÃO criar o usuário.
    """
    db = db_session
    
    # 1. Setup: Criar uma empresa "original"
    original_company = Company(
        cnpj="11111111000111",
        razao_social="Empresa Original",
        nome_fantasia="Original"
    )
    db.add(original_company)
    db.commit()
    
    # 2. Tentar registrar novo usuário com O MESMO CNPJ
    payload = {
        "email": "hacker@teste.com",
        "password": "senha123",
        "cnpj": "11111111000111", # CNPJ REPETIDO!
        "legal_name": "Empresa Fake",
        "trade_name": "Fake"
    }
    
    response = client.post("/auth/register", data=payload)
    
    # 3. Asserts
    assert response.status_code == 400
    assert "CNPJ já cadastrado" in response.json()["detail"]
    
    # 4. Verificar Rollback: O usuário "hacker" NÃO deve existir no banco
    user_fail = db.query(User).filter(User.email == "hacker@teste.com").first()
    assert user_fail is None, "Rollback falhou! Usuário foi criado mesmo com erro na empresa."

def test_register_user_only_legacy(client, db_session):
    """
    Testa cadastro simples (apenas usuário, sem empresa) via rota LEGADA.
    A rota principal (/auth/register) agora OBRIGA a empresa.
    Para criar só usuário (ex: admin), usamos /register-simple.
    """
    db = db_session
    
    payload = {
        "email": "convidado@teste.com",
        "password": "senha123"
    }
    
    # [CORREÇÃO] Aponta para a rota simples (JSON) recuperada no passo anterior
    response = client.post("/auth/register-simple", json=payload)
    
    assert response.status_code == 201
    user_db = db.query(User).filter(User.email == "convidado@teste.com").first()
    assert user_db is not None
    # Verifica que não tem vínculos
    assert len(user_db.company_links) == 0