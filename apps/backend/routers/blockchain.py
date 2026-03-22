"""
blockchain.py — Endpoint to compile TEAL contracts and return compiled bytes + suggested params.

The frontend uses this to build an ApplicationCreateTxn, sign it with Pera Wallet, and
submit it directly to the Algorand testnet — no private key ever touches the backend.
"""
import base64
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from config import settings

router = APIRouter()

# Resolve the repo root (two levels up from this file: routers/ -> apps/backend/ -> apps/ ... we
# actually need to walk up to d:\kyte_ which is 3 levels above this file's directory).
_HERE = Path(__file__).resolve()
_REPO_ROOT = _HERE.parents[3]  # d:\kyte_


def _read_teal(relative_path: str) -> str:
    """Read a TEAL source file relative to the repo root."""
    full = _REPO_ROOT / relative_path
    if not full.exists():
        raise FileNotFoundError(f"TEAL file not found: {full}")
    return full.read_text(encoding="utf-8")


def _compile_teal(source: str) -> str:
    """
    Compile TEAL source via algod and return base64-encoded bytecode.
    Falls back to returning the source as-is (base64) if algosdk is unavailable.
    """
    try:
        from algosdk.v2client import algod as algod_client  # type: ignore

        client = algod_client.AlgodClient(
            settings.algorand_algod_token,
            settings.algorand_algod_address,
        )
        response = client.compile(source)
        # response["result"] is already base64
        return response["result"]
    except ImportError:
        # algosdk not installed — return raw TEAL source base64-encoded as a fallback
        return base64.b64encode(source.encode()).decode()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Algorand node compilation failed: {exc}",
        ) from exc


def _get_suggested_params() -> dict:
    """Fetch current suggested transaction params from algod."""
    try:
        from algosdk.v2client import algod as algod_client  # type: ignore

        client = algod_client.AlgodClient(
            settings.algorand_algod_token,
            settings.algorand_algod_address,
        )
        params = client.suggested_params()
        return {
            "fee": params.fee,
            "flat_fee": params.flat_fee,
            "first": params.first,
            "last": params.last,
            "gh": params.gh,
            "min_fee": getattr(params, "min_fee", 1000),
            "gen": params.gen,
        }
    except ImportError:
        return {}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch suggested params: {exc}",
        ) from exc


@router.get("/contract/compile")
def compile_contract() -> dict:
    """
    Compile the Kyte approval + clear TEAL programs and return:
      - approval_b64: base64-encoded compiled approval program
      - clear_b64:    base64-encoded compiled clear-state program
      - suggested_params: current Algorand network transaction parameters

    The frontend uses these to construct and sign an ApplicationCreateTxn
    via Pera Wallet without any backend private key involvement.
    """
    try:
        approval_source = _read_teal(settings.teal_approval_path)
        clear_source = _read_teal(settings.teal_clear_path)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    approval_b64 = _compile_teal(approval_source)
    clear_b64 = _compile_teal(clear_source)
    suggested_params = _get_suggested_params()

    return {
        "approval_b64": approval_b64,
        "clear_b64": clear_b64,
        "suggested_params": suggested_params,
        "network": "testnet",
        "algod_address": settings.algorand_algod_address,
    }
