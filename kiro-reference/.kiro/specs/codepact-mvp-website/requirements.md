# Requirements Document

## Introduction

CodePact is a decentralized freelance contract platform that enables trustless development contracts between clients and developers. The system uses Algorand blockchain for smart contracts and payments, Gemini 1.5 Flash AI for automated code evaluation, and provides a complete web interface for both clients and developers to interact with the platform.

## Glossary

- **Client**: A user who creates projects and locks ALGO payments in smart contracts
- **Developer**: A user who accepts projects, submits work, and receives payments upon successful evaluation
- **Smart_Contract**: An Algorand blockchain contract that manages escrow and payment release
- **AI_Evaluator**: Gemini 1.5 Flash AI system that audits code submissions against requirements
- **Pera_Wallet**: Algorand wallet used for authentication and transaction signing
- **Project**: A work request with defined requirements and locked ALGO payment
- **Submission**: Developer's work submitted via GitHub or demo URL for evaluation
- **Gap_Report**: Detailed AI feedback explaining why requirements were not met
- **Score_Threshold**: Minimum score (default 80/100) required for automatic payment release

## Requirements

### Requirement 1: Client Dashboard

**User Story:** As a client, I want to create and manage projects with locked ALGO payments, so that I can hire developers with guaranteed escrow protection.

#### Acceptance Criteria

1. WHEN a client connects their Pera Wallet, THE Client_Dashboard SHALL display their wallet address and connection status
2. THE Client_Dashboard SHALL provide a project creation form with title, description, requirements list, and ALGO payment amount fields
3. WHEN a client submits a valid project form, THE Smart_Contract SHALL be deployed to Algorand TestNet with the specified payment locked in escrow
4. THE Client_Dashboard SHALL display all client's projects with status badges (OPEN, IN_REVIEW, COMPLETED, DISPUTED)
5. WHEN a project is created successfully, THE Client_Dashboard SHALL show the App ID and Algorand Explorer link
6. THE Client_Dashboard SHALL allow clients to view detailed project status and evaluation history

### Requirement 2: Developer Dashboard

**User Story:** As a developer, I want to browse open projects and submit work for evaluation, so that I can earn ALGO payments for completed development tasks.

#### Acceptance Criteria

1. THE Developer_Dashboard SHALL display a marketplace of all open projects with payment amounts and requirements
2. WHEN a developer clicks on a project, THE Developer_Dashboard SHALL expand to show full requirements and project details
3. WHEN a developer accepts a project, THE Smart_Contract SHALL record the developer's wallet address and update project status
4. THE Developer_Dashboard SHALL provide a submission form for GitHub URLs or demo links
5. WHEN a developer submits work, THE AI_Evaluator SHALL automatically audit the submission against all requirements
6. THE Developer_Dashboard SHALL display animated evaluation results with per-requirement pass/fail status
7. IF the evaluation score is below the Score_Threshold, THEN THE Developer_Dashboard SHALL display the Gap_Report with specific improvement guidance

### Requirement 3: AI Evaluation Pipeline

**User Story:** As the system, I want to automatically evaluate developer submissions against client requirements, so that payments can be released without manual intervention.

#### Acceptance Criteria

1. WHEN a developer submits a URL, THE AI_Evaluator SHALL fetch the content from GitHub repositories or web pages
2. THE AI_Evaluator SHALL audit each requirement individually using Gemini 1.5 Flash and return structured JSON results
3. THE AI_Evaluator SHALL generate a numerical score (0-100) for each requirement with specific reasoning
4. THE AI_Evaluator SHALL calculate an overall score and determine if it meets the Score_Threshold
5. IF the overall score is 80 or above, THEN THE Smart_Contract SHALL automatically release the locked ALGO payment to the developer
6. IF the overall score is below 80, THEN THE AI_Evaluator SHALL generate a detailed Gap_Report explaining all deficiencies
7. THE AI_Evaluator SHALL store all evaluation results and timestamps in the database for audit trail

### Requirement 4: Project Detail Page

**User Story:** As both clients and developers, I want to view real-time project status from the blockchain, so that I can track contract state and payment status transparently.

#### Acceptance Criteria

1. THE Project_Detail_Page SHALL display contract status read directly from the Algorand blockchain
2. THE Project_Detail_Page SHALL show client wallet, developer wallet, payment amount, and current score from on-chain state
3. THE Project_Detail_Page SHALL display a requirements status table with individual requirement scores and pass/fail status
4. THE Project_Detail_Page SHALL show payment status (ESCROWED or RELEASED) with transaction links to Algorand Explorer
5. THE Project_Detail_Page SHALL display evaluation history with timestamps and expandable gap reports
6. THE Project_Detail_Page SHALL refresh contract state automatically every 5 seconds
7. THE Project_Detail_Page SHALL clearly indicate that data source is "Algorand Blockchain" to emphasize decentralization

### Requirement 5: Wallet Authentication System

**User Story:** As a user, I want to authenticate using my Algorand wallet without passwords, so that I can securely access the platform using blockchain identity.

#### Acceptance Criteria

1. THE Wallet_Authentication SHALL integrate with Pera Wallet Connect for wallet connection
2. WHEN a user connects their wallet, THE Wallet_Authentication SHALL request a signature of a random nonce
3. THE Wallet_Authentication SHALL verify the signature using Algorand SDK and issue a JWT token
4. THE Wallet_Authentication SHALL determine user role (client, developer, or both) based on wallet activity
5. THE Wallet_Authentication SHALL protect all API endpoints with JWT validation
6. WHEN a user disconnects their wallet, THE Wallet_Authentication SHALL clear all session data
7. THE Wallet_Authentication SHALL handle wallet connection errors gracefully with user-friendly messages

### Requirement 6: Smart Contract Integration

**User Story:** As the system, I want to manage payments and contract state on Algorand blockchain, so that all transactions are trustless and verifiable.

#### Acceptance Criteria

1. WHEN a client creates a project, THE Smart_Contract SHALL be deployed to Algorand TestNet with the client's ALGO locked in escrow
2. THE Smart_Contract SHALL store project state including client address, developer address, payment amount, status, and current score
3. WHEN a developer accepts a project, THE Smart_Contract SHALL update to record the developer's wallet address
4. WHEN the AI_Evaluator posts a score, THE Smart_Contract SHALL update the score and automatically release payment if threshold is met
5. THE Smart_Contract SHALL support four operations: create, submit_work, post_score, and release_payment
6. THE Smart_Contract SHALL prevent unauthorized score updates by validating the backend wallet signature
7. THE Smart_Contract SHALL emit all state changes as verifiable transactions on Algorand TestNet

### Requirement 7: Payment Automation System

**User Story:** As a developer, I want to receive automatic payment when my work meets requirements, so that I don't need to wait for manual approval or dispute resolution.

#### Acceptance Criteria

1. WHEN the AI_Evaluator determines a score of 80 or above, THE Payment_Automation SHALL trigger automatic ALGO release
2. THE Payment_Automation SHALL execute the payment as an inner transaction from the smart contract to the developer's wallet
3. THE Payment_Automation SHALL update the project status to COMPLETED after successful payment
4. THE Payment_Automation SHALL record the payment transaction ID for audit purposes
5. THE Payment_Automation SHALL handle payment failures gracefully and log errors for manual review
6. THE Payment_Automation SHALL prevent double payments by checking contract state before release
7. THE Payment_Automation SHALL work entirely on-chain without requiring manual intervention

### Requirement 8: Requirements Checklist Animation

**User Story:** As a developer, I want to see animated evaluation results for each requirement, so that I can understand exactly which parts of my submission passed or failed.

#### Acceptance Criteria

1. THE Requirements_Checklist SHALL display all project requirements in a list format during evaluation
2. WHEN evaluation begins, THE Requirements_Checklist SHALL show each requirement in a "pending" state with gray styling
3. THE Requirements_Checklist SHALL animate each requirement evaluation with a staggered 400ms delay between rows
4. WHEN a requirement is being evaluated, THE Requirements_Checklist SHALL show a pulsing animation and "evaluating" state
5. WHEN evaluation completes, THE Requirements_Checklist SHALL reveal pass (green checkmark) or fail (red X) with the numerical score
6. THE Requirements_Checklist SHALL display the AI's specific reasoning for each requirement result
7. THE Requirements_Checklist SHALL complete the full animation sequence before showing the overall score and payment status

### Requirement 9: Content Fetching and Parsing

**User Story:** As the system, I want to fetch and parse developer submissions from various sources, so that the AI can evaluate actual code and documentation.

#### Acceptance Criteria

1. WHEN a GitHub URL is submitted, THE Content_Fetcher SHALL retrieve README.md content using the GitHub API
2. IF no README exists, THEN THE Content_Fetcher SHALL fetch the main source files and repository structure
3. WHEN a web URL is submitted, THE Content_Fetcher SHALL extract text content using web scraping techniques
4. THE Content_Fetcher SHALL validate submission URLs against an allowlist of supported domains (GitHub, GitLab, Vercel, Netlify)
5. THE Content_Fetcher SHALL handle fetch failures gracefully and return descriptive error messages
6. THE Content_Fetcher SHALL limit content size to prevent excessive API usage
7. THE Content_Fetcher SHALL sanitize fetched content before passing to the AI_Evaluator

### Requirement 10: Database and State Management

**User Story:** As the system, I want to store project data and evaluation history reliably, so that all platform activity is tracked and auditable.

#### Acceptance Criteria

1. THE Database SHALL store project information including requirements, payment amounts, and contract App IDs
2. THE Database SHALL maintain evaluation history with timestamps, scores, and gap reports for each submission iteration
3. THE Database SHALL track user profiles with wallet addresses and reputation scores
4. THE Database SHALL provide fast queries for open projects, user projects, and evaluation reports
5. THE Database SHALL ensure data consistency between blockchain state and stored project information
6. THE Database SHALL support concurrent access from multiple users without data corruption
7. THE Database SHALL maintain audit logs of all project state changes and API access