"""
AlgorandService — wraps the blockchain contract calls.
Designed to be fully optional: if blockchain module or env vars are missing,
all methods return safe mock responses instead of crashing.
"""
import os
import sys

class AlgorandService:
    def __init__(self):
        self.algod_token    = os.getenv("ALGORAND_TOKEN", "")
        self.algod_address  = os.getenv("ALGORAND_NODE_URL", "https://testnet-api.algonode.cloud")
        self.backend_mnemonic = os.getenv("BACKEND_WALLET_MNEMONIC", "")
        self._available     = False
        self.contract       = None

        # Try to import the blockchain module — silently skip if not present
        try:
            sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
            from blockchain.interact import KyteContract
            self.contract  = KyteContract(self.algod_token, self.algod_address)
            self._available = True
            print("[AlgorandService] ✅ Blockchain module loaded.")
        except Exception as e:
            print(f"[AlgorandService] ⚠️  Blockchain unavailable — running in mock mode. ({e})")

    def get_backend_wallet(self):
        if not self.backend_mnemonic:
            return None  # Graceful: no crash
        try:
            from algosdk import account, mnemonic
            return mnemonic.to_private_key(self.backend_mnemonic)
        except Exception as e:
            print(f"[AlgorandService] ⚠️  Could not derive wallet: {e}")
            return None

    def post_score(self, app_id: int, score: int) -> dict:
        if not self._available or not self.contract:
            print(f"[AlgorandService] Mock post_score(app_id={app_id}, score={score})")
            return {"mocked": True, "app_id": app_id, "score": score}
        try:
            pk = self.get_backend_wallet()
            if not pk:
                return {"mocked": True, "reason": "no wallet key", "app_id": app_id, "score": score}
            from algosdk import account
            address = account.address_from_private_key(pk)
            return self.contract.post_score(pk, app_id, address, score)
        except Exception as e:
            print(f"[AlgorandService] ⚠️  post_score failed: {e}")
            return {"mocked": True, "error": str(e), "app_id": app_id, "score": score}

    def get_status(self, app_id: int) -> dict:
        if not self._available or not self.contract:
            return {
                "mocked": True,
                "app_id": app_id,
                "score": 0,
                "payment_released": False,
                "status": "OPEN",
            }
        try:
            return self.contract.get_state(app_id)
        except Exception as e:
            print(f"[AlgorandService] ⚠️  get_status failed: {e}")
            return {"mocked": True, "error": str(e), "app_id": app_id}
