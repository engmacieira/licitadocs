import time
import uuid
import pytest
import logging
from app.models.company_model import Company
from app.models.document_model import Document

def test_repository_mass_insertion_stress(db_session, test_user):
    num_companies = 100
    num_documents_per_company = 5
    
    logging.info(f"Starting repository mass insert test for {num_companies} companies.")
    start_time = time.time()
    
    companies = []
    for i in range(num_companies):
        c_id = str(uuid.uuid4())
        c = Company(
            id=c_id,
            cnpj=f"{str(i).zfill(14)}",
            razao_social=f"Company Stress {i}",
            owner_id=test_user.id
        )
        companies.append(c)
    
    # Bulk insert companies
    try:
        db_session.bulk_save_objects(companies)
        db_session.commit()
    except Exception as e:
        db_session.rollback()
        logging.error(f"Failed to bulk insert companies: {e}")
        pytest.fail(f"Bulk insert failed: {e}")

    documents = []
    for c in companies:
        for j in range(num_documents_per_company):
            doc_id = str(uuid.uuid4())
            d = Document(
                id=doc_id,
                title=f"Doc {j} for {c.razao_social}",
                filename=f"doc_{j}.pdf",
                file_path=f"path/to/doc_{j}.pdf",
                company_id=c.id,
                uploaded_by_id=test_user.id
            )
            documents.append(d)
            
    # Bulk insert documents
    try:
        db_session.bulk_save_objects(documents)
        db_session.commit()
    except Exception as e:
        db_session.rollback()
        pytest.fail(f"Bulk insert documents failed: {e}")

    duration = time.time() - start_time
    logging.info(f"Successfully inserted {num_companies * num_documents_per_company} documents in {duration:.4f} seconds.")
    assert duration < 10.0 # Just a reasonable upper bound for local testing
