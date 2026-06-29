import logging
import smtplib
from email.message import EmailMessage

from app.core.config import Settings

logger = logging.getLogger(__name__)


class AuthDeliveryService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def send_email_verification(self, *, to_email: str, verify_url: str) -> None:
        subject = "Verify your uDeets account"
        body = (
            f"Hi,\n\n"
            f"Your uDeets account has limited access until you verify this email.\n"
            f"Click the link below to verify and unlock full access:\n\n"
            f"{verify_url}\n\n"
            f"This link expires in 24 hours.\n\n"
            f"If you did not create a uDeets account, you can ignore this email.\n"
        )
        if self.settings.smtp_host:
            await self._send_smtp(to_email=to_email, subject=subject, body=body)
            return
        # Dev mode (no SMTP configured): make the link impossible to miss.
        line = f"[auth-email][DEV] verification link to={to_email} url={verify_url}"
        logger.warning(line)
        print(f"\n========== {line} ==========\n", flush=True)

    async def send_registration_attempt_notice(self, *, to_email: str) -> None:
        subject = "Sign-up attempt for your uDeets account"
        body = (
            "Someone tried to create a uDeets account using this email address.\n"
            "If this was you, sign in instead. If not, you can ignore this message.\n"
        )
        if self.settings.smtp_host:
            await self._send_smtp(to_email=to_email, subject=subject, body=body)
            return
        logger.info("[auth-email] registration-attempt-notice to=%s", to_email)

    async def send_phone_otp(self, *, to_phone: str, code: str) -> None:
        message = f"Your uDeets verification code is {code}. It expires in 10 minutes."
        if self.settings.sms_provider == "twilio" and self.settings.twilio_account_sid:
            logger.warning("[auth-sms] Twilio not wired yet; logging OTP for dev")
        # Dev mode (no real SMS gateway): make the code impossible to miss.
        line = f"[auth-sms][DEV] otp to={to_phone} code={code}"
        logger.warning(line)
        print(f"\n========== {line} ==========\n", flush=True)

    async def _send_smtp(self, *, to_email: str, subject: str, body: str) -> None:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self.settings.smtp_from or "noreply@udeets.com"
        msg["To"] = to_email
        msg.set_content(body)
        with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port) as smtp:
            if self.settings.smtp_use_tls:
                smtp.starttls()
            if self.settings.smtp_username and self.settings.smtp_password:
                smtp.login(self.settings.smtp_username, self.settings.smtp_password)
            smtp.send_message(msg)
