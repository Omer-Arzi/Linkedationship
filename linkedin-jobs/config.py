import os
from pathlib import Path

# ── Environment variables ──────────────────────────────────────────────────────
ENV_ANTHROPIC_API_KEY = "ANTHROPIC_API_KEY"
ENV_MAX_PAGES         = "MAX_PAGES"

# ── Files & tuning ────────────────────────────────────────────────────────────
OUTPUT_FILE     = Path("linkedin_jobs_connections.csv")
BROWSER_PROFILE = Path.home() / ".linkedin_jobs_scraper_profile"
PAGE_DELAY      = 2.5
SCROLL_ROUNDS   = 6
MAX_PAGES       = int(os.environ.get(ENV_MAX_PAGES, "7"))

# ── URLs ───────────────────────────────────────────────────────────────────────
URL_JOBS_FEED      = "https://www.linkedin.com/jobs/collections/recommended/"
URL_JOB_VIEW_BASE  = "https://www.linkedin.com/jobs/view/{}/"
URL_JOB_VIEW_REGEX = r"/jobs/view/(\d+)"

# ── CSS selectors ──────────────────────────────────────────────────────────────
SEL_JOB_CARD    = ".scaffold-layout__list-item"
SEL_JOB_LINK    = "a[href*='/jobs/view/']"
SEL_LOGIN_FORM  = "form.login__form, #username, input[name='session_key']"
SEL_NEXT_BUTTON = (
    "button.jobs-search-pagination__button--next, "
    "button[aria-label='Next'], "
    ".artdeco-button--icon-right.jobs-search-pagination__button"
)

SEL_COMPANY_CANDIDATES = [
    ".artdeco-entity-lockup__subtitle",
    ".job-card-container__primary-description",
    ".job-card-container__company-name",
    ".job-card-list__company-name",
]

SEL_CONNECTION_NAMES = [
    ".jobs-premium-applicant-insights .artdeco-entity-lockup__title",
    ".job-details-how-you-match__container .artdeco-entity-lockup__title",
    ".hirer-card__hirer-information span[aria-hidden='true']",
    ".jobs-hirer-card__hirer-name",
    "[data-test-connection-name]",
    ".jobs-job-connection-card__name",
]

SEL_CONNECTION_BLURBS = [
    ".jobs-premium-applicant-insights",
    ".jobs-unified-top-card__job-insight",
    ".job-details-jobs-unified-top-card__job-insight",
]

# ── Browser args ───────────────────────────────────────────────────────────────
BROWSER_ARGS        = ["--no-sandbox", "--disable-blink-features=AutomationControlled", "--remote-debugging-port=9222"]
BROWSER_IGNORE_ARGS = ["--enable-automation"]
BROWSER_VIEWPORT    = {"width": 1280, "height": 900}

# ── Button labels to find "Show all" ──────────────────────────────────────────
SHOW_ALL_LABELS = ["Show all", "See all jobs", "צפייה בכולם", "See all", "View all"]

# ── Claude model IDs ───────────────────────────────────────────────────────────
MODEL_CONNECTIONS = "claude-opus-4-8"
MODEL_SKILL_CHECK = "claude-haiku-4-5-20251001"

# ── CSV column names ───────────────────────────────────────────────────────────
COL_DATE        = "Date"
COL_COMPANY     = "Company"
COL_TITLE       = "Job Title"
COL_URL         = "URL"
COL_CONNECTIONS = "Connections"
CSV_COLUMNS     = [COL_DATE, COL_COMPANY, COL_TITLE, COL_URL, COL_CONNECTIONS]

# ── Personal filters (loaded from config_local.py) ────────────────────────────
# Copy config_local.example.py to config_local.py and fill in your own values.
try:
    from config_local import BLACKLIST, TITLE_BLACKLIST, SKILL_BLACKLIST  # type: ignore
except ModuleNotFoundError:
    BLACKLIST: set        = set()
    TITLE_BLACKLIST: set  = set()
    SKILL_BLACKLIST: list = []
