# https://biografspegeln.se/program?list=upcoming
# Get the data from the url and extract Project Hail Mary container info
# Run with --monitor to track changes and notify via macOS notification
# Run with --tui for a Rich-based terminal UI

import argparse
import json
import os
import re
from datetime import datetime, timezone
import smtplib
import subprocess
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from urllib.request import urlopen

from config import EMAIL_TO, GMAIL_EMAIL, GOOGLE_CLOUD_KEY

URL = "https://biografspegeln.se/program?list=upcoming"
STATE_FILE = Path(
    os.environ.get("STATE_FILE", str(Path.home() / ".project-hail-mary-state.json"))
)


def find_project_hail_mary(obj):
    if isinstance(obj, dict):
        if obj.get("url") == "https://biografspegeln.se/program/project-hail-mary":
            return obj
        if obj.get("info", {}).get("title") == "Project Hail Mary":
            return obj
        for v in obj.values():
            result = find_project_hail_mary(v)
            if result:
                return result
    elif isinstance(obj, list):
        for item in obj:
            result = find_project_hail_mary(item)
            if result:
                return result
    return None


def fetch_movie_data():
    with urlopen(URL) as response:
        html = response.read().decode()

    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>([^<]+)</script>', html)
    if not match:
        raise ValueError("Could not find __NEXT_DATA__ in page")

    data = json.loads(match.group(1))
    movie = find_project_hail_mary(data)
    if not movie:
        raise ValueError("Project Hail Mary not found in page data")

    return movie


def get_ticket_status(movie):
    tickets_out_now = movie.get("ticketsOutNow", False)
    tickets_on_sale = movie.get("ticketsOnSale")
    if tickets_out_now:
        return "Biljetter ute nu"
    if tickets_on_sale:
        return "Biljetter"
    return "INVÄNTAR BILJETTSLÄPP"


def extract_state(movie):
    info = movie.get("info", {})
    premiere = movie.get("premiereDate", "")
    return {
        "ticket_status": get_ticket_status(movie),
        "premiere_date": premiere[:10] if premiere else "",
        "url": movie.get("url", ""),
    }

def get_display_data(movie):
    """Return full data for display (print or TUI)."""
    info = movie.get("info", {})
    premiere = movie.get("premiereDate", "")
    genres = info.get("genres", [])
    genre_names = [g.get("name", "") for g in genres] if genres else []
    duration_min = info.get("duration")
    duration = (
        f"{duration_min // 60}h {duration_min % 60}min"
        if isinstance(duration_min, int)
        else (duration_min or "2h 46min")
    )
    age_rating = (
        info.get("ageRating", {}).get("name", "Ej granskad")
        if isinstance(info.get("ageRating"), dict)
        else "Ej granskad"
    )
    return {
        "title": info.get("title", "Project Hail Mary"),
        "url": movie.get("url", ""),
        "genre": ", ".join(genre_names) or "Science Fiction",
        "duration": duration,
        "age_rating": age_rating,
        "ticket_status": get_ticket_status(movie),
        "premiere": premiere[:10] if premiere else "20 mars 2026",
    }


def notify_macos(title, text, open_url=None):
    script = f'display notification "{text}" with title "{title}" sound name "Glass"'
    subprocess.run(["osascript", "-e", script], check=False)
    if open_url:
        subprocess.run(["open", open_url], check=False)


def notify_gmail(subject, body):
    """Send email via Gmail SMTP. Uses config: GMAIL_EMAIL, GOOGLE_CLOUD_KEY, EMAIL_TO."""
    user = GMAIL_EMAIL
    password = GOOGLE_CLOUD_KEY
    to = EMAIL_TO or user
    if not user or not password:
        return
    try:
        msg = MIMEMultipart()
        msg["From"] = user
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(user, password)
            server.sendmail(user, to, msg.as_string())
    except Exception:
        pass  # Silently skip on failure (e.g. network, credentials)


def send_test_email():
    """Send a test email to verify Gmail config works."""
    if not GMAIL_EMAIL or not GOOGLE_CLOUD_KEY:
        raise SystemExit(
            "Gmail not configured. Edit config.py and set GMAIL_EMAIL and GOOGLE_CLOUD_KEY "
            "(your Gmail app password)."
        )
    to = EMAIL_TO or GMAIL_EMAIL
    subject = "Project Hail Mary - Test Email"
    body = "This is a test email from the Project Hail Mary monitor. If you received this, email notifications are working."
    try:
        msg = MIMEMultipart()
        msg["From"] = GMAIL_EMAIL
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_EMAIL, GOOGLE_CLOUD_KEY)
            server.sendmail(GMAIL_EMAIL, to, msg.as_string())
        print(f"Test email sent to {to}")
    except Exception as e:
        raise SystemExit(f"Failed to send test email: {e}")


def _state_for_compare(state):
    """Fields used to detect real changes (excludes last_checked_at)."""
    return {
        "ticket_status": state.get("ticket_status"),
        "premiere_date": state.get("premiere_date"),
        "url": state.get("url", ""),
    }


def run_monitor():
    movie = fetch_movie_data()
    current = extract_state(movie)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    current["last_checked_at"] = now

    # Heartbeat emails: optional, controlled by EMAIL_ON_EVERY_CHECK env
    email_on_every_check = os.environ.get("EMAIL_ON_EVERY_CHECK", "").lower() in ("1", "true", "yes")
    if email_on_every_check:
        notify_gmail(
            "Project Hail Mary - Heartbeat",
            f"Checked at {now}\nStatus: {current['ticket_status']}\nPremiere: {current.get('premiere_date', '')}",
        )

    previous = None
    if STATE_FILE.exists():
        try:
            previous = json.loads(STATE_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass

    if previous is None:
        STATE_FILE.write_text(json.dumps(current, indent=2))
        return

    if _state_for_compare(current) == _state_for_compare(previous):
        STATE_FILE.write_text(json.dumps(current, indent=2))
        return

    # State changed - notify
    ticket_status = current["ticket_status"]
    tickets_available = ticket_status in ("Biljetter", "Biljetter ute nu")

    if tickets_available:
        title = "Project Hail Mary - Biljetter!"
        text = f"Biljetter är nu tillgängliga: {ticket_status}"
        notify_macos(title, text, open_url=current.get("url"))
        url = current.get("url", "")
        body = f"{text}\n\n{url}" if url else text
        notify_gmail(title, body)
    else:
        title = "Project Hail Mary"
        changes = []
        if current.get("ticket_status") != previous.get("ticket_status"):
            changes.append(f"ticket status: {ticket_status}")
        if current.get("premiere_date") != previous.get("premiere_date"):
            changes.append(f"premiere: {current.get('premiere_date')}")
        text = "Ändring: " + ", ".join(changes) if changes else "Data har ändrats"
        notify_macos(title, text)
        notify_gmail(title, text)

    STATE_FILE.write_text(json.dumps(current, indent=2))


def run_tui(refresh_interval: int = 30) -> None:
    try:
        from tui_app import run as run_tui_app
    except ImportError:
        raise SystemExit("Textual is required for TUI mode. Install with: pip install textual")
    run_tui_app(initial_interval=refresh_interval)


def run_print():
    movie = fetch_movie_data()
    d = get_display_data(movie)
    print("=" * 50)
    print("Project Hail Mary - Container Info")
    print("=" * 50)
    print(f"Title:       {d['title']}")
    print(f"URL:         {d['url']}")
    print(f"Ticket:      {d['ticket_status']}")
    print(f"Premiär:     {d['premiere']}")
    print("=" * 50)


def main():
    global STATE_FILE
    parser = argparse.ArgumentParser(description="Check Project Hail Mary at Biograf Spegeln")
    parser.add_argument(
        "--state-file",
        type=Path,
        metavar="PATH",
        help="Path to state file (default: ~/.project-hail-mary-state.json or STATE_FILE env)",
    )
    parser.add_argument(
        "--monitor",
        action="store_true",
        help="Monitor mode: check for changes and notify via macOS notification",
    )
    parser.add_argument(
        "--tui",
        action="store_true",
        help="Rich TUI mode: live-updating dashboard",
    )
    parser.add_argument(
        "--refresh",
        type=int,
        default=30,
        metavar="SECONDS",
        help="TUI refresh interval (default: 30)",
    )
    parser.add_argument(
        "--test-email",
        action="store_true",
        help="Send a test email to verify Gmail config",
    )
    args = parser.parse_args()
    if args.state_file is not None:
        STATE_FILE = args.state_file

    if args.test_email:
        send_test_email()
    elif args.monitor:
        run_monitor()
    elif args.tui:
        run_tui(refresh_interval=args.refresh)
    else:
        run_print()


if __name__ == "__main__":
    main()
