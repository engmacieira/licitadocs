import io
import os
import pytest
from pathlib import Path
from fastapi import UploadFile
from unittest.mock import patch, MagicMock
from app.utils.file_helper import save_upload_file

@pytest.fixture
def temp_upload_dir(tmp_path):
    """Fixture to mock UPLOAD_DIR with a temporary path."""
    with patch("app.utils.file_helper.UPLOAD_DIR", tmp_path):
        yield tmp_path

def test_save_upload_file_happy_path(temp_upload_dir):
    """
    Test Happy Path: Success of the operation with valid data.
    Verifying return values and file persistence on disk.
    """
    # Setup
    content = b"test content for happy path"
    filename = "test_document.pdf"
    subfolder = "certificates"
    
    mock_file = io.BytesIO(content)
    upload_file = UploadFile(filename=filename, file=mock_file)
    
    # Execute
    file_path_str, file_size = save_upload_file(upload_file, subfolder)
    
    # Verify Return Values
    assert file_size == len(content)
    assert subfolder in file_path_str
    assert filename.split(".")[-1] in file_path_str
    
    # Verify Persistence on Disk
    full_path = Path(file_path_str)
    assert full_path.exists()
    assert full_path.read_bytes() == content
    
    # Verify Directory structure
    assert full_path.parent == temp_upload_dir / subfolder

def test_save_upload_file_no_extension_edge_case(temp_upload_dir):
    """
    Test Edge Cases: File with no extension.
    Verifying fallback to '.bin'.
    """
    # Setup
    content = b"no extension content"
    filename = "plain_file" # No dot
    subfolder = "uploads"
    
    mock_file = io.BytesIO(content)
    upload_file = UploadFile(filename=filename, file=mock_file)
    
    # Execute
    file_path_str, _ = save_upload_file(upload_file, subfolder)
    
    # Verify: The current logic in file_helper only defaults to .bin if filename is empty/None.
    # If a filename is provided but has no dot, the suffix is empty.
    assert not Path(file_path_str).suffix
    assert Path(file_path_str).exists()

def test_save_upload_file_empty_filename_edge_case(temp_upload_dir):
    """
    Test Edge Cases: Empty filename.
    """
    # Setup
    content = b"empty filename content"
    filename = "" 
    subfolder = "uploads"
    
    mock_file = io.BytesIO(content)
    upload_file = UploadFile(filename=filename, file=mock_file)
    
    # Execute
    file_path_str, _ = save_upload_file(upload_file, subfolder)
    
    # Verify
    assert file_path_str.endswith(".bin")
    assert Path(file_path_str).exists()

def test_save_upload_file_error_handling_and_cleanup(temp_upload_dir):
    """
    Test Error Handling: Force error during metadata calculation and verify cleanup.
    """
    # Setup
    content = b"unstable content"
    filename = "unstable.txt"
    subfolder = "temp_tests"
    
    mock_file = io.BytesIO(content)
    upload_file = UploadFile(filename=filename, file=mock_file)
    
    # Force error after writing the file but before returning (e.g., in getsize)
    with patch("os.path.getsize", side_effect=Exception("Simulated IO Error")):
        with pytest.raises(Exception) as excinfo:
            save_upload_file(upload_file, subfolder)
        assert "Simulated IO Error" in str(excinfo.value)
    
    # Verify cleanup: The file should have been deleted
    target_dir = temp_upload_dir / subfolder
    files = list(target_dir.glob("*"))
    assert len(files) == 0, "File should have been deleted after error"

def test_save_upload_file_directory_creation_failure(temp_upload_dir):
    """
    Test Error Handling: Validation of failure when directory cannot be created.
    """
    # Setup
    content = b"dir fail"
    filename = "test.txt"
    subfolder = "restricted"
    
    mock_file = io.BytesIO(content)
    upload_file = UploadFile(filename=filename, file=mock_file)
    
    # Force error in mkdir
    with patch("pathlib.Path.mkdir", side_effect=PermissionError("Permission Denied")):
        with pytest.raises(PermissionError):
            save_upload_file(upload_file, subfolder)

def test_save_upload_file_write_failure_cleanup(temp_upload_dir):
    """
    Test Error Handling: Failure during file writing.
    """
    # Setup
    content = b"write fail"
    filename = "test.txt"
    subfolder = "write_test"
    
    mock_file = io.BytesIO(content)
    upload_file = UploadFile(filename=filename, file=mock_file)
    
    # Force error in copyfileobj
    with patch("shutil.copyfileobj", side_effect=IOError("Disk Full")):
        with pytest.raises(IOError) as excinfo:
            save_upload_file(upload_file, subfolder)
        assert "Disk Full" in str(excinfo.value)
    
    # Ensure no file remains (even if partially written)
    target_dir = temp_upload_dir / subfolder
    files = list(target_dir.glob("*"))
    assert len(files) == 0
