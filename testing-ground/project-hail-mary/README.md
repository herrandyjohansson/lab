# Project Hail Mary Monitor

Checks Biograf Spegeln for Project Hail Mary ticket availability and notifies you when something changes.

## Usage

**One-time check:**
```bash
python3 check.py
```

**Monitor mode** (compare with last state, notify on change):
```bash
python3 check.py --monitor
```

**TUI mode** (interactive Textual dashboard with Rocky ASCII art):
- `r` — manual refresh
- `+` / `-` — adjust refresh interval (5–60s)
- `m` — toggle auto/manual mode
- `q` — quit

Bash/zsh:
```bash
pip install rich textual
just tui
# or with custom refresh:
python3 check.py --tui --refresh 15
```

PowerShell (pwsh):
```powershell
python -m pip install rich textual
just tui
# or with custom refresh:
python3 check.py --tui --refresh 15
# or use the helper script (installs rich if needed):
./tui.ps1
./tui.ps1 -Refresh 15
```

## Scheduled monitoring (launchd)

The launchd plist is installed at `~/Library/LaunchAgents/se.biografspegeln.project-hail-mary.plist`. It runs every 5 minutes.

**Start monitoring:**
```bash
launchctl load ~/Library/LaunchAgents/se.biografspegeln.project-hail-mary.plist
```

**Stop monitoring:**
```bash
launchctl unload ~/Library/LaunchAgents/se.biografspegeln.project-hail-mary.plist
```

**Check status:**
```bash
launchctl list | grep project-hail-mary
```

Logs: `~/Library/Logs/project-hail-mary.log`

## Gmail notifications

When the ticket status changes (e.g. from INVÄNTAR BILJETTSLÄPP to Biljetter ute nu), the monitor sends an email in addition to the macOS notification.

**Setup:**

1. Edit `config.py` and set:
   - `GMAIL_EMAIL` – your Gmail address
   - `GOOGLE_CLOUD_KEY` – your [Gmail App Password](https://support.google.com/accounts/answer/185833) (16-character)
   - `EMAIL_TO` – recipient (optional, defaults to GMAIL_EMAIL)
2. Test: `python3 check.py --test-email` or `just test-email`
3. Add `config.py` to `.gitignore` if it contains secrets

**Note:** launchd does not run when your Mac is sleeping. For 24/7 monitoring, keep the Mac awake or consider a cloud-based cron.

## GitHub Actions (scheduled workflow)

Runs every 30 minutes in the cloud. No local process needed.

**Setup:**

1. Ensure the workflow exists at `.github/workflows/check-tickets.yml` (in the repo root).
2. Add repository secrets: **Settings → Secrets and variables → Actions**
   - `GMAIL_EMAIL` – your Gmail address
   - `GOOGLE_CLOUD_KEY` – your [Gmail App Password](https://support.google.com/accounts/answer/185833)
   - `EMAIL_TO` – recipient (optional)
3. Push. The workflow runs on schedule and on `workflow_dispatch` (manual run).

State is stored in `state.json` and committed when it changes. Private repos: ~360 min/month used (within free tier).
