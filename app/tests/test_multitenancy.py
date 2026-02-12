import pytest
from app.models.user_model import User, UserRole, UserCompanyLink, UserCompanyRole
from app.models.company_model import Company
from app.models.document_model import Document, DocumentStatus
from app.core.security import get_password_hash
from fastapi.testclient import TestClient

# Helper para autenticação
def get_auth_headers(client, email):
    response = client.post("/auth/token", data={"username": email, "password": "123"})
    if response.status_code != 200:
        raise ValueError(f"Falha login helper: {response.json()}")
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# Helper para criar o cenário (Fixture local)
@pytest.fixture
def setup_scenarios(db_session):
    """
    Cria 2 Empresas, 2 Usuários e 2 Documentos.
    """
    # 1. Criar Empresas
    company_a = Company(cnpj="11111111000111", razao_social="Empresa A Ltda")
    company_b = Company(cnpj="22222222000122", razao_social="Empresa B Ltda")
    db_session.add_all([company_a, company_b])
    db_session.commit() 

    # 2. Criar Usuários
    user_a = User(
        email="user_a@empresa-a.com",
        password_hash=get_password_hash("123"),
        role=UserRole.CLIENT.value,
        is_active=True
    )
    user_b = User(
        email="user_b@empresa-b.com",
        password_hash=get_password_hash("123"),
        role=UserRole.CLIENT.value,
        is_active=True
    )
    db_session.add_all([user_a, user_b])
    db_session.commit()

    # 3. Criar Vínculos (Correção Multi-Tenant)
    link_a = UserCompanyLink(
        user_id=user_a.id, 
        company_id=company_a.id, 
        role=UserCompanyRole.MASTER.value, 
        is_active=True
    )
    link_b = UserCompanyLink(
        user_id=user_b.id, 
        company_id=company_b.id, 
        role=UserCompanyRole.MASTER.value, 
        is_active=True
    )
    db_session.add_all([link_a, link_b])
    db_session.commit()

    # 4. Criar Documentos (COM TÍTULO AGORA)
    doc_a = Document(
        title="Doc A Segredo",  # <--- Obrigatório
        filename="segredo_a.pdf",
        file_path="storage/a.pdf",
        company_id=company_a.id,
        uploaded_by_id=user_a.id,
        status=DocumentStatus.VALID.value
    )
    doc_b = Document(
        title="Doc B Segredo", # <--- Obrigatório
        filename="segredo_b.pdf",
        file_path="storage/b.pdf",
        company_id=company_b.id,
        uploaded_by_id=user_b.id,
        status=DocumentStatus.VALID.value
    )
    db_session.add_all([doc_a, doc_b])
    db_session.commit()

    return {
        "company_a": company_a,
        "company_b": company_b,
        "user_a": user_a,
        "user_b": user_b,
        "doc_a": doc_a,
        "doc_b": doc_b
    }

def test_isolation_list_documents(client, setup_scenarios):
    """
    Testa se o Usuário A vê APENAS documentos da Empresa A.
    """
    headers_a = get_auth_headers(client, setup_scenarios["user_a"].email)
    
    # Busca documentos (passando ID para garantir filtro correto)
    company_a_id = setup_scenarios["company_a"].id
    response = client.get(f"/documents/?company_id={company_a_id}", headers=headers_a)
    
    assert response.status_code == 200
    data = response.json()
    
    # Deve ver 1 documento
    assert len(data) == 1
    assert data[0]["title"] == "Doc A Segredo"

def test_access_denied_to_other_company_document(client, setup_scenarios):
    """
    Testa se o Usuário A tentar baixar o Documento B, ele é bloqueado.
    """
    headers_a = get_auth_headers(client, setup_scenarios["user_a"].email)
    doc_b_id = setup_scenarios["doc_b"].id
    
    # Tenta baixar
    resp = client.get(f"/documents/{doc_b_id}/download", headers=headers_a)
    
    # Deve ser 403 (Forbidden)
    assert resp.status_code == 403

def test_cross_tenant_listing_attempt(client, setup_scenarios):
    """
    Testa se o Usuário A tentar listar documentos da Empresa B explicitamente.
    """
    headers_a = get_auth_headers(client, setup_scenarios["user_a"].email)
    company_b_id = setup_scenarios["company_b"].id
    
    # Tenta listar empresa vizinha
    response = client.get(f"/documents/?company_id={company_b_id}", headers=headers_a)
    
    # Deve ser bloqueado
    assert response.status_code == 403