import os
import sys
# Add parent directory to path to find blockchain module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from blockchain.interact import CodePactContract
from algosdk import account, mnemonic

class AlgorandService:
    def __init__(self):
        self.algod_token = os.getenv("ALGORAND_TOKEN", "")
        self.algod_address = os.getenv("ALGORAND_NODE_URL", "https://testnet-api.algonode.cloud")
        self.backend_mnemonic = os.getenv("BACKEND_WALLET_MNEMONIC", "")
        self.contract = CodePactContract(self.algod_token, self.algod_address)

    def get_backend_wallet(self):
        if not self.backend_mnemonic:
            raise Exception("BACKEND_WALLET_MNEMONIC not set")
        return mnemonic.to_private_key(self.backend_mnemonic)

    def post_score(self, app_id: int, score: int):
        pk = self.get_backend_wallet()
        address = account.address_from_private_key(pk)
        return self.contract.post_score(pk, app_id, address, score)

    def get_status(self, app_id: int):
        return self.contract.get_state(app_id)
