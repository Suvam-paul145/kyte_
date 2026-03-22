"""
deploy.py — Deploy the Kyte smart contract to Algorand TestNet.

Usage:
  Set DEPLOYER_MNEMONIC environment variable (25-word Algorand mnemonic), then:
    python deploy.py

The deployer account must have TestNet ALGO. Get free funds at:
  https://testnet.algoexplorer.io/dispenser

After deployment, note the returned App ID for use in the backend config.
"""
import base64
import os
import sys

from dotenv import load_dotenv
from pyteal import compileTeal, Mode

# Load .env from this directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ─── Configuration ────────────────────────────────────────────────────────────
ALGOD_ADDRESS = os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")
DEPLOYER_MNEMONIC = os.getenv("DEPLOYER_MNEMONIC", "")

# Global state: 4 uints (amount, status, score, _reserved), 3 byte slices (client, dev, submission)
GLOBAL_UINTS = 4
GLOBAL_BYTES = 3
LOCAL_UINTS = 0
LOCAL_BYTES = 0


def _compile_program(client, source: str) -> bytes:
    """Compile TEAL source code via algod and return binary bytes."""
    response = client.compile(source)
    return base64.b64decode(response["result"])


def deploy_kyte_contract(client, private_key: str, payment_micro_algo: int = 0) -> int:
    """
    Compile and deploy the Kyte approval + clear-state programs.

    Args:
        client:              algod client connected to TestNet
        private_key:         deployer's private key (from mnemonic)
        payment_micro_algo:  initial amount stored in global state (default 0 for admin deploy)

    Returns:
        app_id (int) — the newly created Algorand application ID
    """
    try:
        from algosdk import account
        from algosdk.transaction import (
            ApplicationCreateTxn,
            StateSchema,
            wait_for_confirmation,
        )
    except ImportError:
        print("ERROR: algosdk is not installed. Run: pip install algosdk==2.7.0")
        sys.exit(1)

    # Import the actual Kyte contract (not a non-existent 'codepact')
    from contracts.kyte import approval_program
    from contracts.clear_state import clear_state_program

    # Compile TEAL to binary
    print("Compiling approval program...")
    approval_teal = compileTeal(approval_program(), Mode.Application, version=8)
    approval_bytes = _compile_program(client, approval_teal)

    print("Compiling clear-state program...")
    clear_teal = compileTeal(clear_state_program(), Mode.Application, version=8)
    clear_bytes = _compile_program(client, clear_teal)

    sender = account.address_from_private_key(private_key)
    print(f"Deployer address: {sender}")

    # Fetch suggested params
    params = client.suggested_params()

    global_schema = StateSchema(num_uints=GLOBAL_UINTS, num_byte_slices=GLOBAL_BYTES)
    local_schema = StateSchema(num_uints=LOCAL_UINTS, num_byte_slices=LOCAL_BYTES)

    # Encode payment amount as 8-byte big-endian integer
    app_args = [payment_micro_algo.to_bytes(8, "big")] if payment_micro_algo > 0 else [b"\x00" * 8]

    txn = ApplicationCreateTxn(
        sender=sender,
        sp=params,
        on_complete=0,  # NoOp
        approval_program=approval_bytes,
        clear_program=clear_bytes,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=app_args,
    )

    # Sign
    signed_txn = txn.sign(private_key)
    tx_id = client.send_transaction(signed_txn)
    print(f"Transaction submitted: {tx_id}")
    print("Waiting for confirmation (up to 8 rounds)...")

    receipt = wait_for_confirmation(client, tx_id, 8)
    app_id = receipt["application-index"]
    return app_id


if __name__ == "__main__":
    try:
        from algosdk import mnemonic
        from algosdk.v2client import algod
    except ImportError:
        print("ERROR: algosdk is not installed.")
        print("Install it with: pip install algosdk==2.7.0")
        sys.exit(1)

    if not DEPLOYER_MNEMONIC:
        print("ERROR: DEPLOYER_MNEMONIC environment variable is not set.")
        print()
        print("Set it to your 25-word Algorand mnemonic and re-run:")
        print('  $env:DEPLOYER_MNEMONIC = "word1 word2 ... word25"')
        print("  python deploy.py")
        print()
        print("Get TestNet ALGO at: https://testnet.algoexplorer.io/dispenser")
        sys.exit(1)

    print("=" * 60)
    print("  KYTE Contract — Algorand TestNet Deployment")
    print("=" * 60)
    print(f"Algod node: {ALGOD_ADDRESS}")

    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

    try:
        private_key = mnemonic.to_private_key(DEPLOYER_MNEMONIC)
    except Exception as e:
        print(f"ERROR: Invalid mnemonic — {e}")
        sys.exit(1)

    try:
        app_id = deploy_kyte_contract(client, private_key, payment_micro_algo=0)
        print()
        print("=" * 60)
        print(f"  ✅ Deployed Kyte Contract!")
        print(f"  App ID:  {app_id}")
        print(f"  Explorer: https://testnet.algoexplorer.io/application/{app_id}")
        print("=" * 60)
    except Exception as e:
        print(f"\nERROR during deployment: {e}")
        sys.exit(1)
