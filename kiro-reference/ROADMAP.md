# CodePact — Build Roadmap

> **Total Budget:** 18 hours · MVP-first · Production-oriented
> **Philosophy:** Build the critical path first. Every hour that passes without a working contract is a risk.

---

## Domain Time Allocation

| Domain | Owner | Budget | Priority |
|---|---|---|---|
| **Blockchain** | Smart Contract Dev | 6h | 🔴 CRITICAL — build first |
| **Backend** | Backend Dev | 8h | 🔴 CRITICAL — nothing works without this |
| **Frontend** | Frontend Dev | 4h | 🟡 HIGH — needed for demo |
| **Scalability / Production** | DevOps / Architect | 4h | 🟢 MEDIUM — post-core |

---

## Execution Order

```
HOUR  0        3        6       10       14       17  18
      │        │        │        │        │        │   │
  ────┼────────┼────────┼────────┼────────┼────────┼───┤
  BC  │ H0–H3  │ H3–H6  │        │        │        │   │
      │Contract│Deploy  │        │        │        │   │
  ────┼────────┼────────┼────────┼────────┼────────┼───┤
  BE  │        │ H3–H7  │ H7–H10 │H10–H11 │        │   │
      │        │ Routers│ Eval   │ Wallet │        │   │
      │        │ +DB    │Pipeline│ Auth   │        │   │
  ────┼────────┼────────┼────────┼────────┼────────┼───┤
  FE  │        │        │        │H10–H14 │        │   │
      │        │        │        │3 Pages │        │   │
      │        │        │        │+Wallet │        │   │
  ────┼────────┼────────┼────────┼────────┼────────┼───┤
  SCA │        │        │        │        │H14–H17 │   │
      │        │        │        │        │Lambda  │   │
      │        │        │        │        │+CORS   │   │
  ────┼────────┼────────┼────────┼────────┼────────┼───┤
  ALL │        │        │        │        │        │H17–H18
      │        │        │        │        │        │Demo
```

---

## 🔗 BLOCKCHAIN — 6 Hours

> **Owner:** Smart Contract Developer
> **Output by end of H6:** Deployed App ID on TestNet. All 4 operations callable from Python.

---

### H0–H1 · PyTeal Contract — Core Logic (1h)

**Goal:** Write the complete approval program with all state transitions.

**Tasks:**
- [ ] Set up Python environment: `pip install pyteal py-algorand-sdk`
- [ ] Create `blockchain/contracts/codepact.py`
- [ ] Define all global state keys (client, dev, amount, status, score, submission)
- [ ] Implement `on_create` handler:
  - Store `Txn.sender()` as client
  - Store `Txn.application_args[0]` as payment amount
  - Set status = 0 (OPEN)
- [ ] Implement `submit_work` handler:
  - Guard: `Assert(App.globalGet(status) == Int(0))`
  - Guard: `Assert(Txn.sender() == App.globalGet(dev_addr))` (after dev set)
  - Store submission URL, set status = 1
- [ ] Implement `post_score` handler:
  - Guard: `Assert(Txn.sender() == Addr(BACKEND_WALLET))`
  - Guard: `Assert(App.globalGet(status) == Int(1))`
  - Store score, if score ≥ 80 set status = 2
- [ ] Implement `release_payment` handler:
  - Guard: `Assert(App.globalGet(status) == Int(2))`
  - Inner transaction: payment to dev wallet from contract

**Deliverable:** `codepact.py` — compilable PyTeal program

---

### H1–H2 · Clear State + Compile + Test Locally (1h)

**Goal:** Contract compiles without errors. Logic verified with PyTeal test fixtures.

**Tasks:**
- [ ] Create `blockchain/contracts/clear_state.py` (minimal: `Return(Int(1))`)
- [ ] Write `compile.py` — compile approval and clear to TEAL
- [ ] Install local Algorand Sandbox or use AlgoNode TestNet
- [ ] Write `test_contract.py` — unit test each operation with mock app state
  - Test: `on_create` with attached payment txn
  - Test: `submit_work` from dev wallet
  - Test: `post_score` from backend wallet (score 60 — no release)
  - Test: `post_score` from backend wallet (score 85 — status auto-sets to 2)
  - Test: `release` when status = 2

**Deliverable:** All 5 test cases pass

---

### H2–H4 · Deploy to Algorand TestNet (2h)

**Goal:** Contract live on TestNet. App ID saved. Verifiable on explorer.

**Tasks:**
- [ ] Fund two TestNet wallets via [bank.testnet.algorand.network](https://bank.testnet.algorand.network):
  - `client_wallet` (test client)
  - `backend_wallet` (service oracle)
- [ ] Create `blockchain/deploy.py`:
  - Read compiled TEAL from file
  - Build `ApplicationCreateTxn` with global/local schema
  - Sign with client wallet, send to algod
  - Print and save `app_id` to `.env`
- [ ] Run deployment: `python deploy.py --network testnet`
- [ ] Verify on [testnet.algoexplorer.io](https://testnet.algoexplorer.io)
- [ ] Copy `APP_ID` into `backend/.env`

**Deliverable:** Live contract on TestNet. App ID confirmed via explorer.

---

### H4–H6 · Contract Interaction Utilities (2h)

**Goal:** All contract operations callable from Python — ready for backend to import.

**Tasks:**
- [ ] Create `blockchain/interact.py` with class `CodePactContract`:
  ```python
  class CodePactContract:
      def deploy(client_wallet, payment_microalgo) -> int          # returns app_id
      def submit_work(app_id, dev_wallet, url) -> str              # returns tx_id
      def post_score(app_id, score) -> str                         # returns tx_id
      def release_payment(app_id) -> str                           # returns tx_id
      def get_state(app_id) -> dict                                # returns decoded state
  ```
- [ ] Implement `get_state()` — decode base64 bytes from global state keys
- [ ] Test full lifecycle end-to-end via Python script:
  - Deploy → submit → post score 60 → verify no release → post score 85 → verify release
  - Print all tx IDs and check on explorer
- [ ] Add error handling: retry on node timeout (3x exponential backoff)

**Deliverable:** `CodePactContract` class — importable, tested, all ops verified on-chain

---

## ⚙️ BACKEND — 8 Hours

> **Owner:** Backend Developer
> **Starts:** H3 (after contract logic is written and App ID placeholder is set)
> **Output by end of H11:** All 5 endpoints working. Evaluation pipeline end-to-end. Auth functional.

---

### H3–H4 · Project Scaffold + DynamoDB Tables (1h)

**Goal:** FastAPI app running. Three DynamoDB tables created. Healthy endpoint responds.

**Tasks:**
- [ ] `pip install fastapi uvicorn boto3 pyteal py-algorand-sdk google-generativeai python-dotenv httpx pydantic mangum`
- [ ] Create `backend/main.py` — app factory with CORS and placeholder routers
- [ ] Create `backend/services/dynamodb.py`:
  - `put_project()`, `get_project()`, `update_project()`, `list_open_projects()`
  - `put_report()`, `get_reports()`
  - `put_user()`, `get_user()`, `update_reputation()`
- [ ] Create `backend/scripts/create_tables.py`:
  - `codepact-projects` (PK: project_id) + GSIs on client_wallet, dev_wallet, status
  - `codepact-reports` (PK: project_id, SK: iteration)
  - `codepact-users` (PK: wallet_address)
- [ ] Run `python scripts/create_tables.py`
- [ ] Verify tables in AWS Console
- [ ] `GET /health` → `{"status": "ok", "version": "1.0.0"}`

**Deliverable:** `uvicorn main:app --reload` starts. Tables exist in DynamoDB.

---

### H4–H5 · Auth Endpoint (1h)

**Goal:** Wallet signature verified. JWT issued. All subsequent endpoints protected.

**Tasks:**
- [ ] Create `backend/routers/auth.py`:
  - `GET /auth/nonce?wallet=xxx` → generate and cache nonce (dict in memory for MVP)
  - `POST /auth/verify` → verify Algorand signature via `algosdk.util.verify_bytes()`, issue JWT
- [ ] Create `backend/services/jwt.py`:
  - `create_token(wallet_address, role)` → signed JWT
  - `verify_token(token)` → decoded payload or raise 401
- [ ] Create `backend/dependencies.py`:
  - `require_auth` — FastAPI dependency
  - `require_client` — checks role
  - `require_dev` — checks role
- [ ] Test with Postman: sign nonce message → verify → receive JWT

**Deliverable:** JWT auth working. Protected routes return 401 without valid token.

---

### H5–H7 · Project CRUD Endpoints (2h)

**Goal:** Client can create projects. Developer can list and accept projects. State readable.

**Tasks:**
- [ ] Create `backend/models/project.py`:
  - `ProjectCreate`, `ProjectResponse`, `ProjectList` Pydantic models
- [ ] Create `backend/routers/projects.py`:
  - `POST /project/create` (requires client JWT):
    1. Validate request body
    2. Call `AlgorandService.deploy_contract(client_wallet, payment_microalgo)`
    3. `dynamodb.put_project(...)` with returned app_id
    4. Return `ProjectResponse`
  - `GET /projects/open` (requires dev JWT):
    1. Query DynamoDB GSI: `status = "open"`
    2. Return paginated list
  - `POST /project/:id/accept` (requires dev JWT):
    1. Update project: `dev_wallet = req.dev_wallet`, `status = "in_review"`
  - `GET /project/:id/status` (any JWT):
    1. Call `AlgorandService.get_state(app_id)` — direct chain read
    2. Return decoded contract state + source: "algorand_chain"
  - `GET /project/:id/report` (any JWT):
    1. `dynamodb.get_reports(project_id)` — return full history
- [ ] Import `CodePactContract` from blockchain package (or copy `interact.py`)
- [ ] Create `backend/services/algorand.py` wrapping `CodePactContract`

**Deliverable:** `POST /project/create` → creates contract on chain, stores in DynamoDB, returns app_id.

---

### H7–H10 · AI Evaluation Pipeline (3h)

**Goal:** Full pipeline: submit URL → fetch content → Gemini audit → post score on-chain → store report → return structured result.

**Tasks:**
- [ ] Create `backend/services/scraper.py`:
  - `fetch_github_content(url)`: GitHub API → fetch README.md raw text
  - `fetch_web_content(url)`: httpx GET → BeautifulSoup → extract text
  - `validate_url(url)`: check domain against allowlist
- [ ] Create `backend/services/gemini.py`:
  - `GeminiService.evaluate(requirements, content)` → `EvaluationResult`
  - Build structured prompt with explicit JSON schema
  - Parse response: strip ```json fences, `json.loads()`, validate with Pydantic
  - On parse failure: raise `EvaluationError` (never auto-release on failure)
- [ ] Create `backend/models/evaluation.py`:
  - `RequirementResult(requirement, met, score, reason)`
  - `EvaluationResult(results, overall_score, gap_report, payment_released)`
- [ ] Create `backend/routers/evaluation.py`:
  - `POST /project/submit` (requires dev JWT):
    1. Validate URL
    2. `algorand.submit_work(app_id, dev_wallet, url)`
    3. Fetch submission content
    4. `gemini.evaluate(requirements, content)` → EvaluationResult
    5. `algorand.post_score(app_id, overall_score)`
    6. If `overall_score >= threshold`: `algorand.release_payment(app_id)`, set `payment_released=True`
    7. `dynamodb.put_report(...)` with full result
    8. `dynamodb.update_project(status=...)`
    9. Return `EvaluationResult`
- [ ] Full integration test:
  - Create project → accept → submit known GitHub URL → verify score on chain → verify report in DynamoDB

**Deliverable:** End-to-end pipeline working. Score appears on-chain after submission.

---

### H10–H11 · Error Handling + Logging + Local Integration Test (1h)

**Goal:** No silent failures. Every error surfaces correctly. System stable end-to-end.

**Tasks:**
- [ ] Add structured logging via Python `logging` with JSON formatter
- [ ] Add global exception handler to FastAPI (return RFC 7807 problem JSON)
- [ ] Handle: Gemini timeout → 503 with message
- [ ] Handle: Algorand node timeout → retry 3x then 503
- [ ] Handle: DynamoDB `ConditionalCheckFailedException` → 409 conflict
- [ ] Handle: Invalid submission URL → 400 with specific message
- [ ] Test unhappy paths:
  - Gemini returns malformed JSON → error logged, no payment released
  - Submission URL 404 → structured 400 response
  - Post score from wrong wallet → Algorand rejects, 500 logged

**Deliverable:** Backend stable under failure conditions. All errors return structured JSON.

---

## 🎨 FRONTEND — 4 Hours

> **Owner:** Frontend Developer
> **Starts:** H10 (App ID and all API endpoints are available)
> **Output by end of H14:** All 3 pages functional. Wallet connect working. Checklist animates.

---

### H10–H11 · Scaffold + Wallet Auth (1h)

**Goal:** React app running. Pera Wallet Connect working. Auth token stored in state.

**Tasks:**
- [ ] `npm create vite@latest frontend -- --template react`
- [ ] `npm install @perawallet/connect axios zustand react-router-dom tailwindcss`
- [ ] Configure Tailwind (`tailwind.config.js`, import in `index.css`)
- [ ] Create `src/store/useStore.js` — wallet, jwt, projects, evaluation state
- [ ] Create `src/services/api.js`:
  - Axios instance with `baseURL` from env
  - Request interceptor: attach `Authorization: Bearer ${jwt}` header
  - Response interceptor: handle 401 → clear auth + redirect
- [ ] Create `src/components/WalletConnect.jsx`:
  ```javascript
  const peraWallet = new PeraWalletConnect();
  // connect() → get wallet_address
  // GET /auth/nonce?wallet=xxx
  // peraWallet.signData(nonce) → signed payload
  // POST /auth/verify → receive JWT
  // store in Zustand
  ```
- [ ] Create `src/App.jsx` with React Router routes
- [ ] Create `src/components/Navbar.jsx` — logo, wallet connect button, role switch

**Deliverable:** App loads. Connect Wallet → Pera Wallet opens → JWT stored. Navbar visible.

---

### H11–H12 · Client Dashboard (1h)

**Goal:** Client can create a project. Project appears in their list.

**Tasks:**
- [ ] Create `src/pages/ClientDashboard.jsx`:
  - Left: list of client's projects (status badge: OPEN / IN REVIEW / COMPLETED)
  - Right: "New Project" form
- [ ] **New Project Form** fields:
  - `title` — text input
  - `description` — textarea
  - `requirements` — dynamic list (Add Requirement button, remove per-row)
  - `payment_algo` — number input with ALGO suffix
  - `score_threshold` — slider (default 80)
- [ ] On submit:
  - `POST /project/create` via `api.js`
  - Show loading state: "Deploying contract to Algorand..."
  - On success: show App ID + Algorand Explorer link in a success card
  - Refresh project list
- [ ] `src/components/ProjectCard.jsx`:
  - Shows title, requirements count, payment, status badge, created date
  - Click → navigate to `/project/:id`
- [ ] Status badge colors: OPEN=blue, IN_REVIEW=yellow, COMPLETED=green, DISPUTED=red

**Deliverable:** Client can create a project and see it in their list with App ID.

---

### H12–H13 · Developer Dashboard + Evaluation UI (1h)

**Goal:** Developer browses projects, accepts one, submits URL, watches AI results animate.

**Tasks:**
- [ ] Create `src/pages/DeveloperDashboard.jsx`:
  - Open Projects marketplace (grid layout)
  - My Active Project panel (if accepted)
- [ ] Project marketplace card:
  - Title, requirements count, payment amount in ALGO, time posted
  - "View & Accept" button → expand to show full requirements list
  - "Accept Project" button → `POST /project/:id/accept`
- [ ] Submission panel (shown after accept):
  - URL input with validation (GitHub/GitLab/Vercel/Netlify)
  - "Submit & Evaluate" button
  - On submit: show pipeline steps in sequence:
    ```
    [✓] Submitting to blockchain...
    [✓] Fetching submission content...
    [⟳] Running AI evaluation...
    ```
- [ ] Create `src/components/RequirementsChecklist.jsx`:
  - Receives `results[]` array from API response
  - Renders each requirement as a row
  - Row states: `pending` (gray) → `evaluating` (pulse animation) → `pass` (green) → `fail` (red)
  - Stagger animation: 400ms delay between rows
  - Shows `score` and `reason` on pass/fail
- [ ] Show score meter (circular progress) + overall score number
- [ ] If score < 80: show gap report card + "Resubmit" button

**Deliverable:** Full evaluation flow visible. Checklist animates row by row.

---

### H13–H14 · Project Detail Page + Polish (1h)

**Goal:** Shared project view shows on-chain state. All edges handled. Demo-ready.

**Tasks:**
- [ ] Create `src/pages/ProjectDetail.jsx`:
  - Header: project title, status badge, App ID + Explorer link
  - Contract State card (source: "algorand_chain" — emphasise this in UI)
    - Client wallet, Dev wallet (truncated with copy button)
    - ALGO amount, current score, contract status
  - Evaluation History (from `/project/:id/report`):
    - Timeline of iterations with timestamp, score, and expandable gap report
  - Requirements status table:
    - Columns: Requirement | Latest Status | Score | Reason
  - Payment Status component:
    - ESCROWED: blue lock icon + amount
    - RELEASED: green checkmark + tx explorer link
- [ ] Create `src/components/PaymentStatus.jsx`
- [ ] Create `src/components/GapReport.jsx` — collapsible per-requirement failure detail
- [ ] Poll `GET /project/:id/status` every 5 seconds (clear on unmount)
- [ ] Handle loading states on all API calls (skeleton loaders)
- [ ] Handle empty states (no projects, no report yet)
- [ ] Responsive layout: works on desktop and mobile

**Deliverable:** All 3 pages complete. App is demo-ready. No blank screens or unhandled errors.

---

## 🚀 SCALABILITY / PRODUCTION — 4 Hours

> **Owner:** DevOps / Architect (or lead developer in parallel after H14)
> **Goal:** App deployable to AWS. CORS locked. Secrets secured. Lambda cold start handled.

---

### H14–H15 · AWS Lambda Deployment (1h)

**Goal:** Backend deployed on Lambda. API Gateway URL accessible from frontend.

**Tasks:**
- [ ] Add `mangum` to `requirements.txt` (ASGI adapter for Lambda)
- [ ] Modify `main.py`:
  ```python
  from mangum import Mangum
  handler = Mangum(app)  # Lambda entry point
  ```
- [ ] Create `serverless.yml` or `sam-template.yaml`:
  - Lambda function with 512MB memory, 30s timeout
  - API Gateway trigger (HTTP API, cheaper than REST API)
  - IAM role: DynamoDB full access, Secrets Manager read
- [ ] Create deployment script `deploy_backend.sh`:
  ```bash
  pip install -r requirements.txt -t ./package
  cd package && zip -r ../function.zip .
  cd .. && zip function.zip -r routers/ services/ models/ main.py
  aws lambda update-function-code --function-name codepact-api --zip-file fileb://function.zip
  ```
- [ ] Set Lambda env vars from `.env` via AWS Console or AWS CLI
- [ ] Test deployed API via Postman — all 5 endpoints respond

**Deliverable:** API Gateway URL (e.g. `https://xxx.execute-api.us-east-1.amazonaws.com`) works.

---

### H15–H16 · Frontend Deployment to S3 + CloudFront (1h)

**Goal:** Frontend publicly accessible. Served from CDN. HTTPS.

**Tasks:**
- [ ] Update `frontend/.env` with production API Gateway URL
- [ ] `npm run build` → `dist/` directory
- [ ] Create S3 bucket: `codepact-frontend`
  - Enable static website hosting
  - Public read policy
- [ ] `aws s3 sync dist/ s3://codepact-frontend --delete`
- [ ] Create CloudFront distribution:
  - Origin: S3 bucket
  - Default cache behaviour: redirect HTTP to HTTPS
  - Custom error page: 404 → `/index.html` (SPA routing)
- [ ] Note CloudFront URL (e.g. `https://dxxx.cloudfront.net`)
- [ ] Test all 3 pages on production URL

**Deliverable:** Frontend live at CloudFront URL. HTTPS. Works on mobile.

---

### H16–H17 · Security Hardening + Secrets (1h)

**Goal:** No credentials in code. CORS locked. Production-ready security posture.

**Tasks:**
- [ ] Move `BACKEND_WALLET_MNEMONIC` and `GEMINI_API_KEY` to AWS Secrets Manager
- [ ] Update `services/algorand.py` and `services/gemini.py` to read from Secrets Manager:
  ```python
  import boto3
  client = boto3.client("secretsmanager")
  secret = client.get_secret_value(SecretId="codepact/prod")
  ```
- [ ] Lock CORS in `main.py`:
  ```python
  allow_origins=["https://dxxx.cloudfront.net"]
  ```
- [ ] Enable API Gateway request throttling: 100 requests/second, burst 200
- [ ] Enable DynamoDB point-in-time recovery on all tables
- [ ] Review IAM role: principle of least privilege (DynamoDB, Secrets Manager only)
- [ ] Enable CloudWatch alarms:
  - Lambda error rate > 5%
  - Lambda duration P99 > 10s
  - DynamoDB throttled requests > 0

**Deliverable:** No secrets in env vars or code. CORS locked. Monitoring active.

---

### H17–H18 · Demo Rehearsal + End-to-End Smoke Test (1h)

**Goal:** Full demo runs flawlessly. Backup plan ready if anything breaks.

**Tasks:**
- [ ] Run full demo flow on production environment:
  1. Connect client Pera Wallet
  2. Create project: "Build a REST API with JWT auth and 3 endpoints" — 3 ALGO
  3. Confirm ALGO locked on Algorand TestNet explorer
  4. Switch to developer wallet
  5. Accept project
  6. Submit a known bad GitHub URL → score 60 → checklist animates → gap report shown
  7. Submit a known good GitHub URL → score 91 → payment released
  8. Show explorer: ALGO transferred to dev wallet
- [ ] Prepare two GitHub repos in advance:
  - `bad-submission/` — missing JWT, missing 1 endpoint
  - `good-submission/` — all requirements met
- [ ] Prepare Algorand TestNet wallets with sufficient ALGO (> 10 ALGO each)
- [ ] Document backup: if Lambda is slow, show local demo (localhost:8000 + localhost:5173)
- [ ] Screenshot all key states: escrow locked, evaluation running, payment released

**Deliverable:** Demo script rehearsed. System verified end-to-end. Ready to present.

---

## Milestones & Go/No-Go Gates

| Milestone | Time | Pass Criteria | Risk if Missed |
|---|---|---|---|
| **M1: Contract Deployed** | H3 | App ID exists on TestNet explorer | Everything else is blocked |
| **M2: Evaluation Pipeline** | H10 | POST /project/submit → score on-chain | Demo has no proof of AI |
| **M3: Frontend Functional** | H14 | All 3 pages, checklist animates | Demo requires CLI only |
| **M4: Lambda Deployed** | H15 | API Gateway URL responds | Demo on localhost only |
| **M5: Demo Rehearsed** | H18 | Full flow < 4 minutes | Risk of live failure |

### Go/No-Go Decision at H14

If backend or frontend is not complete by H14, apply this triage:

| Time Left | Action |
|---|---|
| 4h+ remaining | Proceed as planned |
| 2–3h remaining | Cut CloudFront — demo from S3 static URL |
| 1h remaining | Cut AWS deployment — demo fully on localhost |
| < 30min remaining | Script the demo with pre-recorded screenshots + live contract state |

---

## Dependency Graph

```
[Contract Written (H1)] ──────────────────────────────────────────────►
         │
         ▼
[Contract Deployed (H3)] ──────────────────────────────────────────────►
         │
         ├──► [Backend Scaffold (H4)]
         │          │
         │          ├──► [Auth (H5)]
         │          │
         │          ├──► [Project CRUD (H7)]
         │          │          │
         │          │          └──► [Evaluation Pipeline (H10)]
         │          │                        │
         │          │                        └──► [Frontend Dev Dashboard (H12)]
         │          │
         │          └──► [Frontend Client Dashboard (H11)]
         │
         └──► [Frontend Project Detail (H13)]
                    │
                    └──► [Lambda Deploy (H15)]
                                   │
                                   └──► [CloudFront Deploy (H16)]
                                                  │
                                                  └──► [Security (H17)]
                                                                 │
                                                                 └──► [Demo (H18)]
```

---

## MVP Definition (What Ships in 18h)

### ✅ In Scope

- Algorand smart contract with 4 state transitions
- AI evaluation pipeline (Gemini 1.5 Flash)
- 5 REST API endpoints
- 3 frontend pages
- Pera Wallet authentication
- Animated requirements checklist
- Gap report viewer
- DynamoDB storage for projects and reports
- AWS Lambda deployment
- Basic CloudFront hosting

### ❌ Out of Scope (Post-MVP)

| Feature | Reason Deferred |
|---|---|
| Multi-sig contract approval | Adds 1–2 days of contract complexity |
| Decentralised AI oracle | Needs Chainlink integration — weeks of work |
| SQS evaluation queue | Not needed at demo scale |
| Email/Slack notifications | Nice-to-have, not core |
| Dispute resolution flow | Define after core flow is proven |
| Mobile-native Pera Wallet deep link | Works in browser, native is polish |
| Reputation scoring algorithm | Stub exists, computation deferred |
| Mainnet deployment | Requires audit of PyTeal contract |
| Multi-language support | English only for MVP |
| File upload (instead of URL) | URL covers 95% of demo use cases |
