"""
CodePact Smart Contract - PyTeal Implementation

This smart contract manages trustless freelance contracts on Algorand blockchain.
It handles escrow payments, developer work submissions, AI evaluation scores,
and automatic payment release based on evaluation results.

Global State Schema:
- client_wallet: bytes - Client's Algorand address
- developer_wallet: bytes - Developer's Algorand address (set when accepted)
- payment_amount: int - ALGO amount locked in escrow (microALGOs)
- current_score: int - Latest evaluation score (0-100)
- status: bytes - Contract status (OPEN, IN_REVIEW, COMPLETED, DISPUTED)
- requirements_hash: bytes - Hash of requirements for integrity verification
- backend_wallet: bytes - Authorized backend wallet for score updates
"""

from pyteal import *

def approval_program():
    """
    Main approval program for CodePact smart contract.
    Handles contract creation, work submission, score posting, and payment release.
    """
    
    # Global state keys
    client_wallet_key = Bytes("client_wallet")
    developer_wallet_key = Bytes("developer_wallet")
    payment_amount_key = Bytes("payment_amount")
    current_score_key = Bytes("current_score")
    status_key = Bytes("status")
    requirements_hash_key = Bytes("requirements_hash")
    backend_wallet_key = Bytes("backend_wallet")
    
    # Status constants
    status_open = Bytes("OPEN")
    status_in_review = Bytes("IN_REVIEW")
    status_completed = Bytes("COMPLETED")
    status_disputed = Bytes("DISPUTED")
    
    # Score threshold for automatic payment release
    score_threshold = Int(80)
    
    @Subroutine(TealType.none)
    def on_create():
        """
        Initialize contract with client wallet and payment amount.
        Called when the contract is first deployed.
        
        Application arguments:
        - arg[0]: "create_project"
        - arg[1]: client_wallet (bytes)
        - arg[2]: payment_amount (int, 8 bytes big endian)
        - arg[3]: requirements_hash (bytes)
        - arg[4]: backend_wallet (bytes)
        """
        return Seq([
            # Validate that payment transaction is included
            Assert(Global.group_size() == Int(2)),
            Assert(Gtxn[1].type_enum() == TxnType.Payment),
            Assert(Gtxn[1].receiver() == Global.current_application_address()),
            Assert(Gtxn[1].amount() == Btoi(Txn.application_args[2])),
            
            # Initialize global state
            App.globalPut(client_wallet_key, Txn.application_args[1]),
            App.globalPut(developer_wallet_key, Bytes("")),  # Empty until accepted
            App.globalPut(payment_amount_key, Btoi(Txn.application_args[2])),
            App.globalPut(current_score_key, Int(0)),
            App.globalPut(status_key, status_open),
            App.globalPut(requirements_hash_key, Txn.application_args[3]),
            App.globalPut(backend_wallet_key, Txn.application_args[4]),
            
            Approve()
        ])
    
    @Subroutine(TealType.none)
    def submit_work():
        """
        Record developer acceptance and submission URL.
        Updates contract status and records developer wallet.
        
        Application arguments:
        - arg[0]: "submit_work"
        - arg[1]: developer_wallet (bytes)
        - arg[2]: submission_url (bytes) - for logging purposes
        """
        return Seq([
            # Validate contract is in OPEN status
            Assert(App.globalGet(status_key) == status_open),
            
            # Validate developer wallet is not already set
            Assert(App.globalGet(developer_wallet_key) == Bytes("")),
            
            # Update contract state
            App.globalPut(developer_wallet_key, Txn.application_args[1]),
            App.globalPut(status_key, status_in_review),
            
            # Log submission URL in transaction note
            Log(Concat(Bytes("submission_url:"), Txn.application_args[2])),
            
            Approve()
        ])
    
    @Subroutine(TealType.none)
    def post_score():
        """
        Backend posts evaluation score with automatic payment release.
        Only authorized backend wallet can call this method.
        
        Application arguments:
        - arg[0]: "post_score"
        - arg[1]: score (int, 4 bytes big endian)
        - arg[2]: evaluation_data (bytes) - JSON evaluation results
        """
        score = Btoi(Txn.application_args[1])
        
        return Seq([
            # Validate caller is authorized backend wallet
            Assert(Txn.sender() == App.globalGet(backend_wallet_key)),
            
            # Validate contract is in IN_REVIEW status
            Assert(App.globalGet(status_key) == status_in_review),
            
            # Validate score is in valid range (0-100)
            Assert(score >= Int(0)),
            Assert(score <= Int(100)),
            
            # Validate developer wallet is set
            Assert(App.globalGet(developer_wallet_key) != Bytes("")),
            
            # Update score
            App.globalPut(current_score_key, score),
            
            # Log evaluation data
            Log(Concat(Bytes("evaluation:"), Txn.application_args[2])),
            
            # Check if automatic payment release is triggered
            If(score >= score_threshold).Then(
                Seq([
                    # Release payment to developer
                    InnerTxnBuilder.Begin(),
                    InnerTxnBuilder.SetFields({
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.receiver: App.globalGet(developer_wallet_key),
                        TxnField.amount: App.globalGet(payment_amount_key),
                        TxnField.note: Bytes("automatic_payment_release")
                    }),
                    InnerTxnBuilder.Submit(),
                    
                    # Update status to completed
                    App.globalPut(status_key, status_completed),
                    
                    Log(Bytes("payment_released_automatically"))
                ])
            ),
            
            Approve()
        ])
    
    @Subroutine(TealType.none)
    def release_payment():
        """
        Manual payment release for dispute resolution.
        Only client can call this method after timeout period.
        
        Application arguments:
        - arg[0]: "release_payment"
        """
        return Seq([
            # Validate caller is the client
            Assert(Txn.sender() == App.globalGet(client_wallet_key)),
            
            # Validate contract is not already completed
            Assert(App.globalGet(status_key) != status_completed),
            
            # Validate developer wallet is set
            Assert(App.globalGet(developer_wallet_key) != Bytes("")),
            
            # Release payment to developer
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: App.globalGet(developer_wallet_key),
                TxnField.amount: App.globalGet(payment_amount_key),
                TxnField.note: Bytes("manual_payment_release")
            }),
            InnerTxnBuilder.Submit(),
            
            # Update status to completed
            App.globalPut(status_key, status_completed),
            
            Log(Bytes("payment_released_manually")),
            
            Approve()
        ])
    
    # Main program logic
    program = Cond(
        [Txn.application_id() == Int(0), on_create()],
        [Txn.application_args[0] == Bytes("submit_work"), submit_work()],
        [Txn.application_args[0] == Bytes("post_score"), post_score()],
        [Txn.application_args[0] == Bytes("release_payment"), release_payment()],
    )
    
    return program

if __name__ == "__main__":
    # Compile programs to TEAL
    approval_teal = compileTeal(approval_program(), Mode.Application, version=8)
    
    # Write TEAL files
    with open("approval.teal", "w") as f:
        f.write(approval_teal)
    
    print("Approval program compiled successfully!")
    print("File generated: approval.teal")