import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type SavedAuth = {
  token: string;
  user: {
    email: string;
    name?: string | null;
  };
};

const configDir = join(homedir(), ".kyte");
const configPath = join(configDir, "config.json");

export async function readConfig(): Promise<SavedAuth | null> {
  try {
    const raw = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw) as SavedAuth;
    if (!parsed?.token || !parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeConfig(data: SavedAuth): Promise<void> {
  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, JSON.stringify(data, null, 2), "utf-8");
}

export function getConfigPath(): string {
  return configPath;
}
