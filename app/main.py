from fastapi import FastAPI

app = FastAPI(title="Base FastAPI Project")

@app.get("/")
def read_root():
    return {"message": "API Base Online! Acesse /docs"}