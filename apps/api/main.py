from fastapi import FastAPI
import os
from dotenv import load_dotenv
from app.config import settings
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, lots, seller, search

load_dotenv()  # Load .env file

app = FastAPI(title="ParkEase API", version="1.0")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# Route inclusion
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(lots.router, prefix="/lots", tags=["Lots"])
app.include_router(seller.router, prefix="/my-spot", tags=["Seller"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
