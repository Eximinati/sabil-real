const OAUTH_STATE_COOKIE = 'oauth-state';

export function generateOAuthState(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function storeOAuthStateClient(state: string): void {
  document.cookie = `${OAUTH_STATE_COOKIE}=${state}; path=/; max-age=600; samesite=strict; secure=${location.protocol === 'https:'}`;
}

export function clearOAuthStateClient(): void {
  document.cookie = `${OAUTH_STATE_COOKIE}=; path=/; max-age=0; samesite=strict`;
}
