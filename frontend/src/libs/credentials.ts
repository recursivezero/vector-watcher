import { isTauri } from "@tauri-apps/api/core";
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
  if (!isTauri()) {
    throw new Error("Credential storage is only available in the Vector Watcher desktop application.");
  }
  const dataDir = await appLocalDataDir();
  const path = `${dataDir}/${STRONGHOLD_FILE}`;
  return path;
}

async function getStronghold(password: string): Promise<Stronghold> {
  if (stronghold && cachedClient) {
    return stronghold;
  }

  const path = await getStrongholdPath();

  const vault = await Stronghold.load(path, password);

  let client: Client;

  try {
    client = await vault.loadClient(CLIENT_NAME);
  } catch {
    client = await vault.createClient(CLIENT_NAME);
  }

  stronghold = vault;
  cachedClient = client;

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
    return;
  }

  if (unlockPromise) {
    return unlockPromise;
  }

  unlockPromise = (async () => {
    try {
      await getStronghold(password);
      localStorage.setItem(VAULT_INITIALIZED_KEY, "true");
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

  const client = requireCredentialClient();
  const store = client.getStore();
  const name = connectionName.trim();

  if (!name) {
    throw new Error("Connection name is required.");
  }

  const prefix = `connection/${name}`;
  const encoder = new TextEncoder();

  await Promise.all([
    store.insert(`${prefix}/accessKeyId`, Array.from(encoder.encode(credentials.accessKeyId))),
    store.insert(`${prefix}/secretAccessKey`, Array.from(encoder.encode(credentials.secretAccessKey))),
    store.insert(`${prefix}/sessionToken`, Array.from(encoder.encode(credentials.sessionToken))),
  ]);

  await stronghold.save();
}

export async function loadCredentials(connectionName: string): Promise<StoredCredentials | null> {
  const client = requireCredentialClient();
  const store = client.getStore();
  const name = connectionName.trim();

  if (!name) {
    throw new Error("Connection name is required.");
  }

  const prefix = `connection/${name}`;

  const [accessKeyId, secretAccessKey, sessionToken] = await Promise.all([
    store.get(`${prefix}/accessKeyId`),
    store.get(`${prefix}/secretAccessKey`),
    store.get(`${prefix}/sessionToken`),
  ]);

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  const decoder = new TextDecoder();

  const credentials: StoredCredentials = {
    accessKeyId: decoder.decode(accessKeyId),
    secretAccessKey: decoder.decode(secretAccessKey),
    sessionToken: sessionToken ? decoder.decode(sessionToken) : "",
  };

  return credentials;
}

export async function deleteCredentials(connectionName: string): Promise<void> {
  if (!stronghold) {
    throw new Error("Credential vault is locked.");
  }

  const client = requireCredentialClient();
  const store = client.getStore();
  const name = connectionName.trim();

  if (!name) {
    throw new Error("Connection name is required.");
  }

  const prefix = `connection/${name}`;

  try {
    await store.remove(`${prefix}/accessKeyId`);

    await store.remove(`${prefix}/secretAccessKey`);

    await store.remove(`${prefix}/sessionToken`);

    await stronghold.save();
  } catch (error) {
    console.error(`[Stronghold] Failed to delete credentials for "${name}":`, error);
    throw error;
  }
}
export async function lockCredentials(): Promise<void> {
  unlockPromise = null;

  const vault = stronghold;

  cachedClient = null;
  stronghold = null;

  if (vault) {
    await vault.unload();
  }
}
