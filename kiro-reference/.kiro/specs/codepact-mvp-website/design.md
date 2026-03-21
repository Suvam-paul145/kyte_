# Design Document: CodePact MVP Website

## Overview

CodePact is a decentralized freelance contract platform that eliminates trust issues between clients and developers through blockchain-based escrow and AI-powered code evaluation. The system leverages Algorand blockchain for trustless payments, Gemini 1.5 Flash AI for automated code auditing, and provides a complete web interface for seamless project management.

### Key Innovation

The platform's core innovation lies in its **trustless automation**: when a developer submits work, an AI evaluator audits the code against client requirements and automatically releases payment if the work meets the 80/100 score threshold. This eliminates disputes, reduces friction, and ensures fair compensation without manual intervention.

### Target Users

- **Clients**: Businesses and individuals seeking development services with guaranteed escrow protection
- **Developers**: Freelancers who want immediate payment upon successful work completion
- **Platform**: Operates autonomously with minimal manual intervention

### Hackathon Constraints

This MVP is designed for an 18-hour hackathon with specific time allocation:
- 6 hours: Blockchain smart contracts (PyTeal)
- 8 hours: Backend API development (FastAPI + Python)
- 4 hours: Frontend implementation (React + Vite + Tailwind)

## Architecture

### System Architecture Overview

The CodePact platform follows a three-tier architecture with blockchain integration:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Blockchain    │
│                 │    │                 │    │                 │
│ React 18        │◄──►│ FastAPI         │◄──►│ Algorand        │
│ Vite            │    │ Python 3.11+    │    │ TestNet         │
│ Tailwind CSS    │    │ AWS Lambda      │    │ PyTeal          │
│ Pera Wallet     │    │ DynamoDB        │    │ Smart Contracts │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AI Service    │
                       │                 │
                       │ Gemini 1.5      │
                       │ Flash API       │
                       └─────────────────┘
```

### Deployment Architecture

**Frontend Deployment:**
- Static hosting on Vercel/Netlify
- Environment-based configuration for API endpoints
- Wallet connection via Pera Wallet Connect

**Backend Deployment:**
- AWS Lambda functions for serverless execution
- API Gateway for HTTP routing and CORS handling
- DynamoDB for persistent data storage
- Environment variables for sensitive configuration

**Blockchain Integration:**
- Algorand TestNet for development and demo
- One smart contract per project for isolated escrow
- PyTeal for smart contract development
- Algorand SDK for blockchain interactions

### Data Flow Architecture

1. **Project Creation Flow:**
   ```
   Client → Frontend → Backend → Smart Contract → Algorand TestNet
   ```

2. **Work Submission Flow:**
   ```
   Developer → Frontend → Backend → AI Evaluator → Smart Contract → Payment Release
   ```

3. **Real-time Status Flow:**
   ```
   Frontend → Algorand TestNet (direct polling) → UI Updates
   ```

## Components and Interfaces

### Frontend Components

#### 1. Authentication System
**Component:** `WalletAuth`
- **Purpose:** Handles Pera Wallet connection and JWT token management
- **Key Features:**
  - Wallet connection modal
  - Signature-based authentication
  - Session management
  - Role detection (client/developer)

**Interface:**
```typescript
interface WalletAuthProps {
  onConnect: (walletAddress: string, token: string) => void;
  onDisconnect: () => void;
}

interface AuthState {
  isConnected: boolean;
  walletAddress: string | null;
  token: string | null;
  userRole: 'client' | 'developer' | 'both' | null;
}
```

#### 2. Client Dashboard
**Component:** `ClientDashboard`
- **Purpose:** Project creation and management interface for clients
- **Key Features:**
  - Project creation form
  - Project status overview
  - Payment management
  - Evaluation history

**Interface:**
```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  paymentAmount: number;
  status: 'OPEN' | 'IN_REVIEW' | 'COMPLETED' | 'DISPUTED';
  appId: string;
  clientWallet: string;
  developerWallet?: string;
  createdAt: string;
}

interface ClientDashboardProps {
  walletAddress: string;
  projects: Project[];
  onCreateProject: (project: CreateProjectRequest) => void;
}
```

#### 3. Developer Dashboard
**Component:** `DeveloperDashboard`
- **Purpose:** Project marketplace and work submission interface
- **Key Features:**
  - Open projects marketplace
  - Project acceptance
  - Work submission form
  - Evaluation results display

**Interface:**
```typescript
interface DeveloperDashboardProps {
  walletAddress: string;
  openProjects: Project[];
  myProjects: Project[];
  onAcceptProject: (projectId: string) => void;
  onSubmitWork: (projectId: string, submissionUrl: string) => void;
}
```

#### 4. Project Detail Page
**Component:** `ProjectDetail`
- **Purpose:** Real-time project status and blockchain state display
- **Key Features:**
  - Live blockchain state polling
  - Requirements checklist
  - Evaluation history
  - Payment status tracking

**Interface:**
```typescript
interface ProjectDetailProps {
  projectId: string;
  refreshInterval?: number; // Default: 5000ms
}

interface BlockchainState {
  clientWallet: string;
  developerWallet: string;
  paymentAmount: number;
  currentScore: number;
  status: string;
  paymentReleased: boolean;
  lastUpdated: string;
}
```

#### 5. Requirements Checklist Animation
**Component:** `RequirementsChecklist`
- **Purpose:** Animated evaluation results display
- **Key Features:**
  - Staggered animation (400ms delay between rows)
  - Real-time evaluation status
  - Pass/fail indicators with scores
  - AI reasoning display

**Interface:**
```typescript
interface RequirementResult {
  id: string;
  text: string;
  status: 'pending' | 'evaluating' | 'passed' | 'failed';
  score: number;
  reasoning: string;
}

interface RequirementsChecklistProps {
  requirements: RequirementResult[];
  animationDelay: number; // Default: 400ms
  onAnimationComplete: () => void;
}
```

### Backend API Endpoints

#### Authentication Endpoints
```python
POST /auth/nonce
# Get random nonce for wallet signature
Response: {"nonce": "random_string"}

POST /auth/verify
# Verify wallet signature and issue JWT
Request: {"wallet_address": str, "signature": str, "nonce": str}
Response: {"token": str, "expires_at": str, "user_role": str}
```

#### Project Management Endpoints
```python
GET /projects
# Get projects (filtered by user role and wallet)
Query: ?status=OPEN&wallet=address
Response: {"projects": [Project]}

POST /projects
# Create new project with smart contract deployment
Request: {
  "title": str,
  "description": str, 
  "requirements": [str],
  "payment_amount": int
}
Response: {"project_id": str, "app_id": str, "tx_id": str}

PUT /projects/{project_id}/accept
# Developer accepts project
Request: {"developer_wallet": str}
Response: {"success": bool, "tx_id": str}

POST /projects/{project_id}/submit
# Submit work for evaluation
Request: {"submission_url": str}
Response: {"evaluation_id": str, "status": "processing"}
```

#### Evaluation Endpoints
```python
GET /projects/{project_id}/evaluations
# Get evaluation history
Response: {"evaluations": [EvaluationResult]}

GET /evaluations/{evaluation_id}/status
# Get real-time evaluation status
Response: {
  "status": "processing" | "completed",
  "progress": int,
  "current_requirement": int,
  "results": [RequirementResult]
}
```

#### Blockchain Integration Endpoints
```python
GET /blockchain/project/{app_id}
# Get project state from Algorand
Response: {
  "client_wallet": str,
  "developer_wallet": str,
  "payment_amount": int,
  "current_score": int,
  "status": str,
  "payment_released": bool
}

POST /blockchain/post-score
# Internal endpoint for AI to post evaluation results
Request: {
  "app_id": str,
  "score": int,
  "evaluation_data": dict
}
Response: {"tx_id": str, "payment_released": bool}
```

### Smart Contract Interface

#### Contract State Schema
```python
# Global State
client_wallet: bytes        # Client's Algorand address
developer_wallet: bytes     # Developer's Algorand address (set when accepted)
payment_amount: int         # ALGO amount locked in escrow
current_score: int          # Latest evaluation score (0-100)
status: bytes              # OPEN, IN_REVIEW, COMPLETED, DISPUTED
requirements_hash: bytes    # Hash of requirements for integrity
backend_wallet: bytes      # Authorized backend wallet for score updates
```

#### Contract Methods
```python
def create_project(
    client_wallet: bytes,
    payment_amount: int,
    requirements_hash: bytes,
    backend_wallet: bytes
) -> None:
    # Initialize contract with locked ALGO payment

def accept_project(developer_wallet: bytes) -> None:
    # Developer accepts project, locks their wallet address

def post_score(
    score: int,
    evaluation_data: bytes,
    backend_signature: bytes
) -> None:
    # Backend posts evaluation score
    # Auto-release payment if score >= 80

def release_payment() -> None:
    # Manual payment release (dispute resolution)
    # Only callable by client after timeout period
```

## Data Models

### Database Schema (DynamoDB)

#### Projects Table
```python
{
  "PK": "PROJECT#{project_id}",
  "SK": "METADATA",
  "title": str,
  "description": str,
  "requirements": [str],
  "payment_amount": int,
  "status": str,  # OPEN, IN_REVIEW, COMPLETED, DISPUTED
  "app_id": str,  # Algorand smart contract App ID
  "client_wallet": str,
  "developer_wallet": str,  # Optional, set when accepted
  "created_at": str,
  "updated_at": str,
  "GSI1PK": "STATUS#{status}",  # For querying by status
  "GSI1SK": "CREATED#{created_at}"
}
```

#### Evaluations Table
```python
{
  "PK": "PROJECT#{project_id}",
  "SK": "EVALUATION#{timestamp}",
  "evaluation_id": str,
  "submission_url": str,
  "overall_score": int,
  "requirement_scores": [
    {
      "requirement": str,
      "score": int,
      "reasoning": str,
      "passed": bool
    }
  ],
  "gap_report": str,  # Detailed feedback for failed evaluations
  "ai_model": str,    # "gemini-1.5-flash"
  "processing_time": int,  # milliseconds
  "created_at": str,
  "status": str  # processing, completed, failed
}
```

#### Users Table
```python
{
  "PK": "USER#{wallet_address}",
  "SK": "PROFILE",
  "wallet_address": str,
  "role": str,  # client, developer, both
  "reputation_score": int,
  "projects_created": int,
  "projects_completed": int,
  "total_earned": int,  # in microALGOs
  "total_spent": int,   # in microALGOs
  "created_at": str,
  "last_active": str
}
```

### API Data Models

#### Request/Response Models
```python
# Pydantic models for API validation

class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    requirements: List[str] = Field(..., min_items=1, max_items=20)
    payment_amount: int = Field(..., gt=0)  # microALGOs

class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str
    requirements: List[str]
    payment_amount: int
    status: ProjectStatus
    app_id: str
    client_wallet: str
    developer_wallet: Optional[str]
    created_at: datetime
    updated_at: datetime

class EvaluationResult(BaseModel):
    evaluation_id: str
    project_id: str
    submission_url: str
    overall_score: int
    requirement_results: List[RequirementResult]
    gap_report: Optional[str]
    created_at: datetime
    status: EvaluationStatus

class RequirementResult(BaseModel):
    requirement: str
    score: int
    reasoning: str
    passed: bool
```

### Blockchain Data Models

#### Smart Contract State
```python
# PyTeal state schema
GlobalStateSchema = StateSchema(
    num_uints=4,    # payment_amount, current_score, status_code, created_at
    num_byte_slices=4  # client_wallet, developer_wallet, requirements_hash, backend_wallet
)

LocalStateSchema = StateSchema(
    num_uints=0,
    num_byte_slices=0
)
```

#### Transaction Types
```python
class ProjectCreationTxn:
    type: str = "appl"  # Application call
    app_id: int = 0     # Create new application
    on_complete: str = "NoOp"
    app_args: List[bytes] = [
        b"create_project",
        client_wallet.encode(),
        payment_amount.to_bytes(8, 'big'),
        requirements_hash,
        backend_wallet.encode()
    ]
    accounts: List[str] = [client_wallet]
    foreign_apps: List[int] = []

class ScorePostingTxn:
    type: str = "appl"
    app_id: int  # Existing application ID
    on_complete: str = "NoOp"
    app_args: List[bytes] = [
        b"post_score",
        score.to_bytes(4, 'big'),
        evaluation_data,
        backend_signature
    ]
    accounts: List[str] = [backend_wallet, developer_wallet]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining the correctness properties, I need to analyze the acceptance criteria for testability:
### Property 1: Smart Contract State Integrity

*For any* project creation, acceptance, or evaluation, the smart contract state should accurately reflect the current project status, participant wallets, payment amount, and evaluation score, with all state changes recorded as verifiable blockchain transactions.

**Validates: Requirements 1.3, 6.1, 6.2, 6.3, 6.4, 6.7**

### Property 2: Automatic Payment Release

*For any* evaluation with an overall score of 80 or above, the smart contract should automatically release the locked ALGO payment to the developer's wallet as an inner transaction and update the project status to COMPLETED.

**Validates: Requirements 3.5, 7.1, 7.2, 7.3**

### Property 3: Content Fetching and Evaluation

*For any* valid submission URL (GitHub, GitLab, Vercel, Netlify), the system should fetch the content, evaluate each requirement individually using Gemini 1.5 Flash, and return structured JSON results with numerical scores (0-100) and reasoning for each requirement.

**Validates: Requirements 3.1, 3.2, 3.3, 9.1, 9.2, 9.3, 9.4**

### Property 4: Gap Report Generation

*For any* evaluation with an overall score below 80, the system should generate a detailed gap report explaining all deficiencies and display it to the developer with specific improvement guidance.

**Validates: Requirements 2.7, 3.6**

### Property 5: UI Data Consistency

*For any* project data retrieved from the blockchain or database, the UI should display all relevant information accurately including wallet addresses, payment amounts, status, requirements, and evaluation results with proper formatting and real-time updates.

**Validates: Requirements 1.1, 1.4, 1.5, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 6: Authentication Round Trip

*For any* wallet connection attempt, the system should generate a random nonce, request signature from the wallet, verify the signature using Algorand SDK, and issue a valid JWT token with appropriate user role determination.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 7: Evaluation Animation Sequence

*For any* evaluation process, the requirements checklist should animate each requirement with a staggered 400ms delay, show appropriate states (pending, evaluating, passed/failed), and complete the full animation sequence before displaying the overall score and payment status.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

### Property 8: Data Persistence Integrity

*For any* project creation, evaluation, or state change, all relevant data should be stored in the database with proper timestamps, maintain consistency with blockchain state, and support concurrent access without corruption.

**Validates: Requirements 3.7, 10.1, 10.2, 10.3, 10.5, 10.6, 10.7**

### Property 9: Access Control and Security

*For any* API endpoint access, the system should validate JWT tokens, prevent unauthorized operations (especially score updates), and ensure only the authorized backend wallet can post evaluation scores to smart contracts.

**Validates: Requirements 5.5, 6.6**

### Property 10: Error Handling and Recovery

*For any* system error (wallet connection failures, content fetching failures, payment failures), the system should handle the error gracefully, provide user-friendly messages, log appropriate details for debugging, and prevent system corruption.

**Validates: Requirements 5.7, 7.5, 9.5**

### Property 11: Payment Double-Spend Prevention

*For any* payment release attempt, the system should check the current contract state to ensure payment has not already been released, preventing double payments and maintaining payment integrity.

**Validates: Requirements 7.6**

## Error Handling

### Frontend Error Handling

**Wallet Connection Errors:**
- Network connectivity issues
- Wallet rejection/cancellation
- Invalid signatures
- Unsupported wallet versions

**API Communication Errors:**
- Network timeouts
- Server errors (5xx)
- Authentication failures
- Rate limiting

**UI State Errors:**
- Invalid form submissions
- Missing required data
- Blockchain polling failures
- Animation interruptions

**Error Recovery Strategies:**
```typescript
// Exponential backoff for API retries
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

// Graceful degradation for blockchain polling
const handleBlockchainError = (error: Error) => {
  console.error('Blockchain polling failed:', error);
  // Fall back to cached data or show warning
  showWarning('Live data temporarily unavailable');
};
```

### Backend Error Handling

**Blockchain Integration Errors:**
- Algorand node connectivity issues
- Transaction failures
- Smart contract execution errors
- Insufficient funds

**AI Service Errors:**
- Gemini API rate limits
- Content fetching failures
- Evaluation timeouts
- Invalid response formats

**Database Errors:**
- DynamoDB throttling
- Connection timeouts
- Data consistency issues
- Concurrent access conflicts

**Error Response Format:**
```python
class ErrorResponse(BaseModel):
    error: str
    message: str
    code: int
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    request_id: str

# Example error responses
{
  "error": "WALLET_SIGNATURE_INVALID",
  "message": "The provided wallet signature could not be verified",
  "code": 401,
  "details": {"wallet_address": "ADDR123...", "nonce": "abc123"},
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456"
}
```

### Smart Contract Error Handling

**Contract Execution Errors:**
- Insufficient ALGO balance
- Invalid application arguments
- Unauthorized access attempts
- State update conflicts

**Error Prevention Strategies:**
```python
# PyTeal error handling patterns
def validate_payment_amount():
    return And(
        Gtxn[1].type_enum() == TxnType.Payment,
        Gtxn[1].amount() == App.globalGet(Bytes("payment_amount")),
        Gtxn[1].receiver() == Global.current_application_address()
    )

def validate_authorized_caller():
    return Txn.sender() == App.globalGet(Bytes("backend_wallet"))

# Comprehensive validation before state changes
def post_score_validation():
    return And(
        validate_authorized_caller(),
        App.globalGet(Bytes("status")) == Bytes("IN_REVIEW"),
        Txn.application_args[1] >= Int(0),
        Txn.application_args[1] <= Int(100)
    )
```

## Testing Strategy

### Dual Testing Approach

The CodePact platform requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests:** Focus on specific examples, edge cases, and integration points
**Property Tests:** Verify universal properties across all inputs through randomization

### Unit Testing Strategy

**Frontend Unit Tests (Jest + React Testing Library):**
```typescript
// Example: Wallet connection flow
describe('WalletAuth', () => {
  it('should display connection status after successful wallet connect', async () => {
    const mockConnect = jest.fn().mockResolvedValue({
      address: 'ADDR123...',
      signature: 'SIG456...'
    });
    
    render(<WalletAuth onConnect={mockConnect} />);
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    await waitFor(() => {
      expect(screen.getByText('Connected: ADDR123...')).toBeInTheDocument();
    });
  });

  it('should handle wallet connection rejection gracefully', async () => {
    const mockConnect = jest.fn().mockRejectedValue(new Error('User rejected'));
    
    render(<WalletAuth onConnect={mockConnect} />);
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    await waitFor(() => {
      expect(screen.getByText('Connection failed. Please try again.')).toBeInTheDocument();
    });
  });
});
```

**Backend Unit Tests (pytest + FastAPI TestClient):**
```python
# Example: Project creation endpoint
def test_create_project_success(client, auth_headers):
    project_data = {
        "title": "Test Project",
        "description": "Test description",
        "requirements": ["Requirement 1", "Requirement 2"],
        "payment_amount": 1000000  # 1 ALGO in microALGOs
    }
    
    response = client.post("/projects", json=project_data, headers=auth_headers)
    
    assert response.status_code == 201
    assert "project_id" in response.json()
    assert "app_id" in response.json()

def test_create_project_invalid_payment(client, auth_headers):
    project_data = {
        "title": "Test Project",
        "description": "Test description", 
        "requirements": ["Requirement 1"],
        "payment_amount": 0  # Invalid: zero payment
    }
    
    response = client.post("/projects", json=project_data, headers=auth_headers)
    
    assert response.status_code == 422
    assert "payment_amount" in response.json()["details"]
```

**Smart Contract Unit Tests (PyTeal + Algorand SDK):**
```python
# Example: Contract state validation
def test_project_creation_sets_correct_state():
    client_addr = "CLIENT123..."
    payment_amount = 1000000
    
    # Deploy contract with test parameters
    app_id = deploy_test_contract(client_addr, payment_amount)
    
    # Verify global state
    global_state = get_application_global_state(app_id)
    assert global_state["client_wallet"] == client_addr
    assert global_state["payment_amount"] == payment_amount
    assert global_state["status"] == "OPEN"

def test_unauthorized_score_update_fails():
    app_id = create_test_project()
    unauthorized_addr = "UNAUTHORIZED123..."
    
    with pytest.raises(AlgodHTTPError):
        call_app_method(app_id, "post_score", [85], sender=unauthorized_addr)
```

### Property-Based Testing Strategy

**Configuration:** Minimum 100 iterations per property test to ensure comprehensive input coverage.

**Property Test Examples:**

```python
# Property 1: Smart Contract State Integrity
@given(
    client_wallet=algorand_addresses(),
    payment_amount=integers(min_value=100000, max_value=10000000),
    requirements=lists(text(min_size=1, max_size=100), min_size=1, max_size=10)
)
def test_contract_state_integrity(client_wallet, payment_amount, requirements):
    """
    Feature: codepact-mvp-website, Property 1: For any project creation, 
    the smart contract state should accurately reflect the project parameters
    """
    # Create project with random parameters
    project_id = create_project(client_wallet, payment_amount, requirements)
    
    # Verify contract state matches input parameters
    contract_state = get_contract_state(project_id)
    assert contract_state["client_wallet"] == client_wallet
    assert contract_state["payment_amount"] == payment_amount
    assert contract_state["status"] == "OPEN"
    assert hash_requirements(requirements) == contract_state["requirements_hash"]

# Property 2: Automatic Payment Release
@given(
    evaluation_scores=lists(integers(min_value=80, max_value=100), min_size=1, max_size=10)
)
def test_automatic_payment_release(evaluation_scores):
    """
    Feature: codepact-mvp-website, Property 2: For any evaluation with 
    overall score >= 80, payment should be automatically released
    """
    project_id = create_test_project_with_developer()
    overall_score = sum(evaluation_scores) // len(evaluation_scores)
    
    # Post evaluation score
    post_evaluation_score(project_id, overall_score, evaluation_scores)
    
    # Verify payment was released if score >= 80
    contract_state = get_contract_state(project_id)
    if overall_score >= 80:
        assert contract_state["payment_released"] == True
        assert contract_state["status"] == "COMPLETED"
    else:
        assert contract_state["payment_released"] == False

# Property 3: Content Fetching and Evaluation
@given(
    github_urls=github_repository_urls(),
    requirements=lists(text(min_size=10, max_size=200), min_size=1, max_size=5)
)
def test_content_fetching_and_evaluation(github_urls, requirements):
    """
    Feature: codepact-mvp-website, Property 3: For any valid GitHub URL,
    content should be fetched and evaluated against all requirements
    """
    # Submit work with random GitHub URL
    evaluation_id = submit_work_for_evaluation(github_urls, requirements)
    
    # Wait for evaluation completion
    evaluation_result = wait_for_evaluation(evaluation_id)
    
    # Verify all requirements were evaluated
    assert len(evaluation_result["requirement_scores"]) == len(requirements)
    for req_result in evaluation_result["requirement_scores"]:
        assert 0 <= req_result["score"] <= 100
        assert req_result["reasoning"] is not None
        assert isinstance(req_result["passed"], bool)

# Property 4: UI Data Consistency
@given(
    project_data=project_data_strategy(),
    blockchain_state=blockchain_state_strategy()
)
def test_ui_data_consistency(project_data, blockchain_state):
    """
    Feature: codepact-mvp-website, Property 5: For any project data,
    UI should display information consistently with blockchain state
    """
    # Create project and update blockchain state
    project_id = create_project_with_state(project_data, blockchain_state)
    
    # Fetch UI data
    ui_data = get_project_detail_ui_data(project_id)
    actual_blockchain_state = get_blockchain_state(project_id)
    
    # Verify UI data matches blockchain state
    assert ui_data["client_wallet"] == actual_blockchain_state["client_wallet"]
    assert ui_data["payment_amount"] == actual_blockchain_state["payment_amount"]
    assert ui_data["current_score"] == actual_blockchain_state["current_score"]
    assert ui_data["status"] == actual_blockchain_state["status"]
```

**Property Test Generators:**
```python
# Custom Hypothesis strategies for domain-specific data
@composite
def algorand_addresses(draw):
    """Generate valid Algorand addresses"""
    return draw(text(alphabet=string.ascii_uppercase + string.digits, min_size=58, max_size=58))

@composite  
def github_repository_urls(draw):
    """Generate valid GitHub repository URLs"""
    username = draw(text(alphabet=string.ascii_lowercase + string.digits, min_size=1, max_size=20))
    repo_name = draw(text(alphabet=string.ascii_lowercase + string.digits + '-_', min_size=1, max_size=50))
    return f"https://github.com/{username}/{repo_name}"

@composite
def project_data_strategy(draw):
    """Generate realistic project data"""
    return {
        "title": draw(text(min_size=5, max_size=100)),
        "description": draw(text(min_size=20, max_size=1000)),
        "requirements": draw(lists(text(min_size=10, max_size=200), min_size=1, max_size=10)),
        "payment_amount": draw(integers(min_value=100000, max_value=10000000))
    }
```

### Integration Testing

**End-to-End Test Scenarios:**
1. Complete project lifecycle (create → accept → submit → evaluate → payment)
2. Multi-user concurrent access scenarios
3. Blockchain state synchronization across UI components
4. Error recovery and retry mechanisms

**Performance Testing:**
- API response times under load
- Blockchain polling efficiency
- Database query performance
- AI evaluation processing time

### Test Environment Setup

**Local Development:**
- Algorand Sandbox for blockchain testing
- LocalStack for AWS services simulation
- Mock Gemini API for AI evaluation testing

**CI/CD Pipeline:**
- Automated unit and property tests on every commit
- Integration tests on staging environment
- Performance benchmarks on production-like setup

The testing strategy ensures both specific functionality validation through unit tests and comprehensive correctness verification through property-based testing, providing confidence in the system's reliability and correctness across all possible inputs and scenarios.