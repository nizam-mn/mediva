import fitz

async def extract_pdf_text(file_bytes):

    # file_bytes is already bytes ✅
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    text = ""

    for page in doc:
        text += page.get_text()

    return text