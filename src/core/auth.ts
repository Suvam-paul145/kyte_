import { readConfig, SavedAuth, writeConfig } from "../utils/config.js";

export async function getSavedAuth(): Promise<SavedAuth | null> {
  return readConfig();
}

export async function saveAuth(auth: SavedAuth): Promise<void> {
  await writeConfig(auth);
}
