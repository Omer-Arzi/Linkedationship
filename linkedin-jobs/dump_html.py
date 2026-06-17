"""Quick debug script — opens LinkedIn jobs page and saves the HTML."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BROWSER_PROFILE = Path.home() / ".linkedin_jobs_scraper_profile"

async def main():
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            str(BROWSER_PROFILE),
            headless=False,
            viewport={"width": 1280, "height": 900},
        )
        page = await context.new_page()
        await page.goto("https://www.linkedin.com/jobs/", wait_until="domcontentloaded")

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, input,
            "Log in if needed, scroll the jobs feed until cards are visible, then press Enter...\n")

        await asyncio.sleep(2)
        html = await page.content()
        Path("jobs_page.html").write_text(html, encoding="utf-8")
        print(f"Saved {len(html)} chars to jobs_page.html")
        await context.close()

asyncio.run(main())
