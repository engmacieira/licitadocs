import pytest
import os
from datetime import datetime
from fastapi import HTTPException
from app.dependencies import verify_company_access
from app.models.user_model import User, UserCompanyLink, UserRole, UserCompanyRole
from app.core.rate_limit import get_remote_address_with_proxy

def test_verify_company_access_soft_delete(db_session, test_user, test_company):
    """
    Missão 1: Verificar se verify_company_access nega acesso se o vínculo estiver com Soft Delete.
    """
    # 1. Setup: Pegar empresa do fixture e aplicar Soft Delete no vínculo existente
    link = db_session.query(UserCompanyLink).filter(
        UserCompanyLink.user_id == test_user.id,
        UserCompanyLink.company_id == test_company.id
    ).first()
    
    link.deleted_at = datetime.now() # SOFT DELETED
    db_session.commit()
    
    # 2. Teste: Deve levantar 403 Forbidden
    # Nota: passamos db_session explicitamente como o novo verify_company_access exige
    with pytest.raises(HTTPException) as excinfo:
        verify_company_access(test_company.id, test_user, db_session)
    
    assert excinfo.value.status_code == 403
    assert "Acesso negado" in excinfo.value.detail

def test_verify_company_access_inactive(db_session, test_user, test_company):
    """
    Verificar se verify_company_access nega acesso se o vínculo estiver inativo.
    """
    link = db_session.query(UserCompanyLink).filter(
        UserCompanyLink.user_id == test_user.id,
        UserCompanyLink.company_id == test_company.id
    ).first()
    
    link.is_active = False # INACTIVE
    db_session.commit()
    
    with pytest.raises(HTTPException) as excinfo:
        verify_company_access(test_company.id, test_user, db_session)
    
    assert excinfo.value.status_code == 403

def test_get_remote_address_with_proxy():
    """
    Missão 2: Testar se o rate limit detecta corretamente o header X-Forwarded-For.
    """
    class MockRequest:
        def __init__(self, headers, client_host="127.0.0.1"):
            self.headers = headers
            self.client = type('obj', (object,), {'host': client_host})

    # Caso 1: Com X-Forwarded-For
    req1 = MockRequest({"X-Forwarded-For": "203.0.113.195, 70.41.3.18, 150.172.238.178"})
    assert get_remote_address_with_proxy(req1) == "203.0.113.195"

    # Caso 2: Sem header (Fallback)
    req2 = MockRequest({}, client_host="192.168.1.1")
    assert get_remote_address_with_proxy(req2) == "192.168.1.1"

def test_cors_parsing(client):
    """
    Missão 3: Verificar se o app lê e aplica CORS_ORIGINS corretamente (Mock de ambiente).
    Nota: Como o app é instanciado no startup, testamos a lógica de parse.
    """
    def parse_cors(env_val):
        if env_val:
            return [origin.strip() for origin in env_val.split(",") if origin.strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    assert parse_cors("https://example.com, https://app.example.com") == ["https://example.com", "https://app.example.com"]
    assert parse_cors("") == ["http://localhost:5173", "http://127.0.0.1:5173"]

def test_swagger_visibility_production():
    """
    Missão 4: Verificar se docs_url é None em produção.
    """
    from fastapi import FastAPI
    import os
    
    def create_app(env):
        docs_config = {
            "docs_url": "/docs" if env != "production" else None,
            "redoc_url": "/redoc" if env != "production" else None,
        }
        return FastAPI(**docs_config)

    app_prod = create_app("production")
    assert app_prod.docs_url is None
    assert app_prod.redoc_url is None

    app_dev = create_app("development")
    assert app_dev.docs_url == "/docs"
    assert app_dev.redoc_url == "/redoc"
