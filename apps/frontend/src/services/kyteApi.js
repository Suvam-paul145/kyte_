/**
 * kyteApi.js — KYTE backend API client.
 *
 * Wraps all HTTP calls to the FastAPI backend (http://localhost:8000).
 */

import { signAuthNonce } from "./wallet";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_KYTE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `KYTE API error (${response.status})`);
  }
  return payload;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Authenticate a Pera Wallet address with the backend.
 * Fetches a nonce, signs it via Pera, then exchanges for a JWT token.
 *
 * @param {string} address - Connected Algorand wallet address
 * @returns {Promise<string>} JWT token
 */
export async function issueKyteToken(address) {
  // 1. Get nonce
  const { nonce } = await request(
    `/auth/nonce?wallet=${encodeURIComponent(address)}`
  );

  // 2. Sign nonce in browser via Pera Wallet
  const signature = await signAuthNonce(address, nonce);
  if (!signature) {
    throw new Error("User rejected signing auth nonce");
  }

  // 3. Verify & get JWT
  const result = await request("/auth/verify", {
    method: "POST",
    body: {
      wallet: address,
      nonce: nonce,
      // Encode signature as base64 for transport
      signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
      role: ["client", "developer"],
    },
  });

  return result.token;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

/**
 * Create a new project on the backend.
 *
 * @param {string} token - JWT from issueKyteToken()
 * @param {object} data  - Project data. Include `app_id` if deployed on-chain via Pera Wallet.
 * @param {string} data.title
 * @param {string} data.description
 * @param {string[]} data.requirements
 * @param {number} data.payment_algo
 * @param {number} [data.score_threshold]
 * @param {number} [data.app_id]  - Real on-chain Algorand app ID (from deployKyteContract)
 */
export async function createProject(token, data) {
  return request("/project/create", { method: "POST", token, body: data });
}

/**
 * Submit work for a project (developer role).
 *
 * @param {string} token - JWT
 * @param {object} data  - { project_id, submission_url }
 */
export async function submitProject(token, data) {
  return request("/project/submit", { method: "POST", token, body: data });
}

/**
 * Get the current status of a project.
 *
 * @param {string} token     - JWT
 * @param {string} projectId - Project UUID
 */
export async function getProjectStatus(token, projectId) {
  return request(`/project/${projectId}/status`, { token });
}

/**
 * Get the evaluation report for a project.
 *
 * @param {string} token     - JWT
 * @param {string} projectId - Project UUID
 */
export async function getProjectReport(token, projectId) {
  return request(`/project/${projectId}/report`, { token });
}

// ─── Blockchain ────────────────────────────────────────────────────────────────

/**
 * Fetch compiled TEAL programs from the backend.
 * Mainly used internally by algorandDeploy.js.
 */
export async function getCompiledContract() {
  return request("/contract/compile");
}
