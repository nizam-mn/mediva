import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

IMAGEKIT_PUBLIC = os.getenv("IMAGEKIT_PUBLIC")
IMAGEKIT_PRIVATE = os.getenv("IMAGEKIT_PRIVATE")
IMAGEKIT_URL = os.getenv("IMAGEKIT_URL")
