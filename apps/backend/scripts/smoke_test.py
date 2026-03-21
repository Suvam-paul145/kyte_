import json

import requests

BASE_URL = "http://localhost:8000"
WALLET = "kyte-dev-wallet-00000000000000000001"


def req(method: str, path: str, token: str | None = None, payload: dict | None = None) -> dict:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.request(method, f"{BASE_URL}{path}", headers=headers, json=payload, timeout=20)
    body = response.json()
    if response.status_code >= 400:
        raise RuntimeError(f"{method} {path} failed: {response.status_code} {body}")
    return body


def main() -> None:
    nonce = req("GET", f"/auth/nonce?wallet={WALLET}")
    verified = req(
        "POST",
        "/auth/verify",
        payload={"wallet": WALLET, "nonce": nonce["nonce"], "signature": "dev-signature", "role": ["client", "developer"]},
    )
    token = verified["token"]

    created = req(
        "POST",
        "/project/create",
        token=token,
        payload={
            "title": "Smoke Test Project",
            "description": "Validate phase1 flow",
            "requirements": ["API endpoint exists", "Authentication present"],
            "payment_algo": 2.0,
            "score_threshold": 80,
        },
    )
    project_id = created["project_id"]

    submit = req(
        "POST",
        "/project/submit",
        token=token,
        payload={"project_id": project_id, "submission_url": "https://github.com/vercel/next.js"},
    )
    status = req("GET", f"/project/{project_id}/status", token=token)
    report = req("GET", f"/project/{project_id}/report", token=token)

    print(
        json.dumps(
            {
                "project_id": project_id,
                "overall_score": submit["overall_score"],
                "status": status["status"],
                "iterations": report["iteration_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
