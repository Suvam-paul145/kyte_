"""
ScraperService — fetches GitHub READMEs or general web pages.
MOCK_MODE returns deterministic content for local testing.
"""
import os
import httpx
from bs4 import BeautifulSoup


class ScraperService:
    MOCK_MODE = os.getenv("SCRAPER_MOCK", "false").lower() == "true"

    # ── Public interface (both names work) ────────────────────────────────────
    async def fetch_content(self, url: str) -> str:
        """Primary method. Dispatches to GitHub or generic handler."""
        if self.MOCK_MODE:
            return self._mock_content(url)

        if "github.com" in url:
            return await self._fetch_github_readme(url)
        return await self._fetch_web_content(url)

    async def scrape_url(self, url: str) -> str:
        """Alias for fetch_content — kept for router compatibility."""
        return await self.fetch_content(url)

    # ── Handlers ─────────────────────────────────────────────────────────────
    async def _fetch_github_readme(self, url: str) -> str:
        raw_url = url.replace("github.com", "raw.githubusercontent.com")
        if "/tree/" in raw_url:
            raw_url = raw_url.replace("/tree/", "/")
        else:
            raw_url += "/main/README.md"

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(raw_url)
            if response.status_code == 200:
                return response.text
            # Fallback to master branch
            master_url = raw_url.replace("/main/README.md", "/master/README.md")
            response = await client.get(master_url)
            if response.status_code == 200:
                return response.text

        return f"[ScraperService] Could not fetch README from {url}"

    async def _fetch_web_content(self, url: str) -> str:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            if response.status_code != 200:
                return f"[ScraperService] Error fetching {url}: HTTP {response.status_code}"

            soup = BeautifulSoup(response.text, "html.parser")
            for tag in soup(["script", "style"]):
                tag.decompose()

            lines = (line.strip() for line in soup.get_text().splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            return "\n".join(chunk for chunk in chunks if chunk)

    # ── Mock ──────────────────────────────────────────────────────────────────
    def _mock_content(self, url: str) -> str:
        return f"""[MOCK CONTENT for {url}]
## Project Overview
This is a mock submission for local testing purposes.

### Features
- REST API built with FastAPI
- Authentication with JWT
- Algorand smart contract integration
- Unit tests covering 80% of code

### Setup
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
"""
