import base64
from algosdk import account, mnemonic, v2client
from algosdk.transaction import ApplicationCreateTxn, StateSchema, PaymentTxn, wait_for_confirmation
from contracts.codepact import approval_program
from contracts.clear_state import clear_state_program
from pyteal import compileTeal, Mode

# Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

def compile_program(client, source_code):
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])

def deploy_contract(client, private_key, approval_source, clear_source, global_schema, local_schema, app_args):
    sender = account.address_from_private_key(private_key)
    
    # Compile programs
    approval_program_compiled = compile_program(client, approval_source)
    clear_program_compiled = compile_program(client, clear_source)
    
    # Create application
    params = client.suggested_params()
    txn = ApplicationCreateTxn(
        sender,
        params,
        0, # OnComplete.NoOp
        approval_program_compiled,
        clear_program_compiled,
        global_schema,
        local_schema,
        app_args=app_args
    )
    
    # Sign and send
    signed_txn = txn.sign(private_key)
    tx_id = client.send_transaction(signed_txn)
    
    # Wait for confirmation
    receipt = wait_for_confirmation(client, tx_id, 4)
    app_id = receipt['application-index']
    
    return app_id

if __name__ == "__main__":
    # Example usage for testing
    client = v2client.algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
    
    # Note: You'll need to provide a mnemonic here for testing
    # mnemonic_str = "your mnemonic here"
    # private_key = mnemonic.to_private_key(mnemonic_str)
    
    # approval_teal = compileTeal(approval_program(), Mode.Application, version=8)
    # clear_teal = compileTeal(clear_state_program(), Mode.Application, version=8)
    
    # global_schema = StateSchema(num_uints=3, num_byte_slices=3)
    # local_schema = StateSchema(num_uints=0, num_byte_slices=0)
    
    # app_args = [ (3000000).to_bytes(8, 'big') ] # 3 ALGO in microALGO
    
    # app_id = deploy_contract(client, private_key, approval_teal, clear_teal, global_schema, local_schema, app_args)
    # print(f"Deployed CodePact with App ID: {app_id}")
