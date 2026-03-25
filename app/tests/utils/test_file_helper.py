import os
import pytest
from io import BytesIO
from unittest.mock import MagicMock
from fastapi import UploadFile
from pathlib import Path
from app.utils.file_helper import save_upload_file, delete_file, UPLOAD_DIR

@pytest.mark.asyncio
async def test_save_upload_file(tmp_path):
    """Happy Path: Verify saving an upload file."""
    # Mocking UploadFile
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test_document.pdf"
    mock_file.read = MagicMock(side_effect=lambda size=-1: b"conteudo do arquivo")
    
    # Em Python >= 3.8, podemos usar AsyncMock para métodos awaitables
    from unittest.mock import AsyncMock
    mock_file.read = AsyncMock(return_value=b"conteudo do arquivo")
    mock_file.close = AsyncMock()
    
    # Override UPLOAD_DIR for testing
    test_upload_dir = tmp_path / "storage" / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)
    
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.utils.file_helper.UPLOAD_DIR", test_upload_dir)
        
        # Test saving
        relative_path, size = await save_upload_file(mock_file, "vault")
        
        assert "vault" in relative_path
        assert relative_path.endswith(".pdf")
        assert size == len(b"conteudo do arquivo")
        
        # Verify file exists on disk
        full_path = Path(relative_path)
        assert full_path.exists()
        assert full_path.read_bytes() == b"conteudo do arquivo"

def test_delete_file(tmp_path):
    """Happy Path: Verify deleting a file."""
    test_file = tmp_path / "test_to_delete.txt"
    test_file.write_text("content")
    
    # Test deletion
    delete_file(str(test_file))
    assert not test_file.exists()

def test_delete_non_existent_file(caplog):
    """Edge Case: Verify deleting a non-existent file doesn't crash."""
    delete_file("non_existent_file.pdf")
    # Should not raise error

@pytest.mark.asyncio
async def test_save_file_path_traversal(tmp_path):
    """Security: Verify Path Traversal protection."""
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test.pdf"
    
    test_upload_dir = tmp_path / "storage" / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)
    
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.utils.file_helper.UPLOAD_DIR", test_upload_dir)
        
        with pytest.raises(ValueError, match="Path Traversal detectado"):
            await save_upload_file(mock_file, "../../etc")
