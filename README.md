# Kyte

> **Trustless dev-client contracts. AI-enforced. Algorand-settled.**
> No middleman. No trust required. Code either works or payment doesn't move.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Network: Algorand TestNet](https://img.shields.io/badge/Network-Algorand%20TestNet-00D4AA.svg)](https://testnet.algoexplorer.io)
[![AI: Gemini 1.5 Flash](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-4285F4.svg)](https://ai.google.dev)
[![Stack: FastAPI + React](https://img.shields.io/badge/Stack-FastAPI%20%2B%20React-009688.svg)](#tech-stack)

---

## 🚀 What is Kyte?

Kyte is a decentralized platform that automates the relationship between developers and clients. By combining **Algorand Smart Contracts** with **AI-powered code auditing**, we ensure that payments are only released when the code meets the predefined requirements.

### The Problem
Traditional freelancing depends on trust or expensive escrow services. Disputes over "code quality" often lead to payment delays or unfair chargebacks.

### The Solution
1. **Client** locks ALGO into a smart contract with specific requirements.
2. **Developer** submits their work via GitHub.
3. **Gemini AI** audits the submission against the requirements.
4. If it passes, the **Smart Contract** automatically releases funds. No human intervention needed.

---

## ✨ Core Features

- 💎 **Luminal Frontier UI**: A high-fidelity, immersive experience built for modern developers.
- 🔐 **Algorand Escrow**: Secure, trustless payment handling on the Algorand TestNet.
- 🤖 **AI-Enforced Policies**: Real-time auditing using Gemini 1.5 Flash to verify logic and security.
- 💳 **Pera Wallet Integration**: Seamless wallet connection and transaction signing.
- 🔍 **Real-time Evaluation**: Interactive animations and confetti-feedback upon pass/fail.

---

## 🛠 Tech Stack

- **Blockchain**: Algorand (PyTeal, algosdk, Pera Wallet)
- **Backend**: FastAPI (Python), Uvicorn, Jose (JWT)
- **AI Engine**: Google Gemini 1.5 Flash
- **Frontend**: React, Vite, Framer Motion, Zustand
- **Database**: Supabase (Auth/Google Sign-In)

---

## 🏁 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Python 3.12+
- Algorand Pera Wallet (on TestNet)

### 2. Installation
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Environment Setup
Create a `.env` in the root:
```env
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_KYTE_API_BASE_URL="http://localhost:8000"
```

Create a `backend/.env` using the provided `.env.example`.

### 4. Running the Project
**Terminal 1 (Backend):**
```bash
cd backend
python main.py
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

---

## 🛡 Security & Audit
Kyte uses an **AI Oracle** to bridge the gap between GitHub and the Algorand blockchain. The AI's evaluation is cryptographically signed before being submitted to the smart contract, ensuring the integrity of the release process.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

--
Built with ⚡ by the Kyte Team.
