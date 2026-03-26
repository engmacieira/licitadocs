import os
import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Carregar o arquivo .env.test
env_path = os.path.join(os.path.dirname(__file__), "../../.env.test")
load_dotenv(env_path, override=True)

from app.core.database import Base, get_db
from app.core.rate_limit import limiter
from app.main import app
from app.models.user_model import User, UserCompanyLink
from app.models.company_model import Company
from app.models.document_model import Document
from app.models.document_category_model import DocumentCategory
from app.models.document_type_model import DocumentType
from app.models.certificate_model import Certificate
from app.models.document_automation_model import DocumentAutomationConfig
from app.models.emission_rule_model import EmissionRule
from app.models.emission_request_model import EmissionRequest
from app.models.message_model import Message
from app.models.ai_usage_model import AIUsage

DATABASE_URL = os.getenv("DATABASE_URL")

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    if not DATABASE_URL:
        pytest.exit("DATABASE_URL não configurada")
    
    engine = create_engine(DATABASE_URL)
    
    # No início da sessão, limpamos tudo
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    yield engine

@pytest.fixture
def db_session():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def client(db_session):
    """Fixture que fornece um TestClient com override da dependência de DB."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass # A limpeza é feita pela fixture db_session
    
    app.dependency_overrides[get_db] = override_get_db
    # Desativa o rate limit globalmente durante os testes
    limiter.enabled = False 
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

# --- FIXTURES PARA DADOS DE TESTE (DRY) ---

def generate_valid_cpf():
    """Gera um CPF válido para testes."""
    import random
    cpf = [random.randint(0, 9) for _ in range(9)]
    for _ in range(2):
        val = sum([(len(cpf) + 1 - i) * v for i, v in enumerate(cpf)]) % 11
        cpf.append(11 - val if val > 1 else 0)
    return "".join(map(str, cpf))

def generate_valid_cnpj():
    """Gera um CNPJ válido para testes."""
    import random
    cnpj = [random.randint(0, 9) for _ in range(8)] + [0, 0, 0, 1]
    for _ in range(2):
        multiplicadores = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] if len(cnpj) == 12 else [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        val = sum(v * multiplicadores[i] for i, v in enumerate(cnpj)) % 11
        cnpj.append(0 if val < 2 else 11 - val)
    return "".join(map(str, cnpj))

@pytest.fixture
def test_user(db_session):
    """Cria um usuário base para testes."""
    from app.repositories.user_repository import UserRepository
    from app.schemas.user_schemas import UserCreate
    
    email = f"test_{os.urandom(4).hex()}@example.com"
    user_in = UserCreate(
        email=email,
        password="password123",
        is_active=True,
        cpf=generate_valid_cpf(),
        rg="1234567",
        celular="11999999999",
        genero="M"
    )
    return UserRepository.create_user(db_session, user_in)

@pytest.fixture
def auth_headers(test_user):
    """Fixture que fornece cabeçalhos de autenticação para o test_user."""
    from app.core.security import create_access_token
    access_token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
def test_company(db_session, test_user):
    """Cria uma empresa base vinculada ao test_user."""
    from app.repositories.company_repository import CompanyRepository
    from app.schemas.company_schemas import CompanyCreate
    from app.models.user_model import UserCompanyLink, UserCompanyRole
    
    company_in = CompanyCreate(
        razao_social="Test Company LTDA",
        cnpj=generate_valid_cnpj()
    )
    company = CompanyRepository.create(db_session, company_in)
    company.owner_id = test_user.id
    
    # Criar o vínculo de MASTER para o dono da empresa
    link = UserCompanyLink(
        user_id=test_user.id,
        company_id=company.id,
        role=UserCompanyRole.MASTER.value,
        is_active=True
    )
    db_session.add(link)
    db_session.commit()
    db_session.refresh(company)
    return company

@pytest.fixture
def test_category(db_session):
    """Cria uma categoria de documento base."""
    from app.repositories.document_repository import DocumentRepository
    from app.schemas.document_schemas import DocumentCategoryCreate
    
    slug = f"cat_{os.urandom(4).hex()}"
    cat_in = DocumentCategoryCreate(
        name="Categoria Teste",
        slug=slug,
        order=1
    )
    return DocumentRepository.create_category(db_session, cat_in)

@pytest.fixture
def test_doc_type(db_session, test_category):
    """Cria um tipo de documento base."""
    from app.repositories.document_repository import DocumentRepository
    from app.schemas.document_schemas import DocumentTypeCreate
    from app.models.document_type_model import DocumentScope
    
    slug = f"type_{os.urandom(4).hex()}"
    type_in = DocumentTypeCreate(
        category_id=test_category.id,
        name="Tipo Teste",
        slug=slug,
        validity_days_default=30,
        scope=DocumentScope.NATIONAL
    )
    return DocumentRepository.create_type(db_session, type_in)

@pytest.fixture
def test_emission_rule(db_session, test_doc_type):
    """Cria uma regra de emissão base."""
    from app.repositories.emission_rule_repository import EmissionRuleRepository
    from app.schemas.emission_rule_schemas import EmissionRuleCreate
    
    rule_in = EmissionRuleCreate(
        document_type_id=test_doc_type.id,
        state="SP",
        city="São Paulo",
        emission_link="http://example.com"
    )
    return EmissionRuleRepository.create(db_session, rule_in)
