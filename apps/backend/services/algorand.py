from dataclasses import dataclass


@dataclass
class ContractState:
    app_id: int
    status_int: int
    score: int
    submission_url: str | None
    client_wallet: str
    dev_wallet: str | None


class AlgorandService:
    """
    Local deterministic adapter for Phase 1.
    Signatures are kept compatible with real Algorand implementation.
    """

    def __init__(self) -> None:
        self._next_app_id = 100000
        self._states: dict[int, ContractState] = {}

    def deploy_contract(self, client_wallet: str, payment_algo: float) -> int:
        self._next_app_id += 1
        app_id = self._next_app_id
        self._states[app_id] = ContractState(
            app_id=app_id,
            status_int=0,
            score=0,
            submission_url=None,
            client_wallet=client_wallet,
            dev_wallet=None,
        )
        return app_id

    def submit_work(self, app_id: int, dev_wallet: str, submission_url: str) -> str:
        state = self._states[app_id]
        state.dev_wallet = dev_wallet
        state.submission_url = submission_url
        state.status_int = 1
        return f"tx_submit_{app_id}"

    def post_score(self, app_id: int, score: int) -> str:
        state = self._states[app_id]
        state.score = score
        if score >= 80:
            state.status_int = 2
        return f"tx_score_{app_id}_{score}"

    def release_payment(self, app_id: int) -> str:
        state = self._states[app_id]
        if state.status_int != 2:
            raise ValueError("Contract is not in completed state")
        return f"tx_release_{app_id}"

    def get_contract_state(self, app_id: int) -> ContractState:
        return self._states[app_id]


algorand_service = AlgorandService()
