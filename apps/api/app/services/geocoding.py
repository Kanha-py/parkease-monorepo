import googlemaps
from app.config import settings
from fastapi import HTTPException

gmaps = (
    googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
    if settings.GOOGLE_MAPS_API_KEY
    else None
)


def get_lat_lon(address: str):
    if not gmaps:
        # Dev Fallback (Mumbai)
        return 19.0760, 72.8777

    try:
        geocode_result = gmaps.geocode(address)
        if not geocode_result:
            raise HTTPException(status_code=400, detail="Address not found.")
        location = geocode_result[0]["geometry"]["location"]
        return location["lat"], location["lng"]
    except Exception as e:
        print(f"Geocoding error: {e}")
        raise HTTPException(status_code=400, detail="Error validating address.")
