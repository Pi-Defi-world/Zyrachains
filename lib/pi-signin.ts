'use client';

const PI_AUTH_URL = 'https://accounts.pinet.com/oauth/authorize';
const PI_API_BASE = 'https://api.minepi.com/v2';

export interface PiSignInConfig {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
}

export interface PiSignInUser {
  uid: string;
  username: string;
  wallet_address?: string;
}

function generateState(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

export function buildSignInUrl(config: PiSignInConfig): { url: string; state: string } {
  const state = generateState();
  const scopes = config.scopes?.join(' ') || 'username';
  const params = new URLSearchParams({
    response_type: 'token',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: scopes,
    state,
  });
  return { url: `${PI_AUTH_URL}?${params.toString()}`, state };
}

export function parseCallbackFragment(hash: string): { accessToken?: string; state?: string; error?: string } {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(fragment);
  const error = params.get('error');
  if (error) return { error };
  return {
    accessToken: params.get('access_token') || undefined,
    state: params.get('state') || undefined,
  };
}

export async function fetchPiUser(accessToken: string): Promise<PiSignInUser> {
  const res = await fetch(`${PI_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Pi API error: ${res.status}`);
  const data = await res.json();
  return {
    uid: data.user_uid || data.uid,
    username: data.username,
    wallet_address: data.wallet_address,
  };
}

export function getSignInClientId(): string {
  if (typeof window === 'undefined') return '';
  return process.env.NEXT_PUBLIC_PI_SIGNIN_CLIENT_ID || '';
}

export function getSignInRedirectUri(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/signin/callback`;
}

export function initiatePiSignIn(): void {
  const clientId = getSignInClientId();
  if (!clientId) {
    console.error('Pi Sign-In client ID not configured');
    return;
  }
  const redirectUri = getSignInRedirectUri();
  const { url, state } = buildSignInUrl({ clientId, redirectUri });
  sessionStorage.setItem('pi_oauth_state', state);
  window.location.href = url;
}
