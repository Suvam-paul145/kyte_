export type AuthStatus = "pending" | "approved";

export type AuthRecord = {
  code: string;
  status: AuthStatus;
  user: { email: string; name?: string | null } | null;
  token: string | null;
  createdAt: number;
};

const store = new Map<string, AuthRecord>();

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createPendingCode(): AuthRecord {
  let code = generateCode();
  while (store.has(code)) {
    code = generateCode();
  }

  const record: AuthRecord = {
    code,
    status: "pending",
    user: null,
    token: null,
    createdAt: Date.now(),
  };

  store.set(code, record);
  return record;
}

export function getRecord(code: string): AuthRecord | undefined {
  return store.get(code);
}

export function markApproved(
  code: string,
  user: { email: string; name?: string | null },
  token: string
): AuthRecord | null {
  const record = store.get(code);
  if (!record) return null;

  const updated: AuthRecord = {
    ...record,
    status: "approved",
    user,
    token,
  };

  store.set(code, updated);
  return updated;
}
