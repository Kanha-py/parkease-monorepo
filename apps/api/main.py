from fastapi import FastAPI
import os
from dotenv import load_dotenv

load_dotenv() # Load .env file

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ParkEase API"}

@app.get("/api/health/keys")
def check_keys():
    # This endpoint confirms our .env keys are loaded
    return {
        "twilio_loaded": bool(os.getenv("TWILIO_ACCOUNT_SID")),
        "google_loaded": bool(os.getenv("GOOGLE_MAPS_API_KEY")),
        "razorpay_loaded": bool(os.getenv("RAZORPAY_KEY_ID")),
    }
