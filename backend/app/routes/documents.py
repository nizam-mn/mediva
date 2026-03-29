from fastapi import APIRouter, UploadFile, File
from app.services.pdf_service import extract_pdf_text
from app.services.ocr_service import extract_image_text
from app.services.ai_service import analyze_medical_document
from app.services.storage_service import upload_file
from app.services.metrics_service import extract_health_metrics
from app.utils.text_cleaner import clean_text

router = APIRouter()


@router.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()

        if not file_bytes:
            return {"error": "Empty file"}

        # ---------- UPLOAD ----------
        url = upload_file(file_bytes, file.filename)

        if not url:
            return {"error": "Upload failed"}

        # ---------- TEXT EXTRACTION ----------
        filename = file.filename.lower()
        text = ""

        try:
            if filename.endswith(".pdf"):
                text = await extract_pdf_text(file_bytes)
            else:
                text = await extract_image_text(file_bytes)

        except Exception as e:
            print("OCR FAILED:", str(e))
            text = ""  # ✅ fallback

        text = clean_text(text or "")

        # ---------- AI ANALYSIS ----------
        analysis = {}

        if text:  # ✅ only run AI if text exists
            analysis = analyze_medical_document(text)

        # ---------- METRICS ----------
        metrics = []
        if analysis.get("type") == "lab_report":
            from app.services.metrics_service import extract_health_metrics
            metrics = extract_health_metrics(analysis)

        return {
            "file_url": url,
            "parsed_text": text,

            "type": analysis.get("type"),
            "summary": analysis.get("summary"),
            "important_notes": analysis.get("important_notes"),

            "health_metrics": metrics,
        }

    except Exception as e:
        print("ERROR IN UPLOAD:", str(e))
        return {"error": str(e)}