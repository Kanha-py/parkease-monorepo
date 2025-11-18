import json
from datetime import datetime

# Path for the local log file simulating the Kinesis stream (events_stream.jsonl)
LOG_FILE = "events_stream.jsonl"


async def log_event(event_type: str, user_id: str | None, payload: dict):
    """
    Asynchronously logs an event to a local file, simulating a data stream to
    a data warehouse (Milestone 10 foundation).
    """

    event = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "payload": payload,
    }

    # Write event as a single JSON line
    try:
        # Use simple file open/close for async safety in this mock
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(event) + "\n")
    except Exception as e:
        print(f"ERROR: Could not write event to log file: {e}")
