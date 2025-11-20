# apps/api/check_routes.py
from main import app

print("Registered Routes:")
for route in app.routes:
    print(f"{list(route.methods)} {route.path}")
