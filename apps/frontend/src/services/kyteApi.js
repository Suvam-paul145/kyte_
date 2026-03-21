import { signAuthNonce } from "./wallet";

const API_BASE_URL = process.env.NEXT_PUBLIC_KYTE_API_BASE_URL || "http://localhost:8000";

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
    throw new Error(payload.detail || "KYTE API request failed");
  }
  return payload;
}

export async function issueKyteToken(address) {
  // 1. Get nonce
  const { nonce } = await request(`/auth/nonce?wallet=${encodeURIComponent(address)}`);
  
  // 2. Sign nonce in frontend
  const signature = await signAuthNonce(address, nonce);
  
  if (!signature) {
    throw new Error("User rejected signing auth nonce");
  }
  
  // 3. Verify and get token
  const result = await request("/auth/verify", {
    method: "POST",
    body: {
      wallet: address,
      nonce: nonce,
      signature: JSON.stringify(signature), // Structuring it for the backend
      role: ["client", "developer"]
    },
  });
  
  return result.token;
}

export async function createProject(token, data) {
  return request("/project/create", { method: "POST", token, body: data });
}

export async function submitProject(token, data) {
  return request("/project/submit", { method: "POST", token, body: data });
}

export async function getProjectStatus(token, projectId) {
  return request(`/project/${projectId}/status`, { token });
}

export async function getProjectReport(token, projectId) {
  return request(`/project/${projectId}/report`, { token });
}
