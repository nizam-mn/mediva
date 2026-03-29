import json
import re
from groq import Groq
from app.config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)


def extract_json(text: str):
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print("JSON PARSE ERROR:", e)

    return {}


def analyze_medical_document(text: str):
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0,

            messages=[
                {
                    "role": "system",
                    "content": """
You are an expert medical document analyzer.

You will receive medical documents like:
- Lab reports
- Prescriptions
- Scan reports
- Bills

Your job:

1. Detect document type:
   lab_report / prescription / scan_report / bill

2. Generate a PATIENT-FRIENDLY SUMMARY

3. Extract IMPORTANT NOTES (warnings, risks, observations)

4. If it is a LAB REPORT:
   extract tests with values

STRICT RULES:
- Output ONLY JSON
- No explanation
- No markdown
- No extra text

FORMAT:

{
  "type": "lab_report",
  "summary": "Explanation in simple words",
  "important_notes": ["point1", "point2", "point3", "point4"],
  "tests": [
    {
      "name": "Hemoglobin",
      "value": 11.2,
      "unit": "g/dL",
      "status": "low"
    }
  ]
}

If not lab report:
- tests = []
"""
                },
                {
                    "role": "user",
                    "content": f"Analyze this medical document:\n{text[:12000]}"
                }
            ]
        )

        raw = completion.choices[0].message.content
        print("RAW AI RESPONSE:\n", raw)

        parsed = extract_json(raw)

        if not parsed:
            return {}

        # Ensure fields exist
        parsed.setdefault("type", "unknown")
        parsed.setdefault("summary", "")
        parsed.setdefault("important_notes", [])
        parsed.setdefault("tests", [])

        return parsed

    except Exception as e:
        print("AI ERROR:", str(e))
        return {}