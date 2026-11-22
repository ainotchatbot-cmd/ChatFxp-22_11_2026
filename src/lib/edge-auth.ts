import { isModularOAuthToken, verifyModularOAuthToken } from './oauth-server.ts';
import type { OAuthEnvConfig } from './oauth-server.ts';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface JsonWebKeyWithMeta extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
}

export interface EdgeDecodedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  aud: string;
  iss: string;
  sub: string;
  exp: number;
  iat: number;
}

let cachedKeys: Map<string, CryptoKey> = new Map();
let keysExpiresAt = 0;

function base64UrlToUint8Array(input: string): Uint8Array<ArrayBuffer> {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJwtSegment<T>(segment: string): T {
  const bytes = base64UrlToUint8Array(segment);
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as T;
}

async function fetchFirebasePublicKeys(forceRefresh = false): Promise<Map<string, CryptoKey>> {
  const now = Date.now();
  if (!forceRefresh && cachedKeys.size > 0 && now < keysExpiresAt) {
    return cachedKeys;
  }

  const res = await fetch(FIREBASE_JWKS_URL);
  if (!res.ok) {
    throw new Error(`Unable to fetch Firebase public JWKs (${res.status}).`);
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;

  const body = (await res.json()) as { keys?: JsonWebKeyWithMeta[] };
  const nextKeys = new Map<string, CryptoKey>();

  for (const jwk of body.keys || []) {
    if (!jwk.kid) continue;
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    nextKeys.set(jwk.kid, key);
  }

  cachedKeys = nextKeys;
  keysExpiresAt = now + Math.max(60, maxAgeSeconds) * 1000;
  return cachedKeys;
}

export async function verifyEdgeFirebaseToken(
  idToken: string,
  expectedProjectId = firebaseConfig.projectId
): Promise<EdgeDecodedFirebaseToken> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Firebase JWT.');
  }

  const [headerSeg, payloadSeg, sigSeg] = parts;
  const header = decodeJwtSegment<{ alg?: string; kid?: string }>(headerSeg);
  const payload = decodeJwtSegment<Record<string, unknown>>(payloadSeg);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported Firebase token algorithm.');
  }

  let keys = await fetchFirebasePublicKeys(false);
  let publicKey = keys.get(header.kid);
  if (!publicKey) {
    keys = await fetchFirebasePublicKeys(true);
    publicKey = keys.get(header.kid);
  }
  if (!publicKey) {
    throw new Error('Unknown Firebase signing key.');
  }

  const signedBytes = new TextEncoder().encode(`${headerSeg}.${payloadSeg}`);
  const signatureBytes = base64UrlToUint8Array(sigSeg);
  const validSig = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    signatureBytes,
    signedBytes
  );
  if (!validSig) {
    throw new Error('Invalid Firebase token signature.');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const aud = String(payload.aud || '');
  const iss = String(payload.iss || '');
  const sub = String(payload.sub || '');
  const exp = Number(payload.exp || 0);
  const iat = Number(payload.iat || 0);

  if (aud !== expectedProjectId) {
    throw new Error('Firebase token audience mismatch.');
  }
  if (iss !== `https://securetoken.google.com/${expectedProjectId}`) {
    throw new Error('Firebase token issuer mismatch.');
  }
  if (!sub || sub.length > 128) {
    throw new Error('Firebase token subject missing.');
  }
  if (!Number.isFinite(exp) || exp <= nowSeconds) {
    throw new Error('Firebase token expired.');
  }
  if (!Number.isFinite(iat) || iat > nowSeconds + 300) {
    throw new Error('Firebase token issued-at timestamp is invalid.');
  }

  return {
    uid: sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    aud,
    iss,
    sub,
    exp,
    iat,
  };
}

export async function verifyUnifiedEdgeToken(
  token: string,
  oauthEnv?: OAuthEnvConfig,
  expectedProjectId = firebaseConfig.projectId
): Promise<EdgeDecodedFirebaseToken> {
  if (isModularOAuthToken(token)) {
    const decoded = await verifyModularOAuthToken(token, oauthEnv);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      aud: 'chatfxp-oauth',
      iss: `oauth:${decoded.provider}`,
      sub: decoded.uid,
      exp: decoded.exp,
      iat: decoded.iat,
    };
  }
  return verifyEdgeFirebaseToken(token, expectedProjectId);
}
