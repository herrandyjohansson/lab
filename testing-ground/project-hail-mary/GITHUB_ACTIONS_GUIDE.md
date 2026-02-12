# Project Hail Mary – GitHub Actions Guide

## Summary

A scheduled workflow runs every 30 minutes, fetches the Biograf Spegeln program page, and checks if Project Hail Mary ticket status has changed. If it changes (e.g. from "INVÄNTAR BILJETTSLÄPP" to "Biljetter ute nu"), it sends an email and commits the new state. State is stored in `state.json` and committed every run (heartbeat), so you can see in the commit history that the job is running.

**Heartbeat:** Each run updates `last_checked_at` in `state.json` and commits it, so you get a new commit every 30 min confirming the job ran.

**Test email:** Use **Run workflow** → check **Test email** to send a one-off test email and verify Gmail config.

**Toggle:** Set `EMAIL_ON_EVERY_CHECK` secret to `true` to receive an email on every run (useful for testing).

---

## Workflow

**Location:** `.github/workflows/check-tickets.yml` (repo root)

```yaml
name: Check Project Hail Mary Tickets

on:
  schedule:
    - cron: "*/30 * * * *"  # Every 30 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: testing-ground/project-hail-mary

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Run monitor
        env:
          STATE_FILE: ${{ github.workspace }}/testing-ground/project-hail-mary/state.json
          GMAIL_EMAIL: ${{ secrets.GMAIL_EMAIL }}
          GOOGLE_CLOUD_KEY: ${{ secrets.GOOGLE_CLOUD_KEY }}
          EMAIL_TO: ${{ secrets.EMAIL_TO }}
        run: |
          python check.py --monitor --state-file "$STATE_FILE"

      - name: Commit and push if state changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add state.json 2>/dev/null || true
          if git diff --staged --quiet; then
            echo "No change in state"
          else
            git commit -m "chore: update Project Hail Mary ticket state"
            git push
          fi

    permissions:
      contents: write  # For pushing state commits
```

---

## Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `GMAIL_EMAIL` | Gmail address |
| `GOOGLE_CLOUD_KEY` | Gmail app password |
| `EMAIL_TO` | Recipient (optional; defaults to GMAIL_EMAIL) |
| `EMAIL_ON_EVERY_CHECK` | `true` to get an email on every run (optional; for testing) |

---

## Manual Run Options

When you click **Run workflow**, you can choose:

- **Test email** – Sends a one-off test email and skips the monitor. Use this to verify Gmail config.

---

## How `check.py` Works

**`check.py --monitor`** does the following:

1. **Fetch** – Download `https://biografspegeln.se/program?list=upcoming`.
2. **Parse** – Extract `__NEXT_DATA__` JSON and find the Project Hail Mary movie object.
3. **Compare** – Build `current` state from `ticketsOutNow`, `ticketsOnSale`, `premiereDate`, `url`.
4. **Decide** – Read `state.json`; if `previous` is missing, write `current` and exit.
5. **Notify** – If `current != previous`, send email via Gmail and update `state.json`.
6. **Commit** – The workflow commits the updated `state.json` and pushes.

---

## Relevant Code

**State extraction** (`check.py`):

```python
def extract_state(movie):
    premiere = movie.get("premiereDate", "")
    return {
        "ticket_status": get_ticket_status(movie),
        "premiere_date": premiere[:10] if premiere else "",
        "url": movie.get("url", ""),
    }
```

**Config** – `config.py` prefers env vars when set. That way the workflow uses GitHub Secrets:

```python
GMAIL_EMAIL = os.environ.get("GMAIL_EMAIL") or "your-email@gmail.com"
GOOGLE_CLOUD_KEY = os.environ.get("GOOGLE_CLOUD_KEY") or "..."
```

**State file** – Can be overridden by `STATE_FILE` env or `--state-file`:

```python
STATE_FILE = Path(os.environ.get("STATE_FILE", str(Path.home() / ".project-hail-mary-state.json")))
```

---

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Schedule       │     │  check.py        │     │  state.json     │
│  (every 30 min) │────▶│  --monitor       │────▶│  in repo        │
└─────────────────┘     │  fetch → compare │     └─────────────────┘
                        │  notify if changed     │
                        └──────────────────┘     │
                                 │               │
                                 ▼               ▼
                        ┌──────────────────────────────┐
                        │  git diff --staged state.json │
                        │  Commit + push if changed     │
                        └──────────────────────────────┘
```

---

## Repo Layout

The workflow expects:

```
repo/
├── .github/workflows/check-tickets.yml
└── testing-ground/project-hail-mary/
    ├── check.py
    ├── config.py
    └── state.json   # Created by workflow
```

If `project-hail-mary` is in a different path, update `working-directory` and `STATE_FILE` in the workflow.
