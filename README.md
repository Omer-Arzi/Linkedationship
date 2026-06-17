# Linkedationship

A LinkedIn job scraper that scans your recommended jobs feed and filters to positions where you have a mutual connection at the company. Results are saved to a CSV and browsable in a desktop UI.

---

## How it works

1. **Collect** — Playwright opens a persistent Chrome browser and scrolls through your LinkedIn recommended jobs feed, collecting job cards across multiple pages.
2. **Filter** — Each job is checked against blacklists: company name, job title keywords, and skill requirements (e.g. skip PHP jobs entirely, skip Python jobs requiring 4+ years).
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
| Skill filtering | `claude-haiku-4-5-20251001` | Reads the job description and determines whether any skill blacklist rules are triggered (e.g. "requires C++", "requires Python 5+ years") |

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

```bash
cd linkedin-jobs/electron-ui
npm install          # first time only
ANTHROPIC_API_KEY=your_key npm start
```

The app opens with two tabs:

- **Script tab** — a live screencast of the Playwright browser on the left, and a color-coded log on the right. Click **▶ Start Searching** to run. If LinkedIn asks you to log in, a banner appears — log in in the Chromium window that opens in the dock, then click **Continue →**.
- **Results tab** — a table of all saved jobs, grouped by date. Jobs from the last 5 days are expanded by default; older ones are collapsed.

### Option B — Terminal only

```bash
cd linkedin-jobs
source venv/bin/activate
export ANTHROPIC_API_KEY=your_key
python linkedin_jobs.py
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

All settings live in `linkedin-jobs/config.py`:

```python
MAX_PAGES = 7               # how many pages of the jobs feed to scrape
PAGE_DELAY = 2.5            # seconds to wait after loading each job page

BLACKLIST = {"company-a", ...}  # skip jobs from these companies

TITLE_BLACKLIST = {"qa", "automation", ...}  # skip jobs containing these title keywords

SKILL_BLACKLIST = [
    ("WordPress", None),    # skip if mentioned at all
    ("PHP", None),
    ("Python", 4),          # skip only if 4+ years required
    ("C++", None),
]
```

You can also set `MAX_PAGES` via environment variable:
```bash
MAX_PAGES=3 python linkedin_jobs.py
```

---

## CSV format

`linkedin_jobs_connections.csv` — appended to on each run, duplicates skipped by URL:

```
Date,Company,Job Title,URL,Connections
2026-06-17,Some Company,Software Engineer,https://linkedin.com/jobs/view/...,Jane Smith; Bob Lee
```

---

## Project structure

```
Linkedationship/
├── linkedin-jobs/
│   ├── linkedin_jobs.py          # main scraper
│   ├── config.py                 # all configuration
│   ├── dump_html.py              # debug: saves raw LinkedIn HTML
│   ├── requirements.txt
│   ├── setup.sh
│   └── electron-ui/
│       ├── main.js               # Electron main process, spawns Python, bridges CDP
│       ├── preload.js            # exposes IPC API to renderer
│       └── renderer/
│           ├── index.html
│           ├── renderer.js       # UI logic: screencast, logs, results table
│           └── style.css
└── index.jsx                     # unrelated React scratch file
```
