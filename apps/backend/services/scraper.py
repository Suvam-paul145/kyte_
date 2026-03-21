from urllib.parse import urlparse

import httpx

ALLOWED_DOMAINS = {
    "github.com",
    "gitlab.com",
    "vercel.app",
    "netlify.app",
}


def validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Invalid URL format")
    if not any(parsed.netloc.endswith(domain) for domain in ALLOWED_DOMAINS):
        raise ValueError("URL domain is not in the allowlist")


async def fetch_submission_content(url: str) -> str:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        content = response.text.strip()
        if len(content) > 15000:
            content = content[:15000]
        return content
