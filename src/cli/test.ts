import { getConfigPath, readConfig } from "../utils/config.js";

export async function runCliTest(): Promise<void> {
  const saved = await readConfig();

  console.log("KYTE CLI test: OK");
  console.log(`Config file: ${getConfigPath()}`);
  console.log(`Logged in: ${saved ? "yes" : "no"}`);
  console.log('Try: kyte login');
  console.log('Try: kyte "create express server"');
}
