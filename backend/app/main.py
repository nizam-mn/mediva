from fastapi import FastAPI
from app.routes import documents, predictions

app = FastAPI(
    title="Mediva Document Processor",
    version="1.0"
)

app.include_router(documents.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "Mediva backend running"}
