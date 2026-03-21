import os
from pyteal import *

def approval_program():
    # Global state keys
    client_key = Bytes("client")
    dev_key = Bytes("dev")
    amount_key = Bytes("amount")
    status_key = Bytes("status")
    score_key = Bytes("score")
    submission_key = Bytes("submission")

    # Status constants
    STATUS_OPEN = Int(0)
    STATUS_REVIEW = Int(1)
    STATUS_COMPLETED = Int(2)
    STATUS_DISPUTED = Int(3)

    # Backend wallet address (Valid TestNet address)
    BACKEND_WALLET = Addr("NZMJZDYEZXZSNJVGE37F52VUHRISJJEFB6QLLCF7EKJM4YB3ACZQI7G2FU")

    @Subroutine(TealType.none)
    def update_status(new_status):
        return App.globalPut(status_key, new_status)

    on_create = Seq([
        App.globalPut(client_key, Txn.sender()),
        App.globalPut(amount_key, Btoi(Txn.application_args[0])),
        App.globalPut(status_key, STATUS_OPEN),
        App.globalPut(score_key, Int(0)),
        Return(Int(1))
    ])

    on_submit = Seq([
        Assert(App.globalGet(status_key) == STATUS_OPEN),
        App.globalPut(dev_key, Txn.sender()),
        App.globalPut(submission_key, Txn.application_args[1]),
        update_status(STATUS_REVIEW),
        Return(Int(1))
    ])

    on_score = Seq([
        Assert(Txn.sender() == BACKEND_WALLET),
        Assert(App.globalGet(status_key) == STATUS_REVIEW),
        App.globalPut(score_key, Btoi(Txn.application_args[1])),
        If(Btoi(Txn.application_args[1]) >= Int(80),
           update_status(STATUS_COMPLETED),
           update_status(STATUS_OPEN)
        ),
        Return(Int(1))
    ])

    on_release = Seq([
        Assert(App.globalGet(status_key) == STATUS_COMPLETED),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(dev_key),
            TxnField.amount: App.globalGet(amount_key),
            TxnField.fee: Int(1000)
        }),
        InnerTxnBuilder.Submit(),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.NoOp, Cond(
            [Txn.application_args[0] == Bytes("submit"), on_submit],
            [Txn.application_args[0] == Bytes("score"), on_score],
            [Txn.application_args[0] == Bytes("release"), on_release]
        )],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == App.globalGet(client_key))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == App.globalGet(client_key))]
    )

    return program

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "approval.teal")
    with open(output_path, "w") as f:
        compiled = compileTeal(approval_program(), Mode.Application, version=8)
        f.write(compiled)
    print(f"Compiled to {output_path}")
