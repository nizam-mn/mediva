import os
import json
from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["health-prediction"])

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

@router.post("/predict/health")
async def predict_health(metrics: Dict[str, Any]):
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on the server")

    # Serialize incoming metrics and filter out None values
    data_dict = {k: v for k, v in metrics.items() if v is not None}
    
    if not data_dict:
        raise HTTPException(status_code=400, detail="No health metrics provided")

    prompt = f"""
    You are an expert medical AI system. Analyze the following health metrics for a patient.
    Compare their values against standard medical thresholds. Provide a brief points wise
    analysis of their overall health, identifying any potential risks (e.g., pre-diabetes, cardiovascular risk).
    
    Metrics provided:
    {json.dumps(data_dict, indent=2)}

    Respond EXCLUSIVELY with a JSON object in this exact format.
    {{
        "health_score": <number between 0 and 100 representing overall health>,
        "risk_factors": ["risk factor 1", "risk factor 2"],
        "insights": "Detailed medical explanation of what these metrics indicate.",
        "recommendations": ["recommendation 1", "recommendation 2"]
    }}
    """

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            ),
        )
        
        # Parse the JSON response strictly
        result = json.loads(response.text)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate prediction: {str(e)}")
