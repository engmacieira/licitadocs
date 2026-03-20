import os
import pytest
import shutil
from io import BytesIO
from unittest.mock import MagicMock
from fastapi import UploadFile
from app.core.storage import save_file_locally, delete_file_locally, UPLOAD_DIR, BASE_DIR

def test_save_file_locally(tmp_path):
    """Happy Path: Verify saving a file locally."""
    # Mocking UploadFile
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test_document.pdf"
    mock_file.file = BytesIO(b"conteudo do arquivo")
    
    # Override UPLOAD_DIR for testing
    test_upload_dir = tmp_path / "storage" / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)
    
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.core.storage.UPLOAD_DIR", str(test_upload_dir))
        
        # Test saving
        relative_path = save_file_locally(mock_file)
        
        assert "storage/uploads/" in relative_path
        assert relative_path.endswith(".pdf")
        
        # Verify file exists on disk
        # relative_path is 'storage/uploads/uuid.pdf'
        # we need to check if it's in test_upload_dir
        filename = relative_path.split("/")[-1]
        full_path = test_upload_dir / filename
        assert full_path.exists()

def test_save_file_no_extension(tmp_path):
    """Edge Case: Verify saving a file with no extension."""
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "no_ext"
    mock_file.file = BytesIO(b"conteudo")
    
    test_upload_dir = tmp_path / "storage" / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)
    
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.core.storage.UPLOAD_DIR", str(test_upload_dir))
        
        relative_path = save_file_locally(mock_file)
        assert relative_path.endswith(".bin")

def test_delete_file_locally(tmp_path):
    """Happy Path: Verify deleting a file."""
    test_file = tmp_path / "test_to_delete.txt"
    test_file.write_text("content")
    
    relative_path = "tmp_test/test_to_delete.txt"
    
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.core.storage.BASE_DIR", str(tmp_path))
        
        # Test deletion
        # relative path would be used as BASE_DIR + relative_path
        # so if BASE_DIR is tmp_path, and relative_path is 'test_to_delete.txt'
        delete_file_locally("test_to_delete.txt")
        assert not test_file.exists()

def test_delete_non_existent_file(caplog):
    """Edge Case: Verify deleting a non-existent file doesn't crash."""
    delete_file_locally("non_existent_file.pdf")
    # Should not raise error, just log (if configured)
    # We can check logs if needed, but the main thing is it doesn't crash.

def test_save_file_io_error(tmp_path):
    """Error Handling: Verify IOError when saving fails."""
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "fail.pdf"
    
    # Mock shutil.copyfileobj to raise an exception
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("shutil.copyfileobj", MagicMock(side_effect=Exception("Write failed")))
        
        with pytest.raises(IOError) as exc_info:
            save_file_locally(mock_file)
        assert "Não foi possível salvar o arquivo no servidor" in str(exc_info.value)
