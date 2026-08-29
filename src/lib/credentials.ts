import { appLocalDataDir } from "@tauri-apps/api/path";
import { Stronghold, type Client } from "@tauri-apps/plugin-stronghold";

export interface StoredCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

const CLIENT_NAME = "vector-watcher";
const STRONGHOLD_FILE = "credentials.hold";
const VAULT_INITIALIZED_KEY = "vector-watcher:credential-vault";

let stronghold: Stronghold | null = null;
let cachedClient: Client | null = null;
let unlockPromise: Promise<void> | null = null;

export function isCredentialVaultInitialized(): boolean {
  return localStorage.getItem(VAULT_INITIALIZED_KEY) === "true";
}

async function getStrongholdPath(): Promise<string> {
  const start = performance.now();
  console.log("[Stronghold] Getting app data directory");
  const dataDir = await appLocalDataDir();
  console.log(`[Stronghold] appLocalDataDir: ${(performance.now() - start).toFixed(0)}ms`);
  const path = `${dataDir}/${STRONGHOLD_FILE}`;
  console.log("[Stronghold] Vault path:", path);
  return path;
}

async function getStronghold(password: string): Promise<Stronghold> {
  if (stronghold && cachedClient) {
    console.log("[Stronghold] Using already unlocked vault");
    return stronghold;
  }

  const totalStart = performance.now();
  const path = await getStrongholdPath();

  console.log("[Stronghold] Loading vault...");
  const loadStart = performance.now();
  const vault = await Stronghold.load(path, password);

  console.log(`[Stronghold] Stronghold.load: ${(performance.now() - loadStart).toFixed(0)}ms`);

  const clientStart = performance.now();
  let client: Client;

  try {
    client = await vault.loadClient(CLIENT_NAME);
    console.log(`[Stronghold] loadClient: ${(performance.now() - clientStart).toFixed(0)}ms`);
  } catch {
    console.log("[Stronghold] Client not found, creating client...");
    client = await vault.createClient(CLIENT_NAME);
    console.log(`[Stronghold] createClient: ${(performance.now() - clientStart).toFixed(0)}ms`);
  }

  stronghold = vault;
  cachedClient = client;

  console.log(`[Stronghold] TOTAL INITIALIZATION: ${(performance.now() - totalStart).toFixed(0)}ms`);

  return vault;
}

function requireCredentialClient(): Client {
  if (!stronghold || !cachedClient) {
    throw new Error("Credential vault is locked.");
  }

  return cachedClient;
}

export async function unlockCredentials(password: string): Promise<void> {
  if (stronghold && cachedClient) {
    console.log("[Stronghold] Vault already unlocked");
    return;
  }

  if (unlockPromise) {
    console.log("[Stronghold] Waiting for existing unlock operation");
    return unlockPromise;
  }

  unlockPromise = (async () => {
    const unlockStart = performance.now();

    try {
      console.log("[Stronghold] Starting credential unlock");
      await getStronghold(password);
      localStorage.setItem(VAULT_INITIALIZED_KEY, "true");
      console.log(`[Stronghold] Credential unlock complete: ${(performance.now() - unlockStart).toFixed(0)}ms`);
    } catch (error) {
      cachedClient = null;
      stronghold = null;
      console.error("[Stronghold] Credential unlock failed:", error);
      throw error;
    } finally {
      unlockPromise = null;
    }
  })();

  return unlockPromise;
}

export async function saveCredentials(connectionName: string, credentials: StoredCredentials): Promise<void> {
  if (!stronghold) {
    throw new Error("Credential vault is locked.");
  }

  const saveStart = performance.now();
  const client = requireCredentialClient();
  const store = client.getStore();
  const name = connectionName.trim();

  if (!name) {
    throw new Error("Connection name is required.");
  }

  const prefix = `connection/${name}`;
  const encoder = new TextEncoder();

  console.log(`[Stronghold] Saving credentials for "${name}"`);

  await Promise.all([
    store.insert(`${prefix}/accessKeyId`, Array.from(encoder.encode(credentials.accessKeyId))),
    store.insert(`${prefix}/secretAccessKey`, Array.from(encoder.encode(credentials.secretAccessKey))),
    store.insert(`${prefix}/sessionToken`, Array.from(encoder.encode(credentials.sessionToken))),
  ]);

  const vaultSaveStart = performance.now();
  await stronghold.save();

  console.log(`[Stronghold] Vault save: ${(performance.now() - vaultSaveStart).toFixed(0)}ms`);
  console.log(`[Stronghold] Save credentials TOTAL: ${(performance.now() - saveStart).toFixed(0)}ms`);
}

export async function loadCredentials(connectionName: string): Promise<StoredCredentials | null> {
  const loadStart = performance.now();
  const client = requireCredentialClient();
  const store = client.getStore();
  const name = connectionName.trim();

  if (!name) {
    throw new Error("Connection name is required.");
  }

  const prefix = `connection/${name}`;

  console.log(`[Stronghold] Loading credentials for "${name}"`);

  const [accessKeyId, secretAccessKey, sessionToken] = await Promise.all([
    store.get(`${prefix}/accessKeyId`),
    store.get(`${prefix}/secretAccessKey`),
    store.get(`${prefix}/sessionToken`),
  ]);

  if (!accessKeyId || !secretAccessKey) {
    console.log(`[Stronghold] Credentials not found: ${(performance.now() - loadStart).toFixed(0)}ms`);
    return null;
  }

  const decoder = new TextDecoder();

  const credentials: StoredCredentials = {
    accessKeyId: decoder.decode(accessKeyId),
    secretAccessKey: decoder.decode(secretAccessKey),
    sessionToken: sessionToken ? decoder.decode(sessionToken) : "",
  };

  console.log(`[Stronghold] Load credentials TOTAL: ${(performance.now() - loadStart).toFixed(0)}ms`);

  return credentials;
}

export async function deleteCredentials(connectionName: string): Promise<void> {
  if (!stronghold) {
    throw new Error("Credential vault is locked.");
  }

  const deleteStart = performance.now();
  const client = requireCredentialClient();
  const store = client.getStore();
  const name = connectionName.trim();

  if (!name) {
    throw new Error("Connection name is required.");
  }

  const prefix = `connection/${name}`;

  console.log(`[Stronghold] Deleting credentials for "${name}"`);

  await Promise.all([
    store.remove(`${prefix}/accessKeyId`),
    store.remove(`${prefix}/secretAccessKey`),
    store.remove(`${prefix}/sessionToken`),
  ]);

  const vaultSaveStart = performance.now();
  await stronghold.save();

  console.log(`[Stronghold] Vault save after delete: ${(performance.now() - vaultSaveStart).toFixed(0)}ms`);
  console.log(`[Stronghold] Delete credentials TOTAL: ${(performance.now() - deleteStart).toFixed(0)}ms`);
}

export async function lockCredentials(): Promise<void> {
  console.log("[Stronghold] Locking credential vault");

  unlockPromise = null;

  const vault = stronghold;

  cachedClient = null;
  stronghold = null;

  if (vault) {
    const unloadStart = performance.now();
    await vault.unload();
    console.log(`[Stronghold] Vault unloaded: ${(performance.now() - unloadStart).toFixed(0)}ms`);
  }
}
