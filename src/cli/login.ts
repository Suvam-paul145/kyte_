import open from "open";
import { saveAuth } from "../core/auth.js";
import { getConfigPath } from "../utils/config.js";
import { postJson } from "../utils/http.js";

const API_BASE_URL = process.env.KYTE_API_URL || "http://localhost:4000";

type StartResponse = {
  user_code: string;
  verification_url: string;
};

type CheckPendingResponse = {
  status: "pending";
};

type CheckApprovedResponse = {
  status: "approved";
  token: string;
  user: {
    email: string;
    name?: string | null;
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runLogin(): Promise<void> {
  const inquirer = (await import("inquirer")).default;
  
  const { loginMethod } = await inquirer.prompt([
    {
      type: "list",
      name: "loginMethod",
      message: "How would you like to log in?",
      choices: [
        { name: "Default Browser (Recommended)", value: "default" },
        { name: "Sign in with Google", value: "google" }
      ],
    }
  ]);

  const startResponse = await postJson(`${API_BASE_URL}/auth/start`, {
    provider: loginMethod === "google" ? "google" : undefined
  });
  
  if (!startResponse.ok) {
    throw new Error("Failed to start login flow.");
  }

  const startData = (await startResponse.json()) as StartResponse;
  const code = startData.user_code;
  const verificationUrl = startData.verification_url;

  console.log(`\nOpening your browser to link the CLI...`);
  console.log(`URL: ${verificationUrl}`);
  
  if (loginMethod === "default") {
    console.log(`Code: ${code} (should auto-fill)\n`);
  }

  await open(verificationUrl);

  for (;;) {
    await sleep(3000);

    const checkResponse = await postJson(`${API_BASE_URL}/auth/check`, { code });
    if (!checkResponse.ok) {
      continue;
    }

    const payload = (await checkResponse.json()) as CheckPendingResponse | CheckApprovedResponse;

    if (payload.status === "pending") {
      continue;
    }

    await saveAuth({
      token: payload.token,
      user: payload.user,
    });

    console.log("Logged in successfully");
    console.log(`User: ${payload.user.email}`);
    console.log(`Token saved: ${getConfigPath()}`);
    return;
  }
}
