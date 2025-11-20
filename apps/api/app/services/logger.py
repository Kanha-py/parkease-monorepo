import json
import logging
from datetime import datetime
import sys

# Configure Root Logger to output to Standard Out
logger = logging.getLogger("parkease_event_stream")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter("%(message)s")  # We only want the JSON message
handler.setFormatter(formatter)
logger.addHandler(handler)


async def log_event(event_type: str, user_id: str | None, payload: dict):
    """
    Logs an event as a structured JSON object to stdout.
    This allows AWS CloudWatch or similar tools to ingest the data
    for the Data Warehouse (Milestone 10).
    """
    event = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": str(user_id) if user_id else None,
        "environment": "production",
        "payload": payload,
    }

    # Log as a single line JSON string
    logger.info(json.dumps(event))
