import uuid
from typing import List, Optional
from datetime import datetime
from ...domain.interfaces.contract_repository import IContractRepository
from ...domain.entities.contract import Contract

class MockContractRepository(IContractRepository):
    def __init__(self):
        self._contracts: List[Contract] = []
        self._init_mocks()

    def _init_mocks(self):
        # In a real scenario, load from files in data/mock_contracts
        mock1 = Contract(
            id="mock_1",
            name="Fair Rental Agreement",
            source="mock",
            content="This is a fair rental agreement...",
            created_at=datetime.utcnow()
        )
        self._contracts.append(mock1)

    def get_all(self) -> List[Contract]:
        return self._contracts

    def get_by_id(self, contract_id: str) -> Optional[Contract]:
        return next((c for c in self._contracts if c.id == contract_id), None)

    def save(self, contract: Contract) -> None:
        if not contract.id:
            # Simulate ID generation if missing (though entity usually has it)
            object.__setattr__(contract, 'id', str(uuid.uuid4()))
        self._contracts.append(contract)
