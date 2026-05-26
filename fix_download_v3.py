import sys

with open("app/routers/document_router.py", "r") as f:
    content = f.read()

# 1. Update imports
content = content.replace("from fastapi.responses import FileResponse, StreamingResponse", "from fastapi.responses import StreamingResponse, RedirectResponse")
content = content.replace("from app.utils.file_helper import save_upload_file # Mudança para o nosso utilitário padronizado", "from app.utils.file_helper import save_upload_file, get_file_url")

# 2. Update download_document function
old_func_start = "def download_document("
new_func_start = "async def download_document("

# This is a bit risky but we know the structure
target_block = """    filename = os.path.basename(file_path)
    return FileResponse(path=file_path, filename=filename, media_type='application/pdf')"""

replacement_block = """    signed_url = await get_file_url(file_path)
    if not signed_url:
        raise HTTPException(status_code=500, detail="Erro ao gerar link de download")
    return RedirectResponse(url=signed_url)"""

content = content.replace(old_func_start, new_func_start)
content = content.replace(target_block, replacement_block)

# 3. Remove os.path.exists check
# Using a more robust replacement for the multi-line block
old_check = """    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Ficheiro físico não encontrado no servidor.")"""

content = content.replace(old_check, "")

with open("app/routers/document_router.py", "w") as f:
    f.write(content)
