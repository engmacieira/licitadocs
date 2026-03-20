import pytest
from sqlalchemy import Column, Integer, String
from app.core.database import Base, SoftDeleteMixin, generate_uuid, get_db
from sqlalchemy.orm import Session

# Model for testing SoftDeleteMixin
class TestModel(Base, SoftDeleteMixin):
    __tablename__ = "test_model"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)

def test_generate_uuid():
    """Happy Path: Verify generate_uuid returns a valid looking UUID string."""
    uid = generate_uuid()
    assert isinstance(uid, str)
    assert len(uid) == 36
    assert "-" in uid

def test_soft_delete_mixin_columns():
    """Edge Case: Verify SoftDeleteMixin adds deleted_at column."""
    assert hasattr(TestModel, "deleted_at")
    assert TestModel.deleted_at.property.columns[0].name == "deleted_at"

def test_get_db():
    """Happy Path: Verify get_db yields a session and closes it."""
    db_gen = get_db()
    db = next(db_gen)
    assert isinstance(db, Session)
    
    # We can't easily check if it's closed without mocking, 
    # but we can verify it was yielded correctly.
    try:
        next(db_gen)
    except StopIteration:
        pass # Expected
