# Implementation Plan: CodePact MVP Website

## Overview

This implementation plan follows the 18-hour hackathon timeline for building a decentralized freelance contract platform. The system uses Algorand blockchain for trustless payments, Gemini 1.5 Flash AI for automated code evaluation, and provides a complete web interface for project management.

**Key Technologies:**
- **Blockchain**: PyTeal smart contracts on Algorand TestNet
- **Backend**: FastAPI with Python, AWS Lambda deployment
- **Frontend**: React 18 with Vite and Tailwind CSS
- **AI**: Gemini 1.5 Flash for code evaluation
- **Database**: DynamoDB for project and evaluation data

**Time Allocation:**
- Blockchain Layer: 6 hours (H0-H6)
- Backend Layer: 8 hours (H3-H11) 
- Frontend Layer: 4 hours (H10-H14)
- Deployment & Integration: 4 hours (H14-H18)

## Tasks

- [ ] 1. Blockchain Smart Contract Development (6 hours)
  - [x] 1.1 Set up PyTeal development environment and core contract logic
    - Install Python environment with `pyteal` and `py-algorand-sdk`
    - Create `blockchain/contracts/codepact.py` with PyTeal approval program
    - Define global state schema (client_wallet, developer_wallet, payment_amount, current_score, status, requirements_hash, backend_wallet)
    - Implement `on_create` handler to initialize contract with client wallet and payment amount
    - Implement `submit_work` handler to record developer acceptance and submission URL
    - Implement `post_score` handler with backend wallet authorization and automatic payment release for scores ≥ 80
    - Implement `release_payment` handler for manual payment release
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 1.2 Write property test for smart contract state integrity
    - **Property 1: Smart Contract State Integrity**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.7**

  - [ ] 1.3 Create clear state program and compile contracts
    - Create `blockchain/contracts/clear_state.py` with minimal clear state logic
    - Write `blockchain/compile.py` to compile approval and clear state programs to TEAL
    - Set up local Algorand development environment or AlgoNode TestNet connection
    - _Requirements: 6.1_

  - [ ]* 1.4 Write unit tests for contract operations
    - Test contract creation with payment attachment
    - Test work submission from developer wallet
    - Test unauthorized score update rejection
    - Test automatic payment release when score ≥ 80
    - Test manual payment release functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 1.5 Deploy smart contract to Algorand TestNet
    - Fund TestNet wallets via Algorand TestNet faucet
    - Create `blockchain/deploy.py` for contract deployment
    - Build and sign ApplicationCreateTxn with proper global/local state schema
    - Deploy contract and save App ID to environment configuration
    - Verify deployment on Algorand TestNet Explorer
    - _Requirements: 6.1, 6.7_

  - [ ] 1.6 Create contract interaction utilities
    - Create `blockchain/interact.py` with `CodePactContract` class
    - Implement `deploy()`, `submit_work()`, `post_score()`, `release_payment()`, and `get_state()` methods
    - Add error handling with exponential backoff for node timeouts
    - Test full contract lifecycle end-to-end with Python scripts
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 1.7 Write property test for automatic payment release
    - **Property 2: Automatic Payment Release**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 2. Backend API Development (8 hours)
  - [ ] 2.1 Set up FastAPI project structure and DynamoDB tables
    - Install FastAPI dependencies: `fastapi`, `uvicorn`, `boto3`, `pyteal`, `py-algorand-sdk`, `google-generativeai`, `python-dotenv`, `httpx`, `pydantic`, `mangum`
    - Create `backend/main.py` with FastAPI app factory, CORS configuration, and router imports
    - Create `backend/services/dynamodb.py` with DynamoDB operations for projects, evaluations, and users
    - Create `backend/scripts/create_tables.py` to set up DynamoDB tables with proper GSIs
    - Create health check endpoint `GET /health`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 2.2 Implement wallet authentication system
    - Create `backend/routers/auth.py` with nonce generation and signature verification endpoints
    - Create `backend/services/jwt.py` for JWT token creation and validation
    - Create `backend/dependencies.py` with FastAPI auth dependencies
    - Implement `GET /auth/nonce` to generate random nonce for wallet signature
    - Implement `POST /auth/verify` to verify Algorand signature and issue JWT token
    - Add role determination logic based on wallet activity
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.3 Write property test for authentication round trip
    - **Property 6: Authentication Round Trip**
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [ ] 2.4 Create project management endpoints
    - Create `backend/models/project.py` with Pydantic models for project data validation
    - Create `backend/routers/projects.py` with CRUD operations
    - Implement `POST /projects` to create projects with smart contract deployment
    - Implement `GET /projects` with filtering by status and wallet address
    - Implement `PUT /projects/{project_id}/accept` for developer project acceptance
    - Implement `GET /projects/{project_id}/status` for real-time blockchain state reading
    - Implement `GET /projects/{project_id}/evaluations` for evaluation history
    - Create `backend/services/algorand.py` wrapper for blockchain interactions
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 4.1, 4.2_

  - [ ]* 2.5 Write property test for UI data consistency
    - **Property 5: UI Data Consistency**
    - **Validates: Requirements 1.1, 1.4, 1.5, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4, 4.5**

  - [ ] 2.6 Implement content fetching and parsing system
    - Create `backend/services/scraper.py` for GitHub and web content fetching
    - Implement `fetch_github_content()` using GitHub API for README.md retrieval
    - Implement `fetch_web_content()` using httpx and BeautifulSoup for web scraping
    - Add URL validation against allowlist of supported domains
    - Add content size limits and sanitization
    - Handle fetch failures with descriptive error messages
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 2.7 Write property test for content fetching and evaluation
    - **Property 3: Content Fetching and Evaluation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 9.1, 9.2, 9.3, 9.4**

  - [ ] 2.8 Build AI evaluation pipeline with Gemini integration
    - Create `backend/services/gemini.py` for Gemini 1.5 Flash API integration
    - Create `backend/models/evaluation.py` with evaluation result models
    - Implement structured prompt generation with explicit JSON schema for requirement evaluation
    - Add JSON response parsing with error handling for malformed responses
    - Implement individual requirement scoring with reasoning
    - Calculate overall scores and determine payment release threshold
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 2.9 Create work submission and evaluation endpoint
    - Create `backend/routers/evaluation.py` with submission processing
    - Implement `POST /projects/{project_id}/submit` endpoint
    - Integrate content fetching, AI evaluation, and blockchain score posting
    - Implement automatic payment release for scores ≥ 80
    - Store evaluation results and gap reports in DynamoDB
    - Add real-time evaluation status tracking
    - _Requirements: 2.4, 2.5, 2.6, 3.5, 3.6, 3.7, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 2.10 Write property test for gap report generation
    - **Property 4: Gap Report Generation**
    - **Validates: Requirements 2.7, 3.6**

  - [ ] 2.11 Add comprehensive error handling and logging
    - Add structured JSON logging throughout the application
    - Create global FastAPI exception handler for consistent error responses
    - Handle Gemini API timeouts and rate limits gracefully
    - Handle Algorand node connectivity issues with retry logic
    - Handle DynamoDB throttling and concurrent access conflicts
    - Add validation for all user inputs and API parameters
    - _Requirements: 5.7, 7.5, 9.5_

  - [ ]* 2.12 Write property test for error handling and recovery
    - **Property 10: Error Handling and Recovery**
    - **Validates: Requirements 5.7, 7.5, 9.5**

- [ ] 3. Checkpoint - Backend API Complete
  - Ensure all backend endpoints are functional and tested
  - Verify smart contract integration works end-to-end
  - Confirm AI evaluation pipeline processes submissions correctly
  - Ask the user if questions arise

- [ ] 4. Frontend React Application (4 hours)
  - [ ] 4.1 Set up React project with Pera Wallet integration
    - Create React project with Vite: `npm create vite@latest frontend -- --template react`
    - Install dependencies: `@perawallet/connect`, `axios`, `zustand`, `react-router-dom`, `tailwindcss`
    - Configure Tailwind CSS with custom configuration
    - Create Zustand store for wallet, JWT, projects, and evaluation state management
    - Create `src/services/api.js` with Axios instance and JWT token handling
    - _Requirements: 5.1_

  - [ ] 4.2 Implement wallet authentication component
    - Create `src/components/WalletConnect.jsx` with Pera Wallet Connect integration
    - Implement wallet connection flow with nonce signing
    - Add JWT token storage and automatic API header injection
    - Create `src/components/Navbar.jsx` with wallet status and role switching
    - Handle wallet connection errors and disconnection gracefully
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_

  - [ ]* 4.3 Write property test for access control and security
    - **Property 9: Access Control and Security**
    - **Validates: Requirements 5.5, 6.6**

  - [ ] 4.4 Create client dashboard for project management
    - Create `src/pages/ClientDashboard.jsx` with project creation and management
    - Implement project creation form with title, description, requirements list, and payment amount
    - Add dynamic requirements list with add/remove functionality
    - Create `src/components/ProjectCard.jsx` for project display with status badges
    - Implement project list with filtering and status indicators
    - Show App ID and Algorand Explorer links for created projects
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 4.5 Build developer dashboard and marketplace
    - Create `src/pages/DeveloperDashboard.jsx` with project marketplace
    - Display open projects in grid layout with payment amounts and requirements
    - Implement project acceptance functionality
    - Create work submission form with URL validation
    - Add submission pipeline status display with step-by-step progress
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 4.6 Implement animated requirements checklist
    - Create `src/components/RequirementsChecklist.jsx` with staggered animations
    - Implement requirement states: pending, evaluating, passed, failed
    - Add 400ms delay between requirement evaluations
    - Display individual requirement scores and AI reasoning
    - Show overall score with circular progress indicator
    - Complete animation sequence before showing payment status
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 4.7 Write property test for evaluation animation sequence
    - **Property 7: Evaluation Animation Sequence**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

  - [ ] 4.8 Create project detail page with real-time blockchain polling
    - Create `src/pages/ProjectDetail.jsx` with comprehensive project information
    - Implement real-time blockchain state polling every 5 seconds
    - Display contract state with client/developer wallets, payment amount, and current score
    - Create evaluation history timeline with expandable gap reports
    - Add requirements status table with individual scores and reasoning
    - Create `src/components/PaymentStatus.jsx` for escrow and release status
    - Emphasize "Algorand Blockchain" as data source in UI
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 4.9 Add responsive design and error handling
    - Implement responsive layouts for desktop and mobile devices
    - Add loading states with skeleton loaders for all API calls
    - Handle empty states (no projects, no evaluations)
    - Add error boundaries and graceful error recovery
    - Implement retry mechanisms with exponential backoff
    - Add user-friendly error messages and notifications
    - _Requirements: 5.7_

  - [ ]* 4.10 Write property test for data persistence integrity
    - **Property 8: Data Persistence Integrity**
    - **Validates: Requirements 3.7, 10.1, 10.2, 10.3, 10.5, 10.6, 10.7**

- [ ] 5. Checkpoint - Frontend Application Complete
  - Ensure all three pages (Client Dashboard, Developer Dashboard, Project Detail) are functional
  - Verify wallet authentication works with Pera Wallet
  - Confirm requirements checklist animates properly
  - Test responsive design on mobile and desktop
  - Ask the user if questions arise

- [ ] 6. AWS Lambda Deployment and Production Setup (4 hours)
  - [ ] 6.1 Deploy backend to AWS Lambda
    - Add Mangum ASGI adapter to FastAPI application
    - Create deployment script with Lambda function packaging
    - Configure API Gateway with HTTP API for cost optimization
    - Set up IAM roles with DynamoDB and Secrets Manager permissions
    - Deploy Lambda function and test all endpoints via API Gateway URL
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 6.2 Deploy frontend to S3 and CloudFront
    - Build React application for production with environment variables
    - Create S3 bucket with static website hosting configuration
    - Set up CloudFront distribution with HTTPS and SPA routing
    - Configure custom error pages for React Router compatibility
    - Test frontend deployment with production API endpoints
    - _Requirements: 1.1, 2.1, 4.1_

  - [ ] 6.3 Implement security hardening and secrets management
    - Move sensitive credentials to AWS Secrets Manager
    - Update backend services to read from Secrets Manager
    - Configure CORS with production frontend domain restrictions
    - Enable API Gateway request throttling and rate limiting
    - Set up CloudWatch alarms for error monitoring
    - Enable DynamoDB point-in-time recovery
    - _Requirements: 5.5, 6.6_

  - [ ]* 6.4 Write property test for payment double-spend prevention
    - **Property 11: Payment Double-Spend Prevention**
    - **Validates: Requirements 7.6**

  - [ ] 6.5 Prepare demo environment and end-to-end testing
    - Create test GitHub repositories with good and bad submissions
    - Fund TestNet wallets with sufficient ALGO for demonstrations
    - Run complete demo flow: project creation → acceptance → submission → evaluation → payment
    - Verify all transactions on Algorand TestNet Explorer
    - Document demo script with backup plans for potential issues
    - Take screenshots of key system states for presentation
    - _Requirements: 1.3, 2.4, 2.5, 3.5, 4.1, 4.2, 6.7, 7.1, 7.2_

- [ ] 7. Final Integration and Demo Preparation
  - [ ] 7.1 End-to-end system integration testing
    - Test complete user journey from wallet connection to payment release
    - Verify blockchain state synchronization across all UI components
    - Test concurrent user access and multi-project scenarios
    - Validate AI evaluation accuracy with known test cases
    - Confirm payment automation works reliably
    - _Requirements: 1.3, 2.4, 2.5, 3.5, 4.6, 6.7, 7.1, 7.2, 7.3_

  - [ ]* 7.2 Write integration tests for complete project lifecycle
    - Test project creation through payment release workflow
    - Test multi-user concurrent access scenarios
    - Test error recovery and retry mechanisms
    - _Requirements: 1.3, 2.4, 2.5, 3.5, 6.7, 7.1, 7.2, 7.3_

  - [ ] 7.3 Final demo rehearsal and system verification
    - Practice complete demo presentation within 4-minute time limit
    - Verify all system components are operational
    - Test backup demo scenarios in case of live issues
    - Confirm all Algorand TestNet transactions are visible on explorer
    - Validate that the system demonstrates trustless automation effectively
    - _Requirements: 1.3, 2.4, 2.5, 3.5, 4.6, 6.7, 7.1, 7.2, 7.3_

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability and validation
- Checkpoints ensure incremental validation and provide opportunities to address issues
- Property tests validate universal correctness properties across all possible inputs
- The implementation follows the 18-hour hackathon timeline with parallel development where possible
- Focus on core functionality first, with deployment and polish in the final hours
- All blockchain operations use Algorand TestNet for development and demonstration
- The system emphasizes trustless automation as the key differentiator