"""Email service supporting AWS SES and Mailgun."""
import httpx
import structlog
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings

logger = structlog.get_logger()


# =============================================================================
# AWS SES Implementation
# =============================================================================


def get_ses_client():
    """Get boto3 SES client."""
    import boto3

    return boto3.client(
        "ses",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
    )


async def send_email_ses(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: str | None = None,
) -> bool:
    """
    Send an email via AWS SES.
    Returns True if successful, False otherwise.
    """
    if not settings.SES_SENDER_EMAIL:
        logger.warning("SES_SENDER_EMAIL not configured, skipping email send")
        return False

    try:
        client = get_ses_client()

        message_body = {"Text": {"Data": body_text, "Charset": "UTF-8"}}
        if body_html:
            message_body["Html"] = {"Data": body_html, "Charset": "UTF-8"}

        response = client.send_email(
            Source=settings.SES_SENDER_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": message_body,
            },
        )

        logger.info(
            "Email sent successfully via SES",
            to=to_email,
            message_id=response.get("MessageId"),
        )
        return True

    except (BotoCoreError, ClientError) as e:
        logger.error("Failed to send email via SES", to=to_email, error=str(e))
        return False


# =============================================================================
# Mailgun Implementation
# =============================================================================


async def send_email_mailgun(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: str | None = None,
) -> bool:
    """
    Send an email via Mailgun API.
    Returns True if successful, False otherwise.
    """
    if not settings.MAILGUN_API_KEY or not settings.MAILGUN_DOMAIN:
        logger.warning(
            "MAILGUN_API_KEY or MAILGUN_DOMAIN not configured, skipping email send"
        )
        return False

    if not settings.MAILGUN_SENDER_EMAIL:
        logger.warning("MAILGUN_SENDER_EMAIL not configured, skipping email send")
        return False

    try:
        # Build sender with name if configured
        if settings.MAILGUN_SENDER_NAME:
            from_address = (
                f"{settings.MAILGUN_SENDER_NAME} <{settings.MAILGUN_SENDER_EMAIL}>"
            )
        else:
            from_address = settings.MAILGUN_SENDER_EMAIL

        # Prepare the request data
        data = {
            "from": from_address,
            "to": to_email,
            "subject": subject,
            "text": body_text,
        }

        if body_html:
            data["html"] = body_html

        # Mailgun API endpoint
        url = f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                auth=("api", settings.MAILGUN_API_KEY),
                data=data,
                timeout=30.0,
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(
                    "Email sent successfully via Mailgun",
                    to=to_email,
                    message_id=result.get("id"),
                )
                return True
            else:
                logger.error(
                    "Failed to send email via Mailgun",
                    to=to_email,
                    status_code=response.status_code,
                    response=response.text,
                )
                return False

    except httpx.HTTPError as e:
        logger.error("Failed to send email via Mailgun", to=to_email, error=str(e))
        return False
    except Exception as e:
        logger.error(
            "Unexpected error sending email via Mailgun", to=to_email, error=str(e)
        )
        return False


# =============================================================================
# Main Email Function (Provider Switch)
# =============================================================================


async def send_email(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: str | None = None,
) -> bool:
    """
    Send an email using the configured provider (SES or Mailgun).
    Set EMAIL_PROVIDER env variable to switch between "ses" and "mailgun".
    Returns True if successful, False otherwise.
    """
    provider = settings.EMAIL_PROVIDER.lower()

    if provider == "mailgun":
        return await send_email_mailgun(to_email, subject, body_text, body_html)
    elif provider == "ses":
        return await send_email_ses(to_email, subject, body_text, body_html)
    else:
        logger.error(
            "Unknown email provider configured",
            provider=provider,
            supported=["ses", "mailgun"],
        )
        return False


# =============================================================================
# Email Templates
# =============================================================================


async def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send OTP verification email."""
    subject = f"{settings.PROJECT_NAME} - Verify Your Email"

    body_text = f"""
Hello,

Your verification code is: {otp_code}

This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.

If you didn't request this code, please ignore this email.

Best regards,
{settings.PROJECT_NAME} Team
"""

    body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Verify Your Email</h2>
        <p>Hello,</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2c3e50;">{otp_code}</span>
        </div>
        <p>This code will expire in <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            {settings.PROJECT_NAME} Team
        </p>
    </div>
</body>
</html>
"""

    return await send_email(to_email, subject, body_text, body_html)


async def send_password_reset_email(to_email: str, otp_code: str) -> bool:
    """Send password reset OTP email."""
    subject = f"{settings.PROJECT_NAME} - Reset Your Password"

    body_text = f"""
Hello,

You requested to reset your password. Your reset code is: {otp_code}

This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.

If you didn't request this, please ignore this email or contact support if you're concerned.

Best regards,
{settings.PROJECT_NAME} Team
"""

    body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You requested to reset your password. Your reset code is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2c3e50;">{otp_code}</span>
        </div>
        <p>This code will expire in <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email or contact support if you're concerned.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            {settings.PROJECT_NAME} Team
        </p>
    </div>
</body>
</html>
"""

    return await send_email(to_email, subject, body_text, body_html)
