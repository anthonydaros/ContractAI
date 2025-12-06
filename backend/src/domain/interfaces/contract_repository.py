from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.contract import Contract

class IContractRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[Contract]:
        pass

    @abstractmethod
    def get_by_id(self, contract_id: str) -> Optional[Contract]:
        pass

    @abstractmethod
    def save(self, contract: Contract) -> None:
        pass
