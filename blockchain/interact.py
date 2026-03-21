from algosdk import account, mnemonic, v2client
from algosdk.transaction import ApplicationNoOpTxn, wait_for_confirmation
import base64

class CodePactContract:
    def __init__(self, algod_token, algod_address):
        self.client = v2client.algod.AlgodClient(algod_token, algod_address)

    def _get_params(self):
        return self.client.suggested_params()

    def submit_work(self, private_key, app_id, dev_address, submission_url):
        params = self._get_params()
        app_args = [
            Bytes("submit"),
            submission_url.encode('utf-8')
        ]
        
        txn = ApplicationNoOpTxn(
            dev_address,
            params,
            app_id,
            app_args=app_args
        )
        
        signed_txn = txn.sign(private_key)
        tx_id = self.client.send_transaction(signed_txn)
        return wait_for_confirmation(self.client, tx_id, 4)

    def post_score(self, private_key, app_id, backend_address, score):
        params = self._get_params()
        app_args = [
            Bytes("score"),
            score.to_bytes(8, 'big')
        ]
        
        txn = ApplicationNoOpTxn(
            backend_address,
            params,
            app_id,
            app_args=app_args
        )
        
        signed_txn = txn.sign(private_key)
        tx_id = self.client.send_transaction(signed_txn)
        return wait_for_confirmation(self.client, tx_id, 4)

    def release_payment(self, private_key, app_id, sender_address):
        params = self._get_params()
        app_args = [
            Bytes("release")
        ]
        
        txn = ApplicationNoOpTxn(
            sender_address,
            params,
            app_id,
            app_args=app_args
        )
        
        signed_txn = txn.sign(private_key)
        tx_id = self.client.send_transaction(signed_txn)
        return wait_for_confirmation(self.client, tx_id, 4)

    def get_state(self, app_id):
        app_info = self.client.application_info(app_id)
        global_state = app_info['params'].get('global-state', [])
        
        # Decode state
        decoded_state = {}
        for item in global_state:
            key = base64.b64decode(item['key']).decode('utf-8')
            value_obj = item['value']
            if value_obj['type'] == 1: # Bytes
                decoded_state[key] = base64.b64decode(value_obj['bytes']).decode('utf-8')
            else: # Uint
                decoded_state[key] = value_obj['uint']
                
        return decoded_state

# Helper for Bytes handling in Python
def Bytes(s):
    if isinstance(s, str):
        return s.encode('utf-8')
    return s
