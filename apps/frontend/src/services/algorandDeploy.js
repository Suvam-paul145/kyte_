/**
 * algorandDeploy.js
 *
 * Handles deploying the Kyte smart contract to Algorand TestNet
 * directly from the browser using Pera Wallet for signing.
 *
 * Flow:
 *   1. Fetch compiled TEAL bytes from backend  (/contract/compile)
 *   2. Build ApplicationCreateTxn via algosdk (in browser)
 *   3. Sign with Pera Wallet  (user approves in Pera mobile/web)
 *   4. Submit signed txn to Algorand TestNet
 *   5. Wait for confirmation → return app_id
 *
 * No private key ever touches the backend — the user's wallet signs everything.
 */

import algosdk from "algosdk";
import { getPeraWallet } from "./wallet";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_KYTE_API_BASE_URL || "http://localhost:8000";

const ALGOD_SERVER =
  process.env.NEXT_PUBLIC_ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT = parseInt(process.env.NEXT_PUBLIC_ALGOD_PORT || "443", 10);
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";

// ─── Algod client (TestNet) ─────────────────────────────────────────────────

function getAlgodClient() {
  return new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
}

// ─── Fetch compiled TEAL from backend ────────────────────────────────────────

async function fetchCompiledContract() {
  const response = await fetch(`${API_BASE_URL}/contract/compile`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch compiled contract from backend");
  }
  return response.json();
  // Returns: { approval_b64, clear_b64, suggested_params, network, algod_address }
}

// ─── Wait for transaction confirmation ───────────────────────────────────────

async function waitForConfirmation(algodClient, txId, maxRounds = 10) {
  const status = await algodClient.status().do();
  let lastRound = status["last-round"];

  for (let i = 0; i < maxRounds; i++) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();

    if (
      pendingInfo["confirmed-round"] !== null &&
      pendingInfo["confirmed-round"] > 0
    ) {
      return pendingInfo;
    }

    if (pendingInfo["pool-error"]) {
      throw new Error(`Transaction pool error: ${pendingInfo["pool-error"]}`);
    }

    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
  }

  throw new Error(`Transaction ${txId} not confirmed after ${maxRounds} rounds`);
}

// ─── Main deploy function ─────────────────────────────────────────────────────

/**
 * Deploy the Kyte contract to TestNet via Pera Wallet.
 *
 * @param {string} walletAddress  - Connected Pera Wallet address
 * @param {number} paymentAlgo    - Amount in ALGO to lock (stored as microALGO in contract)
 * @returns {Promise<number>}     - Algorand App ID of the deployed contract
 */
export async function deployKyteContract(walletAddress, paymentAlgo = 0) {
  const peraWallet = getPeraWallet();

  if (!peraWallet) {
    throw new Error("Pera Wallet is not initialized. Please connect your wallet first.");
  }

  // 1. Fetch compiled contract bytes from backend
  console.log("[Deploy] Fetching compiled TEAL from backend...");
  const { approval_b64, clear_b64 } = await fetchCompiledContract();

  // Decode base64 → Uint8Array
  const approvalBytes = Uint8Array.from(atob(approval_b64), (c) => c.charCodeAt(0));
  const clearBytes = Uint8Array.from(atob(clear_b64), (c) => c.charCodeAt(0));

  // 2. Get suggested params from algod
  const algodClient = getAlgodClient();
  console.log("[Deploy] Fetching suggested params from algod...");
  const suggestedParams = await algodClient.getTransactionParams().do();

  // Convert ALGO → microALGO, encode as 8-byte big-endian
  const microAlgo = Math.round(paymentAlgo * 1_000_000);
  const amountBytes = new Uint8Array(8);
  const dataView = new DataView(amountBytes.buffer);
  dataView.setBigUint64(0, BigInt(microAlgo), false); // big-endian

  // 3. Build ApplicationCreateTxn
  console.log("[Deploy] Building ApplicationCreateTxn...");
  const txn = algosdk.makeApplicationCreateTxnFromObject({
    sender: walletAddress,
    suggestedParams,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: approvalBytes,
    clearProgram: clearBytes,
    numLocalInts: 0,
    numLocalByteSlices: 0,
    numGlobalInts: 4,
    numGlobalByteSlices: 3,
    appArgs: [amountBytes],
  });

  // 4. Sign with Pera Wallet
  console.log("[Deploy] Requesting Pera Wallet signature...");
  const txnsToSign = [
    {
      txn: txn,
      signers: [walletAddress],
    },
  ];

  let signedTxns;
  try {
    signedTxns = await peraWallet.signTransaction([txnsToSign]);
  } catch (e) {
    if (e?.data?.type === "SIGN_TRANSACTIONS_MODAL_CLOSED") {
      throw new Error("User cancelled the transaction signing.");
    }
    throw new Error(`Pera Wallet signing failed: ${e?.message || e}`);
  }

  // signedTxns is an array of Uint8Array
  const signedTxn = signedTxns[0];

  // 5. Submit to network
  console.log("[Deploy] Submitting transaction to TestNet...");
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  console.log(`[Deploy] TX submitted: ${txId}`);

  // 6. Wait for confirmation
  console.log("[Deploy] Waiting for confirmation...");
  const receipt = await waitForConfirmation(algodClient, txId, 10);

  const appId = receipt["application-index"];
  console.log(`[Deploy] ✅ Contract deployed! App ID: ${appId}`);
  console.log(`[Deploy] Explorer: https://testnet.algoexplorer.io/application/${appId}`);

  return appId;
}

/**
 * Get current Algorand TestNet status (useful for health checks).
 */
export async function getAlgorandStatus() {
  try {
    const algodClient = getAlgodClient();
    const status = await algodClient.status().do();
    return { ok: true, lastRound: status["last-round"] };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
