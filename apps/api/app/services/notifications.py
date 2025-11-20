from twilio.rest import Client
from app.config import settings
from app.services.logger import log_event
import asyncio

# Initialize Twilio Client (Production Safe)
twilio_client = (
    Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    if settings.TWILIO_ACCOUNT_SID and "dummy" not in settings.TWILIO_ACCOUNT_SID
    else None
)


async def send_sms(to_phone: str, body: str):
    """
    Sends an SMS using Twilio. Fails silently (logs error) so it doesn't block the API.
    """
    if not twilio_client:
        print(f"[Mock SMS] To: {to_phone} | Body: {body}")
        return

    try:
        # Run blocking Twilio call in a separate thread to keep FastAPI async
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            lambda: twilio_client.messages.create(
                body=body, from_=settings.TWILIO_PHONE_NUMBER, to=to_phone
            ),
        )
        await log_event("notification_sent", None, {"type": "sms", "to": to_phone})
    except Exception as e:
        print(f"[Notification Error] Failed to send SMS to {to_phone}: {e}")


async def notify_booking_confirmed(
    user_phone: str, user_name: str, lot_name: str, booking_id: str
):
    message = (
        f"ParkEase: Booking Confirmed! ✅\n"
        f"Hi {user_name}, your spot at {lot_name} is reserved.\n"
        f"Booking ID: {booking_id}\n"
        f"Show your QR code at the gate."
    )
    await send_sms(user_phone, message)


async def notify_payout_processed(seller_phone: str, amount: float):
    message = (
        f"ParkEase: Payout Processed 💸\n"
        f"We have sent ₹{amount} to your linked account.\n"
        f"It may take 24-48 hours to reflect."
    )
    await send_sms(seller_phone, message)
