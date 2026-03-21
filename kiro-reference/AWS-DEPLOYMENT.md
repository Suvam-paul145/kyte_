# CodePact — AWS Scalable Deployment Guide

> **Version:** 2.0 — Production-Ready Architecture  
> **Scope:** Complete AWS deployment using Lambda + API Gateway + DynamoDB + supporting services  
> **Project:** CodePact (Kyte) — Trustless dev-client escrow platform

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Redis vs AWS Alternatives — Decision](#2-redis-vs-aws-alternatives--decision)
3. [AWS Services Used](#3-aws-services-used)
4. [DynamoDB Setup](#4-dynamodb-setup)
5. [Lambda Functions](#5-lambda-functions)
6. [API Gateway Configuration](#6-api-gateway-configuration)
7. [SQS — Evaluation Queue](#7-sqs--evaluation-queue)
8. [Secrets Manager](#8-secrets-manager)
9. [CloudFront + S3 — Frontend](#9-cloudfront--s3--frontend)
10. [IAM Roles & Security](#10-iam-roles--security)
11. [Step-by-Step Deployment](#11-step-by-step-deployment)
12. [Code Changes Required](#12-code-changes-required)
13. [Environment Variables](#13-environment-variables)
14. [Monitoring & Alarms](#14-monitoring--alarms)
15. [Cost Estimation](#15-cost-estimation)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                    │
│  React + Vite + Pera Wallet Connect                                         │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     AWS CloudFront (CDN)                                     │
│  • Serves frontend static assets from S3                                    │
│  • Proxies /api/* to API Gateway (optional)                                 │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    AWS API Gateway (HTTP API)                                │
│  • Routes: /auth/*, /project/*, /evaluation/*                               │
│  • Throttling: 100 req/s, burst 200                                         │
│  • CORS: locked to CloudFront domain                                        │
└──────────────┬──────────────────────────────────┬────────────────────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────┐      ┌──────────────────────────────────────────┐
│  Lambda: codepact-api    │      │  Lambda: codepact-evaluator              │
│  (FastAPI + Mangum)      │      │  (Evaluation Worker — SQS triggered)     │
│                          │      │                                          │
│  • Auth Router           │      │  • Pull job from SQS queue               │
│  • Projects Router       │      │  • Scrape submission URL                 │
│  • Submit endpoint       │      │  • Call Gemini 1.5 Flash                 │
│    (pushes to SQS)       │      │  • Post score to Algorand chain          │
│                          │      │  • Write report to DynamoDB              │
│  Memory: 256MB           │      │                                          │
│  Timeout: 15s            │      │  Memory: 512MB                           │
│                          │      │  Timeout: 60s                            │
└──────────┬───────────────┘      └───────────┬──────────────────────────────┘
           │                                  │
           │         ┌────────────────────────┘
           │         │
           ▼         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          AWS DynamoDB                                        │
│                                                                              │
│  ┌────────────────────┐ ┌────────────────────┐ ┌─────────────────────────┐  │
│  │ codepact-projects  │ │  codepact-reports  │ │   codepact-users        │  │
│  │ PK: project_id     │ │  PK: project_id    │ │   PK: wallet_address    │  │
│  │ GSI: client_wallet │ │  SK: iteration     │ │                         │  │
│  │ GSI: dev_wallet    │ │                    │ │                         │  │
│  │ GSI: status        │ │                    │ │                         │  │
│  └────────────────────┘ └────────────────────┘ └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘

Other AWS Services:
┌─────────────────┐ ┌─────────────────┐ ┌──────────────────────────────────┐
│  AWS SQS        │ │ Secrets Manager │ │ CloudWatch                       │
│  Evaluation     │ │ • GEMINI_API_KEY│ │ • Lambda error alarms            │
│  Queue          │ │ • WALLET_MNEM.  │ │ • DynamoDB throttle alarms       │
│  (FIFO)         │ │ • JWT_SECRET    │ │ • API Gateway 5xx alarms         │
└─────────────────┘ └─────────────────┘ └──────────────────────────────────┘
```

---

## 2. Redis vs AWS Alternatives — Decision

### ❌ Redis (ElastiCache) — NOT Recommended for MVP/Hackathon

| Concern | Details |
|---|---|
| **Cost** | ElastiCache runs 24/7 — minimum ~$15/month for `cache.t3.micro`. Serverless Redis (MemoryDB) is cheaper but still overkill |
| **Complexity** | Requires VPC configuration, subnet groups, security groups. Lambda must be in VPC → adds cold start latency (1-3s) |
| **What you'd use it for** | Nonce caching (5-min TTL), session caching, rate limiting |
| **Better alternative** | DynamoDB TTL achieves the same for nonce caching at zero extra cost |

### ✅ Recommended: DynamoDB for Everything (+ SQS for Queuing)

| Use Case | Redis Would Do | Better AWS Alternative | Why Better |
|---|---|---|---|
| **Nonce caching** (auth flow) | `SET nonce:wallet xxx EX 300` | DynamoDB item with TTL attribute | Already using DynamoDB. TTL auto-deletes expired nonces. No extra service |
| **Session/JWT invalidation** | `SET session:xxx` | DynamoDB `codepact-sessions` table | Serverless, no VPC needed |
| **Rate limiting** | `INCR rate:ip:xxx` | API Gateway built-in throttling | Zero code. Configure in API Gateway: 100 req/s default |
| **Evaluation job queue** | Redis Pub/Sub or Bull | **AWS SQS** (Simple Queue Service) | Native Lambda trigger, built-in retry, dead-letter queue, zero ops |
| **Caching Algorand state** | `SET chain:appid:xxx` | DynamoDB with conditional writes | Already the mirror store per DESIGN.md |

### When WOULD You Use Redis?

Only if you hit **Scale 3+** (thousands of concurrent users):
- Real-time leaderboard/ranking
- Sub-millisecond reads for hot data
- Pub/Sub for WebSocket notifications

**Bottom line:** For CodePact's scale, DynamoDB + SQS + API Gateway throttling covers 100% of your needs without adding Redis/ElastiCache complexity.

---

## 3. AWS Services Used

| Service | Purpose | Pricing Model |
|---|---|---|
| **Lambda** (×2 functions) | Backend API + Evaluation worker | Pay per invocation. Free tier: 1M requests/month |
| **API Gateway** (HTTP API) | REST endpoint routing + CORS + throttling | $1/million requests. Free tier: 1M requests/month |
| **DynamoDB** (×3 tables) | Projects, Reports, Users + Nonces | On-demand: $1.25/million writes, $0.25/million reads. Free tier: 25GB + 25 WCU/RCU |
| **SQS** (1 FIFO queue) | Evaluation job queue | $0.40/million requests. Free tier: 1M requests/month |
| **Secrets Manager** | API keys, wallet mnemonics, JWT secret | $0.40/secret/month + $0.05/10K API calls |
| **S3** | Frontend static hosting | $0.023/GB/month storage |
| **CloudFront** | CDN for frontend + HTTPS | $0.085/GB transfer. Free tier: 1TB/month |
| **CloudWatch** | Logs, metrics, alarms | Free tier covers basic monitoring |

**Estimated monthly cost (hackathon/demo scale):** < $5/month (mostly within free tier)

---

## 4. DynamoDB Setup

### Table 1: `codepact-projects`

```bash
aws dynamodb create-table \
  --table-name codepact-projects \
  --attribute-definitions \
    AttributeName=project_id,AttributeType=S \
    AttributeName=client_wallet,AttributeType=S \
    AttributeName=dev_wallet,AttributeType=S \
    AttributeName=status,AttributeType=S \
  --key-schema \
    AttributeName=project_id,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {"IndexName":"client_wallet-index","KeySchema":[{"AttributeName":"client_wallet","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"dev_wallet-index","KeySchema":[{"AttributeName":"dev_wallet","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"status-index","KeySchema":[{"AttributeName":"status","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}
    ]' \
  --billing-mode PAY_PER_REQUEST
```

### Table 2: `codepact-reports`

```bash
aws dynamodb create-table \
  --table-name codepact-reports \
  --attribute-definitions \
    AttributeName=project_id,AttributeType=S \
    AttributeName=iteration,AttributeType=N \
  --key-schema \
    AttributeName=project_id,KeyType=HASH \
    AttributeName=iteration,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

### Table 3: `codepact-users`

```bash
aws dynamodb create-table \
  --table-name codepact-users \
  --attribute-definitions \
    AttributeName=wallet_address,AttributeType=S \
  --key-schema \
    AttributeName=wallet_address,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### Table 4: `codepact-nonces` (Replaces Redis/in-memory nonce store)

```bash
aws dynamodb create-table \
  --table-name codepact-nonces \
  --attribute-definitions \
    AttributeName=wallet_address,AttributeType=S \
  --key-schema \
    AttributeName=wallet_address,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Enable TTL on the 'expires_at' attribute (auto-deletes after 5 minutes)
aws dynamodb update-time-to-live \
  --table-name codepact-nonces \
  --time-to-live-specification "Enabled=true, AttributeName=expires_at"
```

### Enable Point-in-Time Recovery (all tables)

```bash
for table in codepact-projects codepact-reports codepact-users codepact-nonces; do
  aws dynamodb update-continuous-backups \
    --table-name $table \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
done
```

---

## 5. Lambda Functions

### Function 1: `codepact-api` (Main API)

**Purpose:** Handles all HTTP requests via Mangum (ASGI adapter)  
**Trigger:** API Gateway HTTP API  
**Memory:** 256MB  
**Timeout:** 15 seconds  
**Runtime:** Python 3.12

```python
# main.py — Lambda entry point
from fastapi import FastAPI
from mangum import Mangum
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CodePact API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth, projects, evaluation
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/project", tags=["Projects"])
app.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation"])

# Lambda handler
handler = Mangum(app, lifespan="off")
```

### Function 2: `codepact-evaluator` (Evaluation Worker)

**Purpose:** Processes AI evaluation jobs from SQS  
**Trigger:** SQS queue (`codepact-eval-queue`)  
**Memory:** 512MB (Gemini API responses can be large)  
**Timeout:** 60 seconds (Gemini can take 5-15s)  
**Runtime:** Python 3.12

```python
# evaluator_handler.py — SQS-triggered Lambda
import json
import boto3
from services.gemini import GeminiService
from services.scraper import ScraperService
from services.algorand import AlgorandService
from services.dynamodb import DynamoDBService

gemini = GeminiService()
scraper = ScraperService()
algorand = AlgorandService()
db = DynamoDBService()

def handler(event, context):
    for record in event["Records"]:
        body = json.loads(record["body"])
        project_id = body["project_id"]
        submission_url = body["submission_url"]
        
        # 1. Get project from DynamoDB
        project = db.get_project(project_id)
        
        # 2. Scrape submission content
        content = scraper.scrape_url(submission_url)
        
        # 3. AI evaluation
        result = gemini.evaluate(project["requirements"], content)
        
        # 4. Post score to Algorand
        if result.overall_score >= project.get("score_threshold", 80):
            algorand.post_score(project["app_id"], result.overall_score)
            algorand.release_payment(project["app_id"])
            db.update_project(project_id, status="completed", score=result.overall_score)
        else:
            algorand.post_score(project["app_id"], result.overall_score)
            db.update_project(project_id, status="open", score=result.overall_score)
        
        # 5. Store report
        db.put_report(project_id, result)
    
    return {"statusCode": 200}
```

---

## 6. API Gateway Configuration

### HTTP API (v2 — cheaper than REST API)

```bash
# Create HTTP API
aws apigatewayv2 create-api \
  --name codepact-api \
  --protocol-type HTTP \
  --cors-configuration \
    AllowOrigins="https://YOUR_CLOUDFRONT_DOMAIN",\
    AllowMethods="GET,POST,PUT,DELETE,OPTIONS",\
    AllowHeaders="Content-Type,Authorization",\
    MaxAge=86400

# Create Lambda integration
aws apigatewayv2 create-integration \
  --api-id API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:REGION:ACCOUNT:function:codepact-api \
  --payload-format-version 2.0

# Create catch-all route (FastAPI handles routing internally)
aws apigatewayv2 create-route \
  --api-id API_ID \
  --route-key '$default' \
  --target "integrations/INTEGRATION_ID"

# Add throttling
aws apigatewayv2 update-stage \
  --api-id API_ID \
  --stage-name '$default' \
  --default-route-settings "ThrottlingBurstLimit=200,ThrottlingRateLimit=100"
```

**API Gateway URL format:** `https://{api-id}.execute-api.{region}.amazonaws.com`

---

## 7. SQS — Evaluation Queue

### Why SQS Instead of Synchronous Evaluation

| Problem | Solution |
|---|---|
| Gemini API can take 5-15 seconds | SQS decouples submission from evaluation — return 202 immediately |
| Lambda API timeout (15s) too short for eval | Evaluator Lambda has its own 60s timeout |
| Multiple submissions at once | SQS queues them; evaluator processes one at a time |
| Gemini rate limits | SQS provides natural backpressure |
| Failed evaluations | SQS retry policy + Dead Letter Queue |

### Create the Queue

```bash
# Create FIFO queue (guarantees order per project)
aws sqs create-queue \
  --queue-name codepact-eval-queue.fifo \
  --attributes '{
    "FifoQueue": "true",
    "ContentBasedDeduplication": "true",
    "VisibilityTimeout": "120",
    "MessageRetentionPeriod": "86400"
  }'

# Create Dead Letter Queue for failed evaluations
aws sqs create-queue \
  --queue-name codepact-eval-dlq.fifo \
  --attributes '{"FifoQueue": "true"}'

# Set DLQ policy on main queue
aws sqs set-queue-attributes \
  --queue-url QUEUE_URL \
  --attributes '{
    "RedrivePolicy": "{\"deadLetterTargetArn\":\"DLQ_ARN\",\"maxReceiveCount\":\"3\"}"
  }'
```

### Updated Submit Endpoint (Push to SQS)

```python
# routers/evaluation.py — Updated submit to use SQS
import boto3

sqs = boto3.client("sqs")
QUEUE_URL = os.getenv("SQS_EVAL_QUEUE_URL")

@router.post("/submit")
async def submit_work(request: SubmissionRequest):
    project = db.get_project(request.project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    
    # Update status
    db.update_project(request.project_id, status="reviewing")
    
    # Push to SQS (async evaluation)
    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps({
            "project_id": request.project_id,
            "submission_url": request.submission_url,
            "dev_wallet": request.dev_wallet
        }),
        MessageGroupId=request.project_id,  # FIFO: per-project ordering
    )
    
    return {"status": "submitted", "message": "Evaluation in progress. Poll /project/{id}/status"}
```

---

## 8. Secrets Manager

### Store Secrets

```bash
# Create secret
aws secretsmanager create-secret \
  --name codepact/prod \
  --secret-string '{
    "GEMINI_API_KEY": "your-gemini-key",
    "BACKEND_WALLET_MNEMONIC": "your 25 word mnemonic here",
    "JWT_SECRET": "your-jwt-secret-key-min-32-chars",
    "SUPABASE_URL": "your-supabase-url",
    "SUPABASE_ANON_KEY": "your-supabase-anon-key"
  }'
```

### Read in Lambda

```python
# services/secrets.py
import boto3
import json

_cache = {}

def get_secrets():
    if _cache:
        return _cache
    
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId="codepact/prod")
    secrets = json.loads(response["SecretString"])
    _cache.update(secrets)
    return secrets

# Usage:
# from services.secrets import get_secrets
# secrets = get_secrets()
# api_key = secrets["GEMINI_API_KEY"]
```

---

## 9. CloudFront + S3 — Frontend

### Build & Deploy Frontend

```bash
# 1. Build frontend
cd kyte_
npm run build  # outputs to dist/

# 2. Create S3 bucket
aws s3 mb s3://codepact-frontend-UNIQUE_SUFFIX

# 3. Configure static website hosting
aws s3 website s3://codepact-frontend-UNIQUE_SUFFIX \
  --index-document index.html \
  --error-document index.html  # SPA routing

# 4. Upload built files
aws s3 sync dist/ s3://codepact-frontend-UNIQUE_SUFFIX --delete

# 5. Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config '{
    "Origins": {
      "Items": [{
        "DomainName": "codepact-frontend-UNIQUE_SUFFIX.s3.amazonaws.com",
        "Id": "S3Origin",
        "S3OriginConfig": {"OriginAccessIdentity": ""}
      }],
      "Quantity": 1
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3Origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "ForwardedValues": {"QueryString": false, "Cookies": {"Forward": "none"}},
      "MinTTL": 0
    },
    "CustomErrorResponses": {
      "Items": [{
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      }],
      "Quantity": 1
    },
    "Enabled": true,
    "DefaultRootObject": "index.html",
    "Comment": "CodePact Frontend"
  }'
```

---

## 10. IAM Roles & Security

### Lambda Execution Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/codepact-*",
        "arn:aws:dynamodb:*:*:table/codepact-*/index/*"
      ]
    },
    {
      "Sid": "SecretsManagerRead",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:*:*:secret:codepact/*"
    },
    {
      "Sid": "SQSSendReceive",
      "Effect": "Allow",
      "Action": ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"],
      "Resource": "arn:aws:sqs:*:*:codepact-*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "*"
    }
  ]
}
```

---

## 11. Step-by-Step Deployment

### Prerequisites

```bash
# Install AWS CLI
pip install awscli
aws configure  # set region, access key, secret key

# Verify
aws sts get-caller-identity
```

### Phase 1: DynamoDB Tables (5 minutes)

```bash
# Run all create-table commands from Section 4
# Verify:
aws dynamodb list-tables
```

### Phase 2: Secrets Manager (2 minutes)

```bash
# Run create-secret command from Section 8
```

### Phase 3: SQS Queue (2 minutes)

```bash
# Run create-queue commands from Section 7
```

### Phase 4: Lambda API Function (10 minutes)

```bash
# 1. Package backend
cd backend
pip install -r requirements.txt -t ./package
cd package && zip -r ../codepact-api.zip .
cd .. && zip codepact-api.zip -r routers/ services/ models/ main.py

# 2. Create Lambda function
aws lambda create-function \
  --function-name codepact-api \
  --runtime python3.12 \
  --handler main.handler \
  --role arn:aws:iam::ACCOUNT:role/codepact-lambda-role \
  --zip-file fileb://codepact-api.zip \
  --timeout 15 \
  --memory-size 256 \
  --environment "Variables={
    FRONTEND_URL=https://YOUR_CLOUDFRONT_DOMAIN,
    SQS_EVAL_QUEUE_URL=https://sqs.REGION.amazonaws.com/ACCOUNT/codepact-eval-queue.fifo,
    DYNAMODB_TABLE_PREFIX=codepact
  }"
```

### Phase 5: Lambda Evaluator Function (10 minutes)

```bash
# 1. Package evaluator (same backend code + evaluator_handler.py)
zip codepact-evaluator.zip -r services/ models/ evaluator_handler.py

# 2. Create Lambda function
aws lambda create-function \
  --function-name codepact-evaluator \
  --runtime python3.12 \
  --handler evaluator_handler.handler \
  --role arn:aws:iam::ACCOUNT:role/codepact-lambda-role \
  --zip-file fileb://codepact-evaluator.zip \
  --timeout 60 \
  --memory-size 512

# 3. Add SQS trigger
aws lambda create-event-source-mapping \
  --function-name codepact-evaluator \
  --event-source-arn arn:aws:sqs:REGION:ACCOUNT:codepact-eval-queue.fifo \
  --batch-size 1
```

### Phase 6: API Gateway (5 minutes)

```bash
# Run commands from Section 6
# Note the API Gateway URL — update frontend .env
```

### Phase 7: Frontend Deployment (5 minutes)

```bash
# Update .env with API Gateway URL
echo 'VITE_KYTE_API_BASE_URL="https://API_GATEWAY_URL"' > .env.production

# Build and deploy
npm run build
aws s3 sync dist/ s3://codepact-frontend-UNIQUE_SUFFIX --delete
```

---

## 12. Code Changes Required

### Files to CREATE

| File | Purpose |
|---|---|
| `backend/services/dynamodb.py` | DynamoDB CRUD service (replaces in-memory `projects_db`) |
| `backend/services/secrets.py` | AWS Secrets Manager wrapper with caching |
| `backend/evaluator_handler.py` | SQS-triggered Lambda handler for AI evaluation |
| `backend/scripts/create_tables.py` | Script to create all DynamoDB tables |
| `deploy_backend.sh` | Backend packaging + Lambda deployment script |
| `sam-template.yaml` (optional) | SAM/CloudFormation IaC template |

### Files to MODIFY

| File | Change |
|---|---|
| `backend/main.py` | Add `handler = Mangum(app, lifespan="off")`, lock CORS |
| `backend/routers/projects.py` | Replace `projects_db = {}` with `DynamoDBService` calls |
| `backend/routers/evaluation.py` | Replace direct eval with SQS `send_message()` |
| `backend/routers/auth.py` | Replace `nonces = {}` with DynamoDB nonces table + TTL |
| `backend/services/gemini.py` | Read API key from Secrets Manager instead of env var |
| `backend/services/algorand.py` | Read mnemonic from Secrets Manager instead of env var |
| `backend/requirements.txt` | Already has `boto3` and `mangum` — add `beautifulsoup4` if missing |
| `.env` (root) | Add `VITE_KYTE_API_BASE_URL` pointing to API Gateway URL |

---

## 13. Environment Variables

### Lambda: `codepact-api`

| Variable | Value | Source |
|---|---|---|
| `FRONTEND_URL` | `https://dxxx.cloudfront.net` | CloudFront distribution |
| `SQS_EVAL_QUEUE_URL` | `https://sqs.us-east-1.amazonaws.com/xxx/codepact-eval-queue.fifo` | SQS console |
| `DYNAMODB_TABLE_PREFIX` | `codepact` | Convention |
| `AWS_REGION` | `us-east-1` | Auto-set by Lambda |

### Lambda: `codepact-evaluator`

Same as above, plus secrets are read from Secrets Manager at runtime (not env vars).

### Frontend `.env.production`

```env
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_KYTE_API_BASE_URL="https://API_GATEWAY_URL"
```

---

## 14. Monitoring & Alarms

```bash
# Lambda error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name codepact-api-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --dimensions Name=FunctionName,Value=codepact-api \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# DynamoDB throttle alarm
aws cloudwatch put-metric-alarm \
  --alarm-name codepact-dynamo-throttle \
  --metric-name ThrottledRequests \
  --namespace AWS/DynamoDB \
  --dimensions Name=TableName,Value=codepact-projects \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# SQS DLQ alarm (failed evaluations)
aws cloudwatch put-metric-alarm \
  --alarm-name codepact-eval-failures \
  --metric-name ApproximateNumberOfMessagesVisible \
  --namespace AWS/SQS \
  --dimensions Name=QueueName,Value=codepact-eval-dlq.fifo \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

---

## 15. Cost Estimation

### Hackathon / Demo Scale (< 1000 requests/day)

| Service | Monthly Cost |
|---|---|
| Lambda (×2) | **$0** (free tier: 1M requests) |
| API Gateway | **$0** (free tier: 1M requests/month) |
| DynamoDB | **$0** (free tier: 25GB + 25 WCU/RCU) |
| SQS | **$0** (free tier: 1M requests) |
| Secrets Manager | **$1.60** (4 secrets × $0.40) |
| S3 | **$0.01** |
| CloudFront | **$0** (free tier: 1TB transfer) |
| **Total** | **~$2/month** |

### Production Scale (10,000 requests/day)

| Service | Monthly Cost |
|---|---|
| Lambda | **~$3** |
| API Gateway | **~$3** |
| DynamoDB | **~$5** (on-demand) |
| SQS | **~$1** |
| Secrets Manager | **$1.60** |
| S3 + CloudFront | **~$2** |
| **Total** | **~$16/month** |

---

## Summary: What to Use Instead of Redis

| Need | Use This | NOT This |
|---|---|---|
| Nonce/session caching | **DynamoDB + TTL** | Redis/ElastiCache |
| Rate limiting | **API Gateway throttling** | Redis INCR |
| Job queue | **SQS (FIFO)** | Redis Bull/Pub-Sub |
| Data storage | **DynamoDB** | Redis strings/hashes |
| Frontend CDN | **CloudFront** | — |
| All caching needs | **DynamoDB DAX** (add later) | ElastiCache Redis |

Redis only makes sense when you need sub-millisecond latency at massive scale. For CodePact, the fully serverless AWS stack is simpler, cheaper, and scales automatically.
