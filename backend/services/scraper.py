import httpx
from bs4 import BeautifulSoup
import re

class ScraperService:
    async def fetch_content(self, url: str) -> str:
        if "github.com" in url:
            return await self._fetch_github_readme(url)
        return await self._fetch_web_content(url)

    async def _fetch_github_readme(self, url: str) -> str:
        # Convert github.com/user/repo to raw.githubusercontent.com/user/repo/main/README.md
        raw_url = url.replace("github.com", "raw.githubusercontent.com")
        # Assume main branch for MVP
        if "/tree/" in raw_url:
            raw_url = raw_url.replace("/tree/", "/")
        else:
            raw_url += "/main/README.md"
            
        async with httpx.AsyncClient() as client:
            response = await client.get(raw_url)
            if response.status_code == 200:
                return response.text
            # Try master if main fails
            raw_url = raw_url.replace("/main/", "/master/")
            response = await client.get(raw_url)
            if response.status_code == 200:
                return response.text
            
        return f"Could not fetch README from {url}"

    async def _fetch_web_content(self, url: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code != 200:
                return f"Error fetching {url}: {response.status_code}"
            
            soup = BeautifulSoup(response.text, 'html.parser')
            # Remove scripts and styles
            for script_or_style in soup(["script", "style"]):
                script_or_style.decompose()
            
            text = soup.get_text()
            # Clean whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return text
