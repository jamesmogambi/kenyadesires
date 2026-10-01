import fs from 'node:fs';
import path from 'node:path';
import { Auth, indexing_v3 } from 'googleapis';

export type IndexingAction = 'URL_UPDATED' | 'URL_DELETED';

/**
 * Google's daily quota for the Indexing API is 200 publish requests per project
 * per day. We self-impose a 195 ceiling so a single extra request cannot push
 * the project over and start returning 429s from Google for the rest of the day.
 */
export const DAILY_QUOTA_LIMIT = 200;
export const SAFE_DAILY_QUOTA = 195;

export type ServiceAccount = {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  token_uri?: string;
};

let cachedClient: Auth.JWT | null = null;

/**
 * Resolves the service account key. Order of precedence:
 *   1. GOOGLE_SERVICE_ACCOUNT_KEY_FILE — absolute or repo-root-relative path.
 *   2. GOOGLE_SERVICE_ACCOUNT_JSON   — the whole key document, inline.
 *   3. GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY — split pair.
 *
 * The downloaded key sits at the repo root (gitignored), so path 1 keeps the
 * private key out of every .env file.
 */
function loadServiceAccount(): ServiceAccount {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

  if (keyFile) {
    const resolved = path.isAbsolute(keyFile)
      ? keyFile
      : path.join(process.cwd(), keyFile);

    if (!fs.existsSync(resolved)) {
      throw new Error(
        `GOOGLE_SERVICE_ACCOUNT_KEY_FILE points to "${resolved}", which does not exist`,
      );
    }

    return JSON.parse(fs.readFileSync(resolved, 'utf8')) as ServiceAccount;
  }

  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    return JSON.parse(inline) as ServiceAccount;
  }

  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      'Google service account not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY_FILE ' +
        '(path to the downloaded JSON key), GOOGLE_SERVICE_ACCOUNT_JSON, or both ' +
        'GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.',
    );
  }

  return {
    type: 'service_account',
    client_email: email,
    // Env vars store the PEM with literal "\n" sequences because a raw newline
    // cannot survive a .env line.
    private_key: rawKey.replace(/\\n/g, '\n'),
    token_uri: 'https://oauth2.googleapis.com/token',
  };
}

/** Lazily builds and caches an authenticated client for the Indexing API scope. */
export function getGoogleAuthClient(): Auth.JWT {
  if (cachedClient) return cachedClient;

  const account = loadServiceAccount();

  if (!account.client_email || !account.private_key) {
    throw new Error(
      'Service account key is missing "client_email" or "private_key". ' +
        'Confirm the file is the full JSON key downloaded from Google Cloud.',
    );
  }

  if (!account.private_key.includes('PRIVATE KEY')) {
    throw new Error(
      'Service account "private_key" is malformed — it does not contain a PEM block.',
    );
  }

  const auth = new Auth.JWT({
    email: account.client_email,
    key: account.private_key.replace(/\\n/g, '\n'),
    keyId: account.private_key_id,
    scopes: ['https://www.googleapis.com/auth/indexing'],
    subject: account.client_email,
  });

  cachedClient = auth;
  return auth;
}

let cachedIndexing: indexing_v3.Indexing | null = null;

// googleapis ships the Indexing API as `indexing_v3` only; `google.indexing(...)`
// is the runtime shortcut for the same class but carries no types.
export function getIndexingClient(): indexing_v3.Indexing {
  if (!cachedIndexing) {
    cachedIndexing = new indexing_v3.Indexing({ auth: getGoogleAuthClient() });
  }
  return cachedIndexing;
}

/**
 * Sends one notification. Returns null on success, or an error string on
 * failure — Google responds 200 with an empty body when it accepts a request,
 * and rejects anything that is not a URL it owns or cannot verify.
 */
export async function publishUrlNotification(
  url: string,
  action: IndexingAction,
): Promise<string | null> {
  const client = getIndexingClient();

  try {
    await client.urlNotifications.publish({
      requestBody: {
        url,
        type: action === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED',
      },
    });
    return null;
  } catch (error) {
    const err = error as {
      code?: number | string;
      message?: string;
      errors?: Array<{ message?: string; reason?: string }>;
    };
    const detail = err.errors?.[0]?.message || err.message || 'Unknown error';
    const code = err.code !== undefined ? ` (${err.code})` : '';
    return `${detail}${code}`;
  }
}

/** Google throttles bursts; sleep between sequential publishes. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
