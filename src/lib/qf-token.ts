/**
 * Quran Foundation API Token Manager
 *
 * Uses OAuth2 Client Credentials flow:
 * - POST to oauth2/token endpoint with HTTP Basic Auth
 * - Client ID as username, Client Secret as password
 * - Body: grant_type=client_credentials&scope=content
 * - Returns access_token valid for 3600 seconds
 *
 * Token cached in memory with refresh ~30s before expiry.
 * Concurrent requests coalesced into single in-flight fetch.
 */

const QF_CLIENT_ID = process.env.QF_CLIENT_ID!;
const QF_CLIENT_SECRET = process.env.QF_CLIENT_SECRET!;
const QF_OAUTH_URL = process.env.QF_OAUTH_URL!;
const SAFETY_BUFFER_MS = 30000;
const TOKEN_LIFETIME_MS = 3600 * 1000;

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
let pendingTokenPromise: Promise<string> | null = null;

export function clearCachedToken(): void {
  cachedToken = null;
  tokenExpiry = null;
  pendingTokenPromise = null;
}

function getBasicAuthHeader(): string {
  const credentials = Buffer.from(`${QF_CLIENT_ID}:${QF_CLIENT_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

async function fetchNewToken(): Promise<string> {
  if (!QF_CLIENT_ID || !QF_CLIENT_SECRET || !QF_OAUTH_URL) {
    throw new Error('Missing QF OAuth configuration. Check QF_CLIENT_ID, QF_CLIENT_SECRET, QF_OAUTH_URL');
  }

  const response = await fetch(`${QF_OAUTH_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': getBasicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=content',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch QF token: ${response.status} ${errorText}`);
  }

  const data: TokenResponse = await response.json();

  if (!data.access_token) {
    throw new Error('No access_token in OAuth response');
  }

  return data.access_token;
}

export async function getQFToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && tokenExpiry && now < tokenExpiry - SAFETY_BUFFER_MS) {
    return cachedToken;
  }

  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async () => {
    try {
      cachedToken = await fetchNewToken();
      tokenExpiry = now + TOKEN_LIFETIME_MS;
      return cachedToken;
    } finally {
      pendingTokenPromise = null;
    }
  })();

  return pendingTokenPromise;
}