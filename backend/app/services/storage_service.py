from imagekitio import ImageKit
from app.config import IMAGEKIT_PRIVATE

imagekit = ImageKit(private_key=IMAGEKIT_PRIVATE)


def upload_file(file_bytes, filename):
    try:
        response = imagekit.files.upload(
            file=file_bytes,
            file_name=filename,
            folder="/products",
        )

        print("IMAGEKIT RESPONSE:", response)

        if not response or not response.url:
            raise Exception("Upload failed")

        return response.url

    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        return None
