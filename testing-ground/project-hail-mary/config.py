"""
Project Hail Mary - Configuration
Edit this file to set your email and Gmail app password.
Add config.py to .gitignore if it contains secrets.

For CI (e.g. GitHub Actions): set GMAIL_EMAIL, GOOGLE_CLOUD_KEY, EMAIL_TO as env vars
to override these values without committing secrets.
"""

import os

# Gmail SMTP settings (for notifications when ticket status changes)
# Env vars override for CI: GMAIL_EMAIL, GOOGLE_CLOUD_KEY, EMAIL_TO
GMAIL_EMAIL = os.environ.get("GMAIL_EMAIL") or "herrandyjohansson@gmail.com"
EMAIL_TO = os.environ.get("EMAIL_TO") or "herrandyjohansson@gmail.com"
GOOGLE_CLOUD_KEY = os.environ.get("GOOGLE_CLOUD_KEY") or "evlrxazgqxwnmemb"
