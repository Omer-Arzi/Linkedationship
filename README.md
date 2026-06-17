# Linkedationship

A LinkedIn job scraper that scans your recommended jobs feed and filters to positions where you have a mutual connection at the company. Results are saved to a CSV and browsable in a desktop UI.

---

## How it works

1. **Collect** — Playwright opens a persistent Chrome browser and scrolls through your LinkedIn recommended jobs feed, collecting job cards across multiple pages.
2. **Filter** — Each job is checked against blacklists: company name, job title keywords, and skill requirements (e.g. skip jobs for a specific skill entirely, or only if they require more than N years).
3. **Connections** — For each job that passes the filters, the scraper visits the job page and looks for mutual connections shown in LinkedIn's insight panels. Three strategies are tried in order:
   - CSS selector scraping (Premium insight panel)
   - Text blurb detection ("X connections at this company")
   - Claude fallback — reads the full page text and asks Claude to find connection names
4. **Save** — Jobs with at least one connection are appended to `linkedin_jobs_connections.csv`.

---

## How Claude is used

Two Claude models are used as intelligent fallbacks:

| Step | Model | Purpose |
|---|---|---|
| Connection extraction | `claude-opus-4-8` | Reads the job page text and returns a JSON array of connection names when CSS selectors find nothing |
| Skill filtering | `claude-haiku-4-5-20251001` | Reads the job description and determines whether any skill blacklist rules are triggered |

Claude is only called when the simpler CSS/regex approaches fail. If no `ANTHROPIC_API_KEY` is set, both models are skipped and only the CSS/regex fallback is used.

---

## Setup (first time only)

```bash
cd linkedin-jobs
bash setup.sh
```

This creates a Python virtual environment, installs `playwright` and `anthropic`, and downloads the Chromium browser.

---

## Running

### Option A — Electron UI (recommended)

From the project root:

```bash
./start.sh
```

The first run installs Node dependencies automatically. To pass your API key:

```bash
ANTHROPIC_API_KEY=your_key ./start.sh
```

The app opens with three tabs:

- **Script** — a live screencast of the Playwright browser on the left, color-coded logs on the right. Click **▶ Start Searching** to run. If LinkedIn asks you to log in, a banner appears — log in in the Chromium window that opens in the dock, then click **Continue →**.
- **Results** — a table of all saved jobs, grouped by date. Jobs from the last 5 days are expanded by default; older ones are collapsed.
- **Schedule** — configure automatic daily runs (see [Scheduled runs](#scheduled-runs) below).

### Option B — Terminal only

```bash
cd linkedin-jobs
source venv/bin/activate
export ANTHROPIC_API_KEY=your_key
python3 linkedin_jobs.py
```

---

## Results tab

The Results tab reads directly from `linkedin_jobs_connections.csv` and displays:

| Column | Description |
|---|---|
| Company | Company name |
| Job Title | Role title |
| Link | Opens the LinkedIn job page in your browser |
| Connections | Mutual connections found at the company, shown as pills |
| Sent CV | Checkbox to track whether you've applied — persisted in `resume_sent.json` |

- **Search** — filter by any text across all columns (`Cmd+F` / `Ctrl+F` when on this tab)
- **Filter dropdown** — show All / Sent CV / Not Sent
- **↻ Refresh** — reload from the CSV after a new scrape

---

## Configuration

General settings (page count, delays, selectors) live in `linkedin-jobs/config.py`.

Personal filters are kept in a separate file that is **not committed to the repo**:

```bash
cp linkedin-jobs/config_local.example.py linkedin-jobs/config_local.py
```

Then edit `config_local.py` with your own values:

```python
# Companies to skip entirely (case-insensitive substring match)
BLACKLIST = {
    "some company",
}

# Jobs whose title contains any of these keywords are skipped
TITLE_BLACKLIST = {
    "qa",
    "automation",
}

# Skill rules:
#   None  → skip if the skill is mentioned at all
#   N     → skip only if more than N years of experience are required
SKILL_BLACKLIST = [
    ("SomeSkill", None),
    ("AnotherSkill", 3),
]
```

If `config_local.py` is missing, all three filters default to empty (nothing is skipped).

You can also override `MAX_PAGES` via environment variable:
```bash
MAX_PAGES=3 python3 linkedin_jobs.py
```

---

## CSV format

`linkedin_jobs_connections.csv` — appended to on each run, duplicates skipped by URL:

```
Date,Company,Job Title,URL,Connections
2026-06-17,Some Company,Software Engineer,https://linkedin.com/jobs/view/...,Jane Smith; Bob Lee
```

---

## Scheduled runs

The **Schedule tab** inside the Electron UI lets you configure the scraper to run automatically on any days you choose, without opening the app.

### Settings

| Setting | Description |
|---|---|
| Enable daily schedule | Installs a macOS launch agent that triggers the scraper on selected days at the chosen time |
| Run on | Day checkboxes (Sun–Sat). Select any combination. Defaults to Sun–Thu |
| Run at | Time in 24-hour format (e.g. `08:30`) |
| Require confirmation | Before each scheduled run, a native macOS dialog appears asking "Run now?" — you can skip it. Auto-dismisses after 30 seconds if ignored |
| Anthropic API Key | Optional — only needed if you want Claude features in scheduled runs. Leave blank if you store the key in Keychain (recommended) |

Click **Save & Apply** to install or update the schedule. Disabling it and clicking Save removes the launch agent entirely.

### API key for scheduled runs

Scheduled runs happen outside your shell environment, so `ANTHROPIC_API_KEY` isn't automatically available. The key is resolved in this order:

1. **macOS Keychain** (recommended) — store it once, never touch it again:
   ```bash
   security add-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w "your-key-here"
   ```
2. **Settings field** — filled in the Schedule tab UI, stored in `schedule_settings.json` (gitignored)
3. **Environment variable** — if already set in the shell that launched the script

### Behavior when the Mac is asleep

launchd waits until the machine is awake. If the scheduled time is missed (e.g. Mac was asleep at 8:00), the job runs once when the Mac wakes up — not once per missed run.

### How it works under the hood

- Saving writes `linkedin-jobs/schedule_settings.json` (gitignored) and generates a launchd plist at `~/Library/LaunchAgents/com.linkedationship.scraper.plist`
- launchd calls `linkedin-jobs/run_scheduled.sh` at the scheduled time
- If "Require confirmation" is on, the script shows a native macOS dialog via `osascript` before proceeding
- Output is logged to `linkedin-jobs/logs/scraper.log`
- The Electron UI does not need to be open for scheduled runs to work

---

## Project structure

```
Linkedationship/
├── start.sh                          # launch the Electron UI from the project root
├── linkedin-jobs/
│   ├── linkedin_jobs.py              # main scraper
│   ├── config.py                     # general configuration
│   ├── config_local.example.py       # template for personal filters
│   ├── config_local.py               # your filters — gitignored, fill this in
│   ├── run_scheduled.sh              # called by launchd; handles confirmation dialog
│   ├── dump_html.py                  # debug: saves raw LinkedIn HTML
│   ├── requirements.txt
│   ├── setup.sh
│   └── electron-ui/
│       ├── main.js                   # Electron main process: spawns Python, bridges CDP, manages launchd
│       ├── preload.js                # exposes IPC API to renderer
│       └── renderer/
│           ├── index.html
│           ├── renderer.js           # UI logic: screencast, logs, results table, schedule settings
│           └── style.css
```
