import pytest
from app.models.user_model import User, Company, UserRole
from app.models.document_model import Document
from app.core.security import get_password_hash
from fastapi.testclient import TestClient

# Helper para criar o cenário (Fixture local)
@pytest.fixture
def setup_scenarios(db_session):
    """
    Cria 2 Empresas, 2 Usuários e 2 Documentos.
    Retorna um dicionário com os dados para usarmos nos testes.
    """
    # 1. Criar Empresas
    company_a = Company(cnpj="11111111000111", razao_social="Empresa A Ltda")
    company_b = Company(cnpj="22222222000122", razao_social="Empresa B Ltda")
    db_session.add_all([company_a, company_b])
    db_session.commit() # Commit para gerar os IDs

    # 2. Criar Usuários vinculados
    user_a = User(
        email="user_a@empresa-a.com",
        password_hash=get_password_hash("12345678"),
        company_id=company_a.id,
        role=UserRole.CLIENT.value
    )
    user_b = User(
        email="user_b@empresa-b.com",
        password_hash=get_password_hash("12345678"),
        company_id=company_b.id, # <--- O PULO DO GATO
        role=UserRole.CLIENT.value
    )
    db_session.add_all([user_a, user_b])
    db_session.commit()

    # 3. Criar Documentos (Simulando uploads já feitos)
    doc_a = Document(
        filename="segredo_empresa_A.pdf",
        file_path="/storage/a.pdf",
        company_id=company_a.id, # Pertence à A
        status="valid"
    )
    doc_b = Document(
        filename="segredo_empresa_B.pdf",
        file_path="/storage/b.pdf",
        company_id=company_b.id, # Pertence à B
        status="valid"
    )
    db_session.add_all([doc_a, doc_b])
    db_session.commit()
    
    return {
        "user_a": user_a,
        "user_b": user_b,
        "doc_a": doc_a,
        "doc_b": doc_b,
    }

def get_auth_headers(client: TestClient, email: str, password: str = "12345678"):
    resp = client.post("/auth/login", data={"username": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# --- TESTES ---

def test_list_documents_isolation(client, setup_scenarios):
    """
    Testa se o Usuário A vê APENAS os documentos da Empresa A.
    """
    # Login como Usuário A
    headers_a = get_auth_headers(client, setup_scenarios["user_a"].email)
    
    # Busca documentos
    resp = client.get("/documents/", headers=headers_a)
    data = resp.json()
    
    # Asserções
    assert resp.status_code == 200
    assert len(data) == 1 # Só deve vir 1 documento (o dele)
    assert data[0]["filename"] == "segredo_empresa_A.pdf" # Confirma que é o certo
    
    # Prova real: Tenta achar o documento B na lista
    filenames = [d["filename"] for d in data]
    assert "segredo_empresa_B.pdf" not in filenames

def test_get_document_by_id_security(client, setup_scenarios):
    """
    Testa se o Usuário A tentar acessar o Documento B diretamente pela URL (ID),
    ele recebe um 404 (Not Found) ou 403 (Forbidden).
    No nosso repository, configuramos para filtrar, então deve dar None -> 404.
    """
    # Login como Usuário A
    headers_a = get_auth_headers(client, setup_scenarios["user_a"].email)
    
    # Tenta pegar o ID do documento B
    doc_b_id = setup_scenarios["doc_b"].id
    
    resp = client.get(f"/documents/{doc_b_id}", headers=headers_a)
    
    # NÃO deve retornar 200. Deve retornar 404 pois para o Usuário A, esse doc não existe.
    assert resp.status_code == 404 

def test_upload_auto_bind_company(client, setup_scenarios):
    """
    Testa se, quando o Usuário A faz upload, o sistema salva automaticamente
    o company_id da Empresa A no documento.
    """
    import io
    from unittest.mock import patch
    
    headers_a = get_auth_headers(client, setup_scenarios["user_a"].email)
    
    # Prepara upload fake
    file_obj = io.BytesIO(b"%PDF-1.4 conteudo novo")
    
    with patch("app.routers.document_router.save_file_locally") as mock_save:
        mock_save.return_value = "storage/novo.pdf"
        
        resp = client.post(
            "/documents/upload",
            files={"file": ("novo_doc.pdf", file_obj, "application/pdf")},
            headers=headers_a
        )
        
    assert resp.status_code == 201
    data = resp.json()
    
    # O teste crucial: O documento criado tem o ID da empresa A?
    # (A resposta da API pode não mostrar company_id, então vamos checar o comportamento)
    # Se listarmos de novo, devem aparecer 2 documentos agora
    resp_list = client.get("/documents/", headers=headers_a)
    assert len(resp_list.json()) == 2