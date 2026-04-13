import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

interface AlertStateFile {
  version: number;
  updatedAt: string;
  entries: Record<string, number>;
}

const DEFAULT_ALERT_STATE_PATH = "/workspaces/codespaces-blank/CommunitySafeConnect/.data/alert-state.json";

function getAlertStatePath() {
  return process.env.ALERT_STATE_FILE_PATH || DEFAULT_ALERT_STATE_PATH;
}

async function loadState(): Promise<AlertStateFile> {
  const filePath = getAlertStatePath();

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as AlertStateFile;

    if (!parsed || typeof parsed !== "object" || typeof parsed.entries !== "object") {
      return { version: 1, updatedAt: new Date().toISOString(), entries: {} };
    }

    return parsed;
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), entries: {} };
  }
}

async function saveState(state: AlertStateFile) {
  const filePath = getAlertStatePath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
}

export async function getAlertLastEmittedAt(key: string) {
  const state = await loadState();
  return state.entries[key] || 0;
}

export async function setAlertLastEmittedAt(key: string, timestamp: number) {
  const state = await loadState();
  state.entries[key] = timestamp;
  state.updatedAt = new Date().toISOString();
  await saveState(state);
}
