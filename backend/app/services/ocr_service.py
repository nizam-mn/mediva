from paddleocr import PaddleOCR
import cv2
import numpy as np

ocr = PaddleOCR(use_angle_cls=True, lang="en")


async def extract_image_text(file_bytes):

    # ✅ file_bytes is already bytes (NO .read())
    nparr = np.frombuffer(file_bytes, np.uint8)

    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return ""

    result = ocr.ocr(img)

    text = ""

    if result and result[0]:
        for line in result[0]:
            text += line[1][0] + " "

    return text.strip()