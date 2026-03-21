import { postJson } from "../utils/http.js";

const API_BASE_URL = process.env.KYTE_API_URL || "http://localhost:4000";

export async function handleCommand(task: string): Promise<void> {
  const trimmedTask = task.trim();

  if (!trimmedTask) {
    console.log("Please provide a task.");
    return;
  }

  const response = await postJson(`${API_BASE_URL}/cli/execute`, {
    task: trimmedTask,
  });

  if (response.status === 401) {
    console.log('You are not logged in. Run: kyte login');
    return;
  }

  if (!response.ok) {
    console.log("Command failed.");
    return;
  }

  const data = (await response.json()) as { message?: string };
  console.log(data.message || `Received task: ${trimmedTask}`);
}
