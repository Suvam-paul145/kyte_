# CodePact — System Design Document

> **Version:** 1.0 — MVP
> **Scope:** End-to-end architecture for a trustless dev-client contract platform
> **Constraint:** Built within 18 hours — Frontend (4h) · Backend (8h) · Blockchain (6h) · Scalability (4h)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [System Architecture](#2-system-architecture)
3. [Component Breakdown](#3-component-breakdown)
4. [Data Flow — End to End](#4-data-flow--end-to-end)
5. [Blockchain Design](#5-blockchain-design)
6. [Backend Design](#6-backend-design)
7. [AI Evaluation Pipeline](#7-ai-evaluation-pipeline)
8. [Database Schema](#8-database-schema)
9. [Authentication Design](#9-authentication-design)
10. [API Contract](#10-api-contract)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Decisions & Trade-offs](#12-decisions--trade-offs)
13. [Security Considerations](#13-security-considerations)
14. [Scalability Design](#14-scalability-design)

---

## 1. Design Philosophy

### Core Tenets

| Tenet | Meaning in Practice |
|---|---|
| **Trustless by default** | No component depends on either party's honesty. The contract enforces, the AI audits, the chain settles. |
| **Minimal surface area** | MVP ships with exactly what's needed. Nothing speculative is built. |
| **Single source of truth** | On-chain state is canonical. DynamoDB is an indexed mirror + report store, never the authority. |
| **Deterministic evaluation** | Given the same submission and requirements, the AI returns the same structured JSON — no ambiguity. |
| **Fail loud, fail safely** | On any pipeline failure, payment is never auto-released. Manual client override always exists. |

### Constraints Shaping Design

- **18 total hours:** Drives every decision toward the simplest implementation that proves the core concept
- **Single backend wallet:** Eliminates multi-sig complexity at MVP — backend wallet is the oracle
- **TestNet only:** No mainnet risk. Demo funds are free TestNet ALGO
- **No auth server:** Wallet signature = identity. JWT is stateless and short-lived

---

## 2. System Architecture

### High-Level Diagram

```
 ┌─────────────────────────────────────────────────────────────────────┐
 │                         CLIENT BROWSER                              │
 │                                                                     │
 │  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
 │  │  Client Dashboard│  │  Dev Dashboard  │  │  Project Detail   │  │
 │  └────────┬─────────┘  └────────┬────────┘  └────────┬──────────┘  │
 │           │                     │                    │             │
 │  ┌────────▼─────────────────────▼────────────────────▼──────────┐  │
 │  │              Pera Wallet Connect (Auth Layer)                 │  │
 │  └──────────────────────────┬───────────────────────────────────┘  │
 └─────────────────────────────┼───────────────────────────────────────┘
                               │ HTTPS + JWT
                               ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │                   AWS API GATEWAY (REST)                            │
 └──────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │                    AWS LAMBDA (FastAPI + Mangum)                     │
 │                                                                      │
 │   ┌─────────────┐   ┌──────────────┐   ┌────────────────────────┐   │
 │   │  Auth Router │   │Project Router│   │   Evaluation Router    │   │
 │   └──────┬──────┘   └──────┬───────┘   └───────────┬────────────┘   │
 │          │                 │                        │               │
 │   ┌──────▼──────┐  ┌───────▼────────┐  ┌───────────▼────────────┐   │
 │   │ JWT Service │  │ DynamoDB Svc   │  │  Evaluation Orchestr.  │   │
 │   └─────────────┘  └───────┬────────┘  └────────┬───────────────┘   │
 └────────────────────────────┼────────────────────┼───────────────────┘
                              │                    │
              ┌───────────────▼──┐        ┌────────▼──────────────────┐
              │   AWS DynamoDB   │        │  Algorand Node (algod)    │
              │                  │        │  + Gemini 1.5 Flash API   │
              │  projects        │        │                           │
              │  reports         │        │  Smart Contract (PyTeal)  │
              │  users           │        │  APP_ID per project       │
              └──────────────────┘        └───────────────────────────┘
```

### Responsibility Matrix

| Component | Owns | Does NOT Own |
|---|---|---|
| Algorand Contract | Payment escrow, release authority, state transitions | Business logic, evaluation |
| FastAPI Backend | Orchestration, AI pipeline, DynamoDB writes | Contract authority (reads only, posts score) |
| Gemini AI | Requirement evaluation, gap report | Scoring thresholds, payment decisions |
| DynamoDB | Report history, user data, indexed project state | Canonical contract state |
| React Frontend | User interaction, state display | Any business logic or payment decisions |

---

## 3. Component Breakdown

### 3.1 Blockchain Layer

```
blockchain/
├── codepact.py          PyTeal approval program
├── clear_state.py       Clear state (minimal — return 1)
├── deploy.py            Compile + deploy via algod client
└── interact.py          submit_work(), post_score(), release_payment()
```

**Key contract properties:**
- `global_schema`: 6 global state slots (client, dev, amount, status, score, submission)
- `local_schema`: 0 (no per-account state needed in MVP)
- `on_completion: NoOp` for all operations
- Inner transaction ABI for payment release

### 3.2 Backend Layer

```
backend/
├── main.py              App factory, CORS, middleware
├── routers/
│   ├── auth.py          POST /auth/verify
│   ├── projects.py      CRUD + list endpoints
│   └── evaluation.py    AI pipeline endpoint
├── services/
│   ├── algorand.py      Contract read/write via algosdk
│   ├── gemini.py        Gemini API + prompt construction
│   ├── dynamodb.py      DynamoDB CRUD abstraction
│   └── scraper.py       Fetch submission URL content
└── models/
    ├── project.py       ProjectCreate, ProjectResponse (Pydantic)
    └── evaluation.py    EvaluationResult, RequirementResult
```

### 3.3 Frontend Layer

```
frontend/src/
├── pages/
│   ├── ClientDashboard.jsx      Create projects, view own projects
│   ├── DeveloperDashboard.jsx   Browse open, submit work, view results
│   └── ProjectDetail.jsx        Shared detail view — on-chain data
├── components/
│   ├── RequirementsChecklist    Animated row-by-row evaluation UI
│   ├── GapReport                Structured failure display
│   ├── PaymentStatus            Badge + explorer link
│   ├── WalletConnect            Pera Wallet integration
│   ├── ProjectCard              Listing card component
│   └── ScoreMeter               Radial score visualisation
├── store/
│   └── useStore.js              Zustand: wallet, projects, currentEval
└── services/
    └── api.js                   Axios instance + typed wrappers
```

---

## 4. Data Flow — End to End

### Flow A: Project Creation

```
Client UI
  │  fills title, description, requirements[], payment_algo
  │
  ▼
POST /project/create  {title, desc, requirements, payment_algo, client_wallet}
  │
  ├─► algorand.py: compile + deploy PyTeal contract → returns app_id
  │     └─► algod.send_transaction(create_txn with ALGO locked)
  │
  ├─► dynamodb.py: put_item to 'projects' table
  │     └─► {project_id, app_id, client_wallet, requirements[], status:"open"}
  │
  └─► Response: {project_id, app_id, explorer_url}
```

### Flow B: Developer Submission & Evaluation

```
Developer UI
  │  pastes GitHub/demo URL
  │
  ▼
POST /project/submit  {project_id, dev_wallet, submission_url}
  │
  ├─► algorand.py: call contract "submit" operation (sets status=1, stores URL)
  ├─► dynamodb.py: update project record (submission_url, status:"in_review")
  │
  └─► immediately chains to POST /project/evaluate
        │
        ├─► dynamodb.py: get requirements[] for project
        ├─► scraper.py: fetch_content(submission_url) → raw text/HTML
        │
        ├─► gemini.py: build_prompt(requirements, content)
        │     └─► GenerativeModel("gemini-1.5-flash").generate_content(prompt)
        │     └─► parse JSON response → EvaluationResult
        │
        ├─► algorand.py: post_score(app_id, overall_score)
        │     └─► algod.send_transaction(app_call "score" with score as arg)
        │     └─► IF score ≥ 80: contract auto-sets status=2
        │
        ├─► IF score ≥ 80: algorand.py: release_payment(app_id)
        │     └─► inner txn: contract → dev_wallet (ALGO)
        │
        ├─► dynamodb.py: append to reports[].evaluation_history
        │     └─► {timestamp, score, per_requirement[], gap_report}
        │
        └─► Response: EvaluationResult (score, requirements, gap_report)
```

### Flow C: State Read (Project Detail Page)

```
Frontend (Project Detail)
  │  polls every 5 seconds
  │
  ▼
GET /project/:id/status
  │
  ├─► algorand.py: algod_client.application_info(app_id)
  │     └─► read global_state: status, score, submission, client, dev
  │
  └─► Response: {app_id, status, score, client_wallet, dev_wallet, ...}

GET /project/:id/report
  │
  ├─► dynamodb.py: get_item('reports', project_id)
  │
  └─► Response: {evaluation_history[], iteration_count}
```

---

## 5. Blockchain Design

### Smart Contract State Machine

```
             ┌───────────┐
  CREATE ──► │   OPEN    │ ── status = 0
             │  (ALGO    │    client locked
             │  escrowed)│
             └─────┬─────┘
                   │ dev calls "submit"
                   ▼
             ┌───────────┐
             │ IN_REVIEW │ ── status = 1
             │           │    awaiting AI score
             └─────┬─────┘
                   │ backend calls "score"
          ┌────────┴────────┐
          │ score ≥ 80      │ score < 80
          ▼                 ▼
    ┌──────────┐      back to IN_REVIEW
    │COMPLETED │      (dev resubmits)
    │ status=2 │
    └────┬─────┘
         │ any wallet calls "release"
         ▼
    ALGO transferred via
    inner transaction to dev
```

### Contract Global State Variables

```python
# Key         Type      Set by          Description
"client"    # bytes    on_create       Client Algorand address
"dev"       # bytes    submit_work     Developer Algorand address
"amount"    # uint64   on_create       ALGO locked (microALGO)
"status"    # uint64   state machine   0=open 1=review 2=completed 3=disputed
"score"     # uint64   post_score      Last AI evaluation score (0–100)
"submission" # bytes   submit_work     Last submitted URL
```

### Contract Operations (ABI Method Names)

| Operation | Caller | Args | Guard |
|---|---|---|---|
| `create` | Client wallet | `[payment_amount]` | `Txn.application_id() == Int(0)` |
| `submit` | Dev wallet | `[submission_url]` | `status == 0` |
| `score` | Backend wallet | `[score_int]` | `status == 1` AND backend wallet |
| `release` | Any | `[]` | `status == 2` |
| `dispute` | Client wallet | `[]` | `iteration_count > 3` |

### Security: Backend Wallet Authority

The `post_score` operation is guarded by checking `Txn.sender() == backend_wallet_address`. This prevents any external actor from manipulating the score. The backend wallet mnemonic is stored in AWS Secrets Manager (or `.env` for MVP).

```python
# Guard in PyTeal
post_score = Seq([
    Assert(Txn.sender() == Addr(BACKEND_WALLET_ADDRESS)),
    Assert(App.globalGet(status) == Int(1)),
    ...
])
```

---

## 6. Backend Design

### FastAPI Application Structure

```python
# main.py — App factory pattern
app = FastAPI(title="CodePact API", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"])  # MVP: open CORS
app.add_middleware(AuthMiddleware)                       # JWT validation

app.include_router(auth_router, prefix="/auth")
app.include_router(projects_router, prefix="/project")
app.include_router(users_router, prefix="/user")
```

### Service Layer Pattern

Each service is a pure class with injected clients. No global state.

```python
# services/algorand.py
class AlgorandService:
    def __init__(self):
        self.algod = algod.AlgodClient(token, ALGORAND_NODE_URL)
        self.backend_wallet = mnemonic.to_private_key(BACKEND_WALLET_MNEMONIC)

    def deploy_contract(self, client_wallet: str, payment_microalgo: int) -> int:
        ...  # returns app_id

    def post_score(self, app_id: int, score: int) -> str:
        ...  # returns tx_id

    def release_payment(self, app_id: int) -> str:
        ...  # returns tx_id

    def get_contract_state(self, app_id: int) -> dict:
        ...  # returns decoded global state
```

```python
# services/gemini.py
class GeminiService:
    def __init__(self):
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    def evaluate(self, requirements: list[str], content: str) -> EvaluationResult:
        prompt = self._build_prompt(requirements, content)
        response = self.model.generate_content(prompt)
        return self._parse_response(response.text)

    def _build_prompt(self, requirements: list[str], content: str) -> str:
        ...  # structured JSON-output prompt

    def _parse_response(self, text: str) -> EvaluationResult:
        # Strip ```json fences if present, then parse
        clean = re.sub(r"```json|```", "", text).strip()
        return EvaluationResult(**json.loads(clean))
```

### Error Handling Strategy

```python
# On Gemini parse failure → use last stored score (no auto-release)
# On Algorand node timeout → retry 3x with exponential backoff
# On DynamoDB error → log and return 503, never silently continue
# On submission URL 404 → return structured error to frontend immediately
```

---

## 7. AI Evaluation Pipeline

### Prompt Design

The prompt is engineered to return machine-parseable JSON deterministically. Key design choices:

1. **Role framing**: "strict technical auditor" — reduces hallucination of false positives
2. **Explicit JSON schema**: schema is in the prompt, not inferred
3. **Per-requirement granularity**: each requirement gets its own `met`, `score`, and `reason`
4. **No markdown**: "Respond ONLY with JSON — no preamble, no markdown backticks"

```
SYSTEM ROLE:
  "You are a strict technical auditor evaluating software submissions."

REQUIREMENTS:
  JSON array of requirement strings from DynamoDB

SUBMISSION:
  Raw text content fetched from the submitted URL

OUTPUT SCHEMA:
  {
    "results": [
      {
        "requirement": "string — exact requirement text",
        "met": true | false,
        "score": 0–100,
        "reason": "string — specific explanation referencing the submission"
      }
    ],
    "overall_score": 0–100,
    "gap_report": "string — comprehensive explanation of all failures"
  }
```

### Score Threshold Rationale

| Threshold | Effect | Reasoning |
|---|---|---|
| **< 60** | Gap report sent, resubmission required | Significant work missing |
| **60–79** | Gap report sent, resubmission required | Close but requirements not met |
| **≥ 80** | Auto-release payment | High confidence all requirements are meaningfully addressed |
| **≥ 95** | Auto-release + reputation bonus | Exceptional delivery |

The 80 threshold is configurable per-project (stored in DynamoDB). MVP defaults to 80.

### Content Fetching Strategy

```python
# Priority order for submission content:
# 1. GitHub URL → fetch raw README.md via GitHub API (no auth for public repos)
# 2. GitHub URL → if no README, fetch repo file tree and main source files
# 3. Any URL → BeautifulSoup text extraction (strip JS/CSS)
# 4. If fetch fails → surface error to developer before evaluation runs

async def fetch_submission_content(url: str) -> str:
    if "github.com" in url:
        return await fetch_github_content(url)
    return await fetch_web_content(url)
```

---

## 8. Database Schema

### Table: `codepact-projects`

```
Partition Key: project_id (String)  — UUID v4

Attributes:
  project_id       String    UUID, primary key
  app_id           Number    Algorand contract App ID
  client_wallet    String    Algorand address
  dev_wallet       String    Algorand address (null until accepted)
  title            String
  description      String
  requirements     List      ["req 1", "req 2", ...]
  payment_algo     Number    Payment in ALGO (not microALGO)
  submission_url   String    Most recent submission (null until submitted)
  status           String    "open" | "in_review" | "completed" | "disputed"
  score_threshold  Number    Default: 80 (per-project configurable)
  created_at       String    ISO 8601
  updated_at       String    ISO 8601

GSI: client_wallet-index  → query all projects by client
GSI: dev_wallet-index     → query all projects by developer
GSI: status-index         → query all open projects (for marketplace)
```

### Table: `codepact-reports`

```
Partition Key: project_id (String)
Sort Key: iteration (Number)   — 1, 2, 3...

Attributes:
  project_id          String
  iteration           Number    Increments on each resubmission
  timestamp           String    ISO 8601
  submission_url      String    URL evaluated in this iteration
  overall_score       Number    0–100
  per_requirement     List      [{requirement, met, score, reason}, ...]
  gap_report          String    Full AI gap report text
  tx_id_score         String    Algorand tx ID for post_score call
  tx_id_release       String    Algorand tx ID for release_payment (if triggered)
```

### Table: `codepact-users`

```
Partition Key: wallet_address (String)

Attributes:
  wallet_address      String    Primary key, Algorand address
  role                List      ["client", "developer"]  — can be both
  reputation_score    Number    Computed: avg(scores on completed projects)
  projects_completed  Number    Count of completed projects
  projects_created    Number    Count of projects created as client
  created_at          String    ISO 8601
  last_active         String    ISO 8601
```

---

## 9. Authentication Design

### Wallet Signature Auth (No Passwords)

```
1. Frontend: peraWallet.connect() → get wallet_address
2. Frontend: request nonce from backend (GET /auth/nonce?wallet=xxx)
3. Backend: generate nonce, store in memory cache (5 min TTL)
4. Frontend: sign nonce with wallet (peraWallet.signData())
5. Frontend: POST /auth/verify {wallet_address, signed_nonce, nonce}
6. Backend: verify signature using algosdk.verifyBytes()
7. Backend: issue JWT {sub: wallet_address, role, exp: +24h}
8. Frontend: store JWT in memory (not localStorage — XSS protection)
9. All subsequent requests: Authorization: Bearer <jwt>
```

### JWT Payload

```json
{
  "sub": "ALGORAND_WALLET_ADDRESS",
  "role": ["client", "developer"],
  "exp": 1234567890,
  "iat": 1234567890,
  "jti": "unique_token_id"
}
```

### Authorization Guards

```python
# FastAPI dependency
async def require_client(token: str = Depends(oauth2_scheme)) -> str:
    payload = verify_jwt(token)
    if "client" not in payload["role"]:
        raise HTTPException(403, "Client access required")
    return payload["sub"]

async def require_dev(token: str = Depends(oauth2_scheme)) -> str:
    payload = verify_jwt(token)
    if "developer" not in payload["role"]:
        raise HTTPException(403, "Developer access required")
    return payload["sub"]
```

---

## 10. API Contract

### POST `/project/create`

```json
Request:
{
  "title": "Build a REST API with JWT auth",
  "description": "Full CRUD API for a todo app",
  "requirements": [
    "Implement JWT authentication middleware",
    "Expose GET /todos, POST /todos, DELETE /todos/:id endpoints",
    "Return proper HTTP status codes"
  ],
  "payment_algo": 3.0,
  "score_threshold": 80
}

Response 201:
{
  "project_id": "uuid-v4",
  "app_id": 12345678,
  "explorer_url": "https://testnet.algoexplorer.io/application/12345678",
  "status": "open",
  "created_at": "2025-01-01T12:00:00Z"
}
```

### POST `/project/submit`

```json
Request:
{
  "project_id": "uuid-v4",
  "submission_url": "https://github.com/dev/my-api"
}

Response 200:
{
  "project_id": "uuid-v4",
  "iteration": 1,
  "overall_score": 62,
  "results": [
    {
      "requirement": "Implement JWT authentication middleware",
      "met": false,
      "score": 20,
      "reason": "No JWT middleware found. app.py shows no auth decorator on protected routes."
    },
    {
      "requirement": "Expose GET /todos, POST /todos, DELETE /todos/:id endpoints",
      "met": true,
      "score": 95,
      "reason": "All three endpoints found in routes/todos.py with correct HTTP methods."
    }
  ],
  "gap_report": "JWT auth is not implemented. The /todos endpoints exist but are unprotected...",
  "payment_released": false
}
```

### GET `/project/:id/status`

```json
Response 200:
{
  "project_id": "uuid-v4",
  "app_id": 12345678,
  "status": "in_review",
  "status_int": 1,
  "score": 62,
  "client_wallet": "ALGO_ADDRESS",
  "dev_wallet": "ALGO_ADDRESS",
  "payment_algo": 3.0,
  "submission_url": "https://github.com/dev/my-api",
  "source": "algorand_chain"
}
```

---

## 11. Frontend Architecture

### State Management (Zustand)

```javascript
// store/useStore.js
const useStore = create((set) => ({
  // Auth
  walletAddress: null,
  jwt: null,
  setAuth: (wallet, jwt) => set({ walletAddress: wallet, jwt }),
  clearAuth: () => set({ walletAddress: null, jwt: null }),

  // Projects
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),

  // Evaluation state (drives animation)
  evaluationState: null,  // null | "running" | "complete"
  evaluationResults: [],  // drives checklist animation
  setEvaluation: (state, results) => set({
    evaluationState: state,
    evaluationResults: results
  }),
}));
```

### RequirementsChecklist — Animation Logic

```javascript
// Each requirement transitions through: pending → evaluating → pass/fail
// Staggered with 400ms delay between rows

useEffect(() => {
  if (!results.length) return;
  results.forEach((result, i) => {
    setTimeout(() => {
      setRowState(i, "evaluating");
      setTimeout(() => {
        setRowState(i, result.met ? "pass" : "fail");
      }, 600);
    }, i * 400);
  });
}, [results]);
```

### Routing

```jsx
<Router>
  <Route path="/" element={<Landing />} />
  <Route path="/client" element={<ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>} />
  <Route path="/developer" element={<ProtectedRoute role="developer"><DeveloperDashboard /></ProtectedRoute>} />
  <Route path="/project/:id" element={<ProjectDetail />} />
</Router>
```

---

## 12. Decisions & Trade-offs

### Decision 1: One Contract Per Project (vs. One Master Contract)

| Option | Pro | Con |
|---|---|---|
| **One contract per project** ✓ | Isolated state, simpler logic, no shared risk | More ALGO for contract creation (~0.1 ALGO per app) |
| One master contract | Cheaper to deploy | Complex state management, shared failure risk |

**Decision:** One per project. At MVP scale, 0.1 ALGO per project is acceptable.

---

### Decision 2: Backend Wallet as Score Oracle (vs. Decentralised Oracle)

| Option | Pro | Con |
|---|---|---|
| **Backend wallet oracle** ✓ | Simple, fast to build, no oracle infrastructure | Single point of trust (mitigated by open-source code) |
| Chainlink / decentralised oracle | Truly trustless AI scores | Weeks of integration work, out of scope for 18h |

**Decision:** Backend wallet oracle for MVP. In production, replace with a verifiable oracle or on-chain ZK proof of AI output.

---

### Decision 3: DynamoDB Over PostgreSQL

| Option | Pro | Con |
|---|---|---|
| **DynamoDB** ✓ | Serverless, zero ops, scales automatically, pairs with Lambda | No joins, limited query patterns |
| PostgreSQL (RDS) | Relational queries, complex joins | Requires instance, slower setup |

**Decision:** DynamoDB. The data model is document-oriented (projects, reports as nested arrays) — no joins needed.

---

### Decision 4: Gemini 1.5 Flash Over GPT-4o

| Option | Pro | Con |
|---|---|---|
| **Gemini 1.5 Flash** ✓ | 1M context window, free tier, faster inference | Less fine-tuning control vs GPT |
| GPT-4o | High quality, OpenAI ecosystem | Paid from first token, lower context limit |

**Decision:** Gemini Flash. The 1M context window is critical for evaluating large code submissions. Free tier covers hackathon usage.

---

### Decision 5: No Retry Loop on Score < 80 (Immediate Gap Report)

Rather than auto-retrying with a revised submission, the platform sends the gap report immediately. The developer manually addresses gaps and resubmits. This is intentional — the developer should understand what failed, not have the system blindly retry.

---

## 13. Security Considerations

| Risk | Mitigation |
|---|---|
| Backend wallet key exposure | Stored in AWS Secrets Manager (env var in MVP). Rotate key if compromised — old scores remain valid on-chain |
| Score manipulation | `post_score` guarded by sender check against backend wallet address in PyTeal |
| JWT token theft | Short expiry (24h), wallet address in `sub`, no refresh tokens in MVP |
| Submission URL injection | Validate URL format + domain allowlist (GitHub, GitLab, Vercel, Netlify) |
| Gemini prompt injection | Submission content is base64-encoded in the prompt, requirements are system-controlled |
| CORS in production | Lock `allow_origins` to frontend domain before mainnet launch |
| DynamoDB injection | Boto3 uses parameterised expressions — no raw query strings |

---

## 14. Scalability Design

### Current MVP Limits (Acceptable for Demo)

- Single Lambda function (cold starts ~500ms)
- Single backend wallet (tx/s limited by Algorand: 1000 tps on mainnet)
- DynamoDB on-demand capacity (auto-scales, no pre-provisioning needed)
- No caching layer

### Post-MVP Scaling Path

```
Current:  Single Lambda → DynamoDB → Algorand node
                                  ↓
Scale 1:  Lambda + ElastiCache (Redis) for nonce + session caching
Scale 2:  Separate Lambda functions per router (evaluation is CPU-heavy)
Scale 3:  SQS queue for evaluation jobs (decouple submission from eval)
Scale 4:  Multiple backend wallets (round-robin) for higher tx throughput
Scale 5:  CDN (CloudFront) for frontend assets + API caching headers
Scale 6:  Algorand MainNet deployment with audited PyTeal contract
```

### Evaluation Queue (Post-MVP)

```
POST /project/submit
  └─► push {project_id, submission_url} to SQS queue
  └─► return 202 Accepted immediately

SQS Consumer Lambda (separate function):
  └─► pull from queue
  └─► run Gemini evaluation (can take 5-15 seconds)
  └─► post score to chain
  └─► frontend polls GET /project/:id/status every 5s
```

This decoupling prevents Lambda timeout on slow Gemini responses.
