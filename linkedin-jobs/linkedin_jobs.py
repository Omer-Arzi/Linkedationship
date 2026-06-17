"""
LinkedIn Jobs + Connections Scraper
------------------------------------
Scans your LinkedIn recommended jobs and filters to those where you have
a mutual connection at the company. Outputs a CSV with:
  Company | Job Title | URL | Connections

Run: python linkedin_jobs.py
"""

import asyncio
import csv
import datetime
import json
import os
import re
import sys
import time
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

from config import (
    ENV_ANTHROPIC_API_KEY,
    OUTPUT_FILE, BROWSER_PROFILE, PAGE_DELAY, SCROLL_ROUNDS, MAX_PAGES,
    URL_JOBS_FEED, URL_JOB_VIEW_BASE, URL_JOB_VIEW_REGEX,
    SEL_JOB_CARD, SEL_JOB_LINK, SEL_LOGIN_FORM, SEL_NEXT_BUTTON,
    SEL_COMPANY_CANDIDATES, SEL_CONNECTION_NAMES, SEL_CONNECTION_BLURBS,
    BROWSER_ARGS, BROWSER_IGNORE_ARGS, BROWSER_VIEWPORT,
    SHOW_ALL_LABELS,
    MODEL_CONNECTIONS, MODEL_SKILL_CHECK,
    COL_DATE, COL_URL, CSV_COLUMNS,
    BLACKLIST, TITLE_BLACKLIST, SKILL_BLACKLIST,
)

try:
    import anthropic as _anthropic_module
except ImportError:
    _anthropic_module = None


def _get_anthropic_client():
    if _anthropic_module is None:
        return None
    key = os.environ.get(ENV_ANTHROPIC_API_KEY)
    if not key:
        return None
    return _anthropic_module.Anthropic(api_key=key)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def slow_scroll(page, rounds: int = SCROLL_ROUNDS):
    """Scroll down the page gradually to trigger lazy-loaded job cards."""
    for _ in range(rounds):
        await page.evaluate("window.scrollBy(0, 600)")
        await asyncio.sleep(1)


async def get_text(el) -> str:
    try:
        return (await el.inner_text()).strip()
    except Exception:
        return ""


async def get_attr(el, attr: str) -> str:
    try:
        return (await el.get_attribute(attr) or "").strip()
    except Exception:
        return ""


def clean_job_url(href: str) -> str:
    match = re.search(URL_JOB_VIEW_REGEX, href)
    if match:
        return URL_JOB_VIEW_BASE.format(match.group(1))
    return href


# ---------------------------------------------------------------------------
# Step 1 — Collect job cards from the recommended feed
# ---------------------------------------------------------------------------

async def scrape_cards_on_page(page) -> list[dict]:
    """Extract all job cards visible on the current page."""
    await slow_scroll(page)
    await asyncio.sleep(2)
    cards = await page.query_selector_all(SEL_JOB_CARD)
    jobs = []
    for card in cards:
        try:
            link_el = await card.query_selector(SEL_JOB_LINK)
            if not link_el:
                continue
            title = await get_text(link_el)
            href = await get_attr(link_el, "href")
            url = clean_job_url(href)

            company = ""
            for cs in SEL_COMPANY_CANDIDATES:
                el = await card.query_selector(cs)
                if el:
                    company = await get_text(el)
                    break

            if url and title:
                jobs.append({"title": title, "company": company, "url": url, "connections": []})
        except Exception as e:
            print(f"  Warning: could not parse a card — {e}")
    return jobs


async def wait_for_jobs_to_load(page, max_retries: int = 5) -> bool:
    """
    Wait for job cards to be rendered by LinkedIn's JS.
    domcontentloaded fires before React paints cards, so we poll with
    wait_for_selector instead of sleeping a fixed amount after reload.
    """
    for attempt in range(1, max_retries + 1):
        try:
            await page.wait_for_selector(SEL_JOB_CARD, timeout=12_000)
            return True
        except PlaywrightTimeout:
            pass

        print(f"  Jobs not loaded yet (attempt {attempt}/{max_retries}), refreshing...")
        await page.reload(wait_until="domcontentloaded")
        await asyncio.sleep(3)

    return False


async def click_show_all(page) -> bool:
    """Click the 'Show all' / 'צפייה בכולם' button if present. Returns True if clicked."""
    for text in SHOW_ALL_LABELS:
        try:
            # exact=False handles arrow icons or extra whitespace inside the button
            btn = page.get_by_role("button", name=text, exact=False)
            if await btn.count() == 0:
                btn = page.get_by_role("link", name=text, exact=False)
            if await btn.count() > 0:
                await btn.first.click()
                print(f"  Clicked '{text}' button.")
                await asyncio.sleep(3)
                return True
        except Exception:
            pass
    return False


async def collect_jobs(page) -> list[dict]:
    await page.goto(URL_JOBS_FEED, wait_until="domcontentloaded")
    await asyncio.sleep(3)

    loaded = await wait_for_jobs_to_load(page)
    if not loaded:
        print("  Could not load job cards after several retries.")
        return []

    all_jobs = []
    page_num = 1

    while page_num <= MAX_PAGES:
        print(f"  Scraping page {page_num}/{MAX_PAGES}...")
        jobs = await scrape_cards_on_page(page)
        print(f"    Got {len(jobs)} cards")
        all_jobs.extend(jobs)

        if page_num >= MAX_PAGES:
            break

        # Try to click the Next button
        next_btn = await page.query_selector(SEL_NEXT_BUTTON)
        if not next_btn:
            break
        is_disabled = await next_btn.get_attribute("disabled")
        if is_disabled is not None:
            break

        await next_btn.click()
        page_num += 1
        try:
            await page.wait_for_selector(SEL_JOB_CARD, timeout=15_000)
        except PlaywrightTimeout:
            break
        await asyncio.sleep(2)

    # Deduplicate by URL
    seen = set()
    unique = []
    for j in all_jobs:
        if j["url"] not in seen:
            seen.add(j["url"])
            unique.append(j)

    return unique


# ---------------------------------------------------------------------------
# Step 2 — Visit each job page and look for connections
# ---------------------------------------------------------------------------

async def _claude_extract_connections(client, page, job: dict) -> list[str]:
    """Ask Claude to find connection names from the visible page text."""
    page_text = await page.evaluate("document.body.innerText")
    page_text = page_text[:6000]  # ~1500 tokens — enough to cover the insight panels

    prompt = (
        f'LinkedIn job page for "{job["title"]}" at "{job["company"]}".\n\n'
        f"{page_text}\n\n"
        "Find the names of mutual connections shown on this page — people the viewer "
        "knows who work at this company. LinkedIn shows them in sections like "
        '"Connections at this company", "How you match", or similar insight panels.\n'
        "Return ONLY a JSON array of name strings, e.g. [\"Jane Smith\", \"Bob Lee\"]. "
        "If none are visible, return []."
    )

    loop = asyncio.get_event_loop()
    try:
        response = await loop.run_in_executor(
            None,
            lambda: client.messages.create(
                model=MODEL_CONNECTIONS,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            ),
        )
        text = response.content[0].text.strip()
        match = re.search(r"\[.*?\]", text, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            return [n for n in parsed if isinstance(n, str) and n.strip()]
    except Exception as e:
        print(f"    Claude API fallback error: {e}")
    return []


async def is_skill_blacklisted(client, page_text: str, job: dict) -> str | None:
    """
    Returns a human-readable reason string if the job triggers a SKILL_BLACKLIST rule,
    or None if it's fine. Uses Claude when available; falls back to regex otherwise.
    """
    if not SKILL_BLACKLIST:
        return None

    if client:
        rules = []
        for skill, max_years in SKILL_BLACKLIST:
            if max_years is None:
                rules.append(f'- "{skill}": skip if mentioned at all')
            else:
                rules.append(f'- "{skill}": skip if more than {max_years} years of experience required')
        rules_str = "\n".join(rules)

        prompt = (
            f'Job posting for "{job["title"]}" at "{job["company"]}":\n\n'
            f"{page_text[:8000]}\n\n"
            f"Which of these skill rules (if any) are triggered by this job posting?\n{rules_str}\n\n"
            'If none are triggered, reply "NO".\n'
            'If one or more are triggered, reply with a short reason, e.g. "requires WordPress" or "requires C++ and Python 5+ years". No extra text.'
        )
        loop = asyncio.get_event_loop()
        try:
            response = await loop.run_in_executor(
                None,
                lambda: client.messages.create(
                    model=MODEL_SKILL_CHECK,
                    max_tokens=30,
                    messages=[{"role": "user", "content": prompt}],
                ),
            )
            answer = response.content[0].text.strip()
            if answer.upper() != "NO":
                return answer
            return None
        except Exception as e:
            print(f"    Skill-check API error: {e}")

    # Regex fallback
    text_lower = page_text.lower()
    for skill, max_years in SKILL_BLACKLIST:
        skill_pat = re.escape(skill.lower())
        if not re.search(rf'\b{skill_pat}\b', text_lower):
            continue
        if max_years is None:
            return f"requires {skill}"
        for pattern in [
            rf'(\d+)\+?\s*(?:years?|yrs?)[^\n]*\b{skill_pat}\b',
            rf'\b{skill_pat}\b[^\n]*(\d+)\+?\s*(?:years?|yrs?)',
        ]:
            m = re.search(pattern, text_lower)
            if m and int(m.group(1)) > max_years:
                return f"requires {skill} {m.group(1)}+ years (limit: {max_years})"
    return None


async def find_connections(page, job: dict) -> list[str]:
    """
    Returns a list of connection name strings found on the already-loaded job detail page,
    or an empty list if none are visible.
    """
    names = []

    # Strategy A: named connection cards (Premium insight panel)
    for name_sel in SEL_CONNECTION_NAMES:
        els = await page.query_selector_all(name_sel)
        for el in els:
            name = await get_text(el)
            if name and name not in names:
                names.append(name)

    # Strategy B: text blurbs containing "connection" + a digit
    if not names:
        for text_sel in SEL_CONNECTION_BLURBS:
            els = await page.query_selector_all(text_sel)
            for el in els:
                text = await get_text(el)
                if "connection" in text.lower() and any(c.isdigit() for c in text):
                    names.append(text.replace("\n", " ").strip())
                    break

    # Strategy C: Claude API fallback — reads the page text and finds names intelligently
    if not names:
        client = _get_anthropic_client()
        if client:
            print("    (using Claude fallback...)")
            names = await _claude_extract_connections(client, page, job)

    return names


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    print("=== LinkedIn Jobs + Connections Scraper ===\n")

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            str(BROWSER_PROFILE),
            headless=False,
            viewport=BROWSER_VIEWPORT,
            args=BROWSER_ARGS,
            ignore_default_args=BROWSER_IGNORE_ARGS,
        )

        page = await context.new_page()

        # -- Login check --
        await page.goto(URL_JOBS_FEED, wait_until="domcontentloaded")
        await asyncio.sleep(3)

        # Detect login wall by looking for the sign-in form, not by URL
        sign_in_form = await page.query_selector(SEL_LOGIN_FORM)
        if sign_in_form:
            print("Please log in to LinkedIn in the browser window.")
            print("Once you're fully logged in and can see your jobs feed,")
            print("press Enter here to continue...")
            sys.stdout.flush()
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, sys.stdin.readline)
            await asyncio.sleep(2)
            print("Continuing.\n")
        else:
            print("Already logged in.\n")

        # -- Migrate CSV schema if needed (add Date column) --
        if OUTPUT_FILE.exists():
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                if reader.fieldnames and COL_DATE not in reader.fieldnames:
                    rows = list(reader)
                    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f2:
                        writer = csv.DictWriter(f2, fieldnames=CSV_COLUMNS)
                        writer.writeheader()
                        for row in rows:
                            writer.writerow({COL_DATE: "", **row})
                    print("  Migrated CSV to include Date column.\n")

        # -- Load known URLs to skip duplicates --
        known_urls: set[str] = set()
        if OUTPUT_FILE.exists():
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    if row.get(COL_URL):
                        known_urls.add(row[COL_URL].strip())
            if known_urls:
                print(f"  {len(known_urls)} job(s) already in CSV — will skip duplicates.\n")

        # -- Collect jobs --
        print("Step 1: Collecting job cards from your recommended feed...")
        jobs = await collect_jobs(page)
        print(f"  Collected {len(jobs)} unique jobs.\n")

        if not jobs:
            print("No jobs found. LinkedIn may have changed its layout. Exiting.")
            await context.close()
            return

        # Skip blacklisted companies
        def is_blacklisted(company: str) -> bool:
            c = company.lower()
            return any(b in c for b in BLACKLIST)

        blacklisted = [j for j in jobs if is_blacklisted(j["company"])]
        if blacklisted:
            print(f"  Skipping {len(blacklisted)} job(s) from blacklisted companies: "
                  f"{', '.join(j['company'] for j in blacklisted)}\n")
        jobs = [j for j in jobs if not is_blacklisted(j["company"])]

        # Skip blacklisted job titles
        def is_title_blacklisted(title: str) -> bool:
            t = title.lower()
            return any(kw in t for kw in TITLE_BLACKLIST)

        title_blocked = [j for j in jobs if is_title_blacklisted(j["title"])]
        if title_blocked:
            print(f"  Skipping {len(title_blocked)} job(s) with blacklisted title keywords: "
                  f"{', '.join(j['title'] for j in title_blocked)}\n")
        jobs = [j for j in jobs if not is_title_blacklisted(j["title"])]

        # Skip jobs already saved
        new_jobs = [j for j in jobs if j["url"] not in known_urls]
        skipped = len(jobs) - len(new_jobs)
        if skipped:
            print(f"  Skipping {skipped} job(s) already in CSV.\n")
        jobs = new_jobs

        if not jobs:
            print("All jobs already in CSV. Nothing new to process.")
            await context.close()
            return

        # -- Check connections --
        print("Step 2: Checking each job for skill requirements and mutual connections...")
        jobs_with_connections = []
        anthropic_client = _get_anthropic_client()

        for i, job in enumerate(jobs, 1):
            label = f"[{i}/{len(jobs)}] {job['title']} @ {job['company']}"
            print(f"  {label}")

            # Navigate to job page once (used for both skill check and connection scraping)
            try:
                await page.goto(job["url"], wait_until="domcontentloaded")
                await asyncio.sleep(PAGE_DELAY)
            except PlaywrightTimeout:
                print(f"    Timeout loading {job['url']}, skipping.")
                continue

            # Check skill blacklist before spending time on connections
            if SKILL_BLACKLIST:
                page_text = await page.evaluate("document.body.innerText")
                skip_reason = await is_skill_blacklisted(anthropic_client, page_text, job)
                if skip_reason:
                    print(f"    ✗ Skipped — {skip_reason}")
                    continue

            connections = await find_connections(page, job)
            if connections:
                job["connections"] = connections
                jobs_with_connections.append(job)
                print(f"    ✓ {len(connections)} connection(s): {', '.join(connections[:3])}")
            else:
                print(f"    — no connections found")

        # -- Write CSV (append) --
        print(f"\nStep 3: Saving results to {OUTPUT_FILE} ...")
        today = datetime.date.today().isoformat()
        write_header = not OUTPUT_FILE.exists()
        with open(OUTPUT_FILE, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if write_header:
                writer.writerow(CSV_COLUMNS)
            for job in jobs_with_connections:
                writer.writerow([
                    today,
                    job["company"],
                    job["title"],
                    job["url"],
                    "; ".join(job["connections"]),
                ])

        print(f"\nDone! {len(jobs_with_connections)} new job(s) with connections saved to:")
        print(f"  {OUTPUT_FILE.resolve()}\n")

        await context.close()


if __name__ == "__main__":
    asyncio.run(main())
