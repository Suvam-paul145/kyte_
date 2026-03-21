import { signAuthNonce } from "./wallet";

const API_BASE_URL = import.meta.env.VITE_KYTE_API_BASE_URL || "http://localhost:8000";

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

import { supabase } from '../supabaseClient';

export async function createProject(token, data) {
  // Edge Function expects: action: 'create', geminiApiKey: data.geminiApiKey, data: {title, ...}
  const { data: result, error } = await supabase.functions.invoke('gemini-audit', {
    body: {
      action: 'create',
      geminiApiKey: data.geminiApiKey,
      data: data
    }
  });
  
  if (error) throw new Error(error.message || "Failed to create project");
  if (result && result.error) throw new Error(result.error);
  return result;
}

export async function submitProject(token, data) {
  // Edge Function expects: action: 'submit', geminiApiKey: data.geminiApiKey, data: {projectId, githubUrl}
  const { data: result, error } = await supabase.functions.invoke('gemini-audit', {
    body: {
      action: 'submit',
      geminiApiKey: data.geminiApiKey,
      data: data
    }
  });

  if (error) throw new Error(error.message || "Failed to submit project");
  if (result && result.error) throw new Error(result.error);
  return result;
}

export async function getProjectStatus(token, projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single();
    
  if (error) throw error;
  return data;
}

export async function getProjectReport(token, projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('evaluation_result')
    .eq('id', projectId)
    .single();
    
  if (error) throw error;
  return data;
}

