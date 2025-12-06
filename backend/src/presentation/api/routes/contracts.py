"""
Mock contracts API routes.

This module provides endpoints for listing and retrieving demo contracts
used for testing and demonstration purposes.
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

# Configure module logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contracts", tags=["contracts"])


class ContractPreview(BaseModel):
    """
    Preview model for contract listings.

    Attributes:
        id: Unique identifier for the contract.
        name: Display name of the contract.
        description: Brief description of the contract type and terms.
        risk_level: Pre-assessed risk level (low/medium/high).
        preview: First 200 characters of the contract content.
    """
    id: str = Field(..., description="Contract unique identifier")
    name: str = Field(..., description="Contract display name")
    description: str = Field(..., description="Brief contract description")
    risk_level: str = Field(..., description="Risk level: low, medium, or high")
    preview: str = Field(..., description="Content preview (first 200 chars)")


class ContractsResponse(BaseModel):
    """
    Response model for contract listings.

    Attributes:
        contracts: List of contract previews.
    """
    contracts: List[ContractPreview]


class ContractDetail(BaseModel):
    """
    Full contract detail model.

    Attributes:
        id: Unique identifier for the contract.
        name: Display name of the contract.
        description: Brief description of the contract.
        risk_level: Pre-assessed risk level.
        content: Full text content of the contract.
    """
    id: str = Field(..., description="Contract unique identifier")
    name: str = Field(..., description="Contract display name")
    description: str = Field(..., description="Brief contract description")
    risk_level: str = Field(..., description="Risk level: low, medium, or high")
    content: str = Field(..., description="Full contract text")


# Mock contracts data for demonstration
MOCK_CONTRACTS = {
    "fair": {
        "id": "fair",
        "name": "Fair Rental Agreement",
        "description": "Balanced agreement with reasonable terms and standard protections",
        "risk_level": "low",
        "content": """RESIDENTIAL LEASE AGREEMENT

CLAUSE 1 - SUBJECT MATTER
The LANDLORD hereby leases to the TENANT the property located at
123 Flower Street, for exclusively residential purposes.

CLAUSE 2 - TERM
The lease term is 12 (twelve) months, beginning on January 1, 2025.
Upon expiration, the agreement may be renewed by mutual consent.

CLAUSE 3 - RENT
The monthly rent is $1,500.00, with annual adjustment based on the
Consumer Price Index (CPI) applied on the contract anniversary date.

CLAUSE 4 - TERMINATION
Either party may terminate this agreement with 30 days written notice,
without penalty after the 12th month of tenancy.

CLAUSE 5 - IMPROVEMENTS
Necessary improvements shall be reimbursed to the TENANT.
Useful improvements require prior written authorization.

CLAUSE 6 - SECURITY DEPOSIT
The TENANT shall provide a security deposit equivalent to 2 months' rent,
to be returned within 30 days after lease termination, minus any damages."""
    },
    "abusive": {
        "id": "abusive",
        "name": "Aggressive NDA",
        "description": "Agreement with highly restrictive and potentially abusive clauses",
        "risk_level": "high",
        "content": """LEASE AGREEMENT

CLAUSE 1 - SUBJECT MATTER
The owner rents the property to the tenant under the conditions below.

CLAUSE 2 - TERM
Term of 36 months. The tenant MAY NOT terminate the agreement before
expiration, under penalty of 6 months' rent as fine.

CLAUSE 3 - RENT
Rent of $2,000.00 with monthly adjustment by whichever index the
LANDLORD deems most appropriate.

CLAUSE 4 - INSPECTIONS
The LANDLORD may inspect the property AT ANY TIME, without prior
notice to the tenant.

CLAUSE 5 - IMPROVEMENTS
All improvements made by the TENANT shall be incorporated into the
property without any compensation.

CLAUSE 6 - SECURITY DEPOSIT
The TENANT must pay 6 months' rent as advance security deposit,
which shall not be refunded under any circumstances.

CLAUSE 7 - INDEMNIFICATION
The TENANT shall indemnify the LANDLORD for any and all claims,
damages, losses, without any limitation whatsoever."""
    },
    "confusing": {
        "id": "confusing",
        "name": "Confusing Service Contract",
        "description": "Poorly written agreement with ambiguous terms and unclear obligations",
        "risk_level": "medium",
        "content": """TEMPORARY USE AGREEMENT THING

1) The GRANTOR provides space for the GRANTEE to use, maybe.

2) The amount will be discussed verbally each month and may vary.

3) Not sure when it starts or ends, we'll figure it out later.

4) If there's a problem, we'll talk about it, or maybe not.

5) The GRANTEE can do renovations if they want, but then it belongs
   to the GRANTOR, or maybe not, depends.

6) This contract is valid or not valid depending on the situation,
   parties agree to whatever is best at the time.

7) Fees and charges may apply, amounts to be determined later.

8) Either party can change terms at any time without notice."""
    }
}


@router.get("/", response_model=ContractsResponse)
async def list_contracts() -> ContractsResponse:
    """
    List all available demo contracts.

    Returns a list of contract previews including ID, name, description,
    risk level, and a content preview.

    Returns:
        ContractsResponse: List of available contracts.
    """
    logger.info("Listing all mock contracts")
    contracts = [
        ContractPreview(
            id=c["id"],
            name=c["name"],
            description=c["description"],
            risk_level=c["risk_level"],
            preview=c["content"][:200] + "..."
        )
        for c in MOCK_CONTRACTS.values()
    ]
    return ContractsResponse(contracts=contracts)


@router.get("/{contract_id}", response_model=ContractDetail)
async def get_contract(contract_id: str) -> ContractDetail:
    """
    Get a specific contract by ID.

    Args:
        contract_id: The unique identifier of the contract.

    Returns:
        ContractDetail: Full contract details including content.

    Raises:
        HTTPException(404): If contract_id is not found.
    """
    if contract_id not in MOCK_CONTRACTS:
        logger.warning(f"Contract not found: {contract_id}")
        raise HTTPException(
            status_code=404,
            detail=f"Contract '{contract_id}' not found"
        )

    contract = MOCK_CONTRACTS[contract_id]
    logger.info(f"Retrieved contract: {contract_id}")

    return ContractDetail(
        id=contract["id"],
        name=contract["name"],
        description=contract["description"],
        risk_level=contract["risk_level"],
        content=contract["content"]
    )
