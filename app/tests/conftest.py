import os
import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Carregar o arquivo .env.test
env_path = os.path.join(os.path.dirname(__file__), "../../.env.test")
load_dotenv(env_path, override=True)

from app.core.database import Base
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

DATABASE_URL = os.getenv("DATABASE_URL")

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    if not DATABASE_URL:
        pytest.exit("DATABASE_URL não configurada")
    
    engine = create_engine(DATABASE_URL)
    
    # No início da sessão, limpamos tudo
    print("\n--- [SETUP_DB] Dropping all tables ---")
    Base.metadata.drop_all(bind=engine)
    print("--- [SETUP_DB] Creating all tables ---")
    Base.metadata.create_all(bind=engine)
    print("--- [SETUP_DB] Finished ---")
    
    yield engine

@pytest.fixture
def db_session():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        # Tentamos o rollback, mas como os testes usam commit(), 
        # a estratégia agora é dados únicos por teste.
        try:
            session.rollback()
        except:
            pass
        session.close()
