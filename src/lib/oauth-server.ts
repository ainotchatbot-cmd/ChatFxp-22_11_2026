import type { AuthProviderKind, OAuthProviderDescriptor } from '../types';
import { getOAuthProviderModule, OAUTH_PROVIDER_MODULES } from './oauth-registry.ts';

export interface OAuthEnvConfig {
  APP_URL?: string;
  SITE_ORIGIN?: string;
  OAUTH_SESSION_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
}

export interface NormalizedOAuthProfile {
  provider: AuthProviderKind;
  providerUserId: string;
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface DecodedModularOAuthToken {
  tokenType: 'chatfxp_oauth';
  uid: string;
  provider: AuthProviderKind;
  email: string;
  name?: string;
  picture?: string;
  iat: number;
  exp: number;
}

let runtimeEphemeralOAuthSecret: string | null = null;

function getOAuthSigningSecret(envConfig?: OAuthEnvConfig): string {
  const configured =
    envConfig?.OAUTH_SESSION_SECRET ||
    (typeof process !== 'undefined' && process.env ? process.env.OAUTH_SESSION_SECRET : undefined);
  if (configured && configured.trim().length >= 16) {
    return configured.trim();
  }
  if (!runtimeEphemeralOAuthSecret) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    runtimeEphemeralOAuthSecret = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return runtimeEphemeralOAuthSecret;
}

export function readProcessOAuthEnv(): OAuthEnvConfig {
  const p = typeof process !== 'undefined' && process.env ? process.env : {};
  return {
    APP_URL: p.APP_URL,
    SITE_ORIGIN: p.SITE_ORIGIN,
    OAUTH_SESSION_SECRET: p.OAUTH_SESSION_SECRET,
    GITHUB_CLIENT_ID: p.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: p.GITHUB_CLIENT_SECRET,
    DISCORD_CLIENT_ID: p.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: p.DISCORD_CLIENT_SECRET,
  };
}

function getEnvValue(envConfig: OAuthEnvConfig, key: string): string | undefined {
  const fromConfig = (envConfig as Record<string, string | undefined>)[key];
  if (fromConfig && fromConfig.trim()) return fromConfig.trim();
  if (typeof process !== 'undefined' && process.env) {
    const fromProc = process.env[key];
    if (fromProc && fromProc.trim()) return fromProc.trim();
  }
  return undefined;
}

export function getOAuthProvidersStatus(envConfig: OAuthEnvConfig = readProcessOAuthEnv()): OAuthProviderDescriptor[] {
  return OAUTH_PROVIDER_MODULES.map((mod) => {
    let configured = mod.id === 'google';
    if (mod.strategy === 'oauth2_popup' && mod.oauth2) {
      const clientId = getEnvValue(envConfig, mod.oauth2.clientIdEnvKey);
      const clientSecret = getEnvValue(envConfig, mod.oauth2.clientSecretEnvKey);
      configured = Boolean(clientId && clientSecret);
    } else if (mod.id === 'apple' || mod.id === 'facebook') {
      // Apple and Facebook can be enabled in Firebase Authentication Console cleanly
      configured = false;
    }

    return {
      id: mod.id,
      labelHe: mod.labelHe,
      labelEn: mod.labelEn,
      strategy: mod.strategy,
      configured,
      callbackPath: mod.callbackPath,
      badgeHe: mod.badgeHe,
      badgeEn: mod.badgeEn,
    };
  });
}

function isAllowedOriginUrl(raw?: string | null): string | null {
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host.endsWith('.run.app') ||
      host.endsWith('.workers.dev') ||
      host === 'chatfxp.com' ||
      host === 'www.chatfxp.com' ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return `${parsed.protocol}//${parsed.host}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveOAuthBaseUrl(
  requestOrigin?: string | null,
  envConfig: OAuthEnvConfig = readProcessOAuthEnv()
): string {
  // Prefer runtime APP_URL first (never trusting spoofable proxy headers),
  // then fall back to validated trusted request origin or SITE_ORIGIN.
  const appUrlClean = isAllowedOriginUrl(getEnvValue(envConfig, 'APP_URL'));
  if (appUrlClean) return appUrlClean;

  const reqOriginClean = isAllowedOriginUrl(requestOrigin);
  if (reqOriginClean) return reqOriginClean;

  const siteOriginClean = isAllowedOriginUrl(getEnvValue(envConfig, 'SITE_ORIGIN'));
  if (siteOriginClean) return siteOriginClean;

  return 'https://chatfxp.com';
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeJson(obj: unknown): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(JSON.stringify(obj)));
}

function base64UrlDecodeToBytes(input: string): Uint8Array<ArrayBuffer> {
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

function base64UrlDecodeJson<T>(segment: string): T {
  const bytes = base64UrlDecodeToBytes(segment);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

async function importHs256Key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

interface OAuthStatePayload {
  provider: AuthProviderKind;
  redirectUri: string;
  nonce: string;
  exp: number;
}

export async function createOAuthAuthorizeUrl(params: {
  providerId: string;
  requestOrigin?: string | null;
  envConfig?: OAuthEnvConfig;
}): Promise<{ url: string; redirectUri: string; stateNonce: string }> {
  const envConfig = params.envConfig ?? readProcessOAuthEnv();
  const mod = getOAuthProviderModule(params.providerId);
  if (!mod || mod.strategy !== 'oauth2_popup' || !mod.oauth2) {
    throw new Error(`Unsupported modular OAuth 2.0 provider: ${params.providerId}`);
  }

  const clientId = getEnvValue(envConfig, mod.oauth2.clientIdEnvKey);
  const clientSecret = getEnvValue(envConfig, mod.oauth2.clientSecretEnvKey);
  if (!clientId || !clientSecret) {
    throw new Error(
      `${mod.labelEn} OAuth is not configured yet. Add ${mod.oauth2.clientIdEnvKey} and ${mod.oauth2.clientSecretEnvKey} to environment secrets.`
    );
  }

  const baseUrl = resolveOAuthBaseUrl(params.requestOrigin, envConfig);
  const redirectUri = `${baseUrl}${mod.oauth2.callbackPath}`;

  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = base64UrlEncodeBytes(nonceBytes);

  const statePayload: OAuthStatePayload = {
    provider: mod.id,
    redirectUri,
    nonce,
    exp: Math.floor(Date.now() / 1000) + 600, // 10 min state lifetime
  };
  const payloadSeg = base64UrlEncodeJson(statePayload);
  const key = await importHs256Key(getOAuthSigningSecret(envConfig));
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadSeg));
  const state = `${payloadSeg}.${base64UrlEncodeBytes(new Uint8Array(sig))}`;

  const search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: mod.oauth2.scopes.join(' '),
    state,
    ...(mod.oauth2.extraAuthorizeParams || {}),
  });

  return {
    url: `${mod.oauth2.authorizeUrl}?${search.toString()}`,
    redirectUri,
    stateNonce: nonce,
  };
}

export async function verifyOAuthStateToken(
  stateToken: string,
  expectedProvider: string,
  envConfig: OAuthEnvConfig = readProcessOAuthEnv()
): Promise<OAuthStatePayload> {
  const parts = stateToken.split('.');
  if (parts.length !== 2) {
    throw new Error('Malformed OAuth state parameter.');
  }
  const [payloadSeg, sigSeg] = parts;
  const key = await importHs256Key(getOAuthSigningSecret(envConfig));
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecodeToBytes(sigSeg),
    new TextEncoder().encode(payloadSeg)
  );
  if (!valid) {
    throw new Error('Invalid OAuth state signature.');
  }
  const payload = base64UrlDecodeJson<OAuthStatePayload>(payloadSeg);
  if (payload.provider !== expectedProvider) {
    throw new Error('OAuth provider state mismatch.');
  }
  if (!Number.isFinite(payload.exp) || Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('OAuth state expired. Please try signing in again.');
  }
  return payload;
}

export async function exchangeOAuthCodeForProfile(params: {
  providerId: string;
  code: string;
  redirectUri: string;
  envConfig?: OAuthEnvConfig;
}): Promise<NormalizedOAuthProfile> {
  const envConfig = params.envConfig ?? readProcessOAuthEnv();
  const mod = getOAuthProviderModule(params.providerId);
  if (!mod || mod.strategy !== 'oauth2_popup' || !mod.oauth2) {
    throw new Error('Unsupported OAuth provider.');
  }

  const clientId = getEnvValue(envConfig, mod.oauth2.clientIdEnvKey);
  const clientSecret = getEnvValue(envConfig, mod.oauth2.clientSecretEnvKey);
  if (!clientId || !clientSecret) {
    throw new Error(`${mod.labelEn} OAuth credentials missing on server.`);
  }

  const bodyParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: params.code,
    redirect_uri: params.redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch(mod.oauth2.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ChatFXP-OAuth-Client',
    },
    body: bodyParams.toString(),
  });

  const tokenJson = (await tokenRes.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || `Failed ${mod.labelEn} token exchange.`);
  }

  const accessToken = tokenJson.access_token;

  if (mod.id === 'github') {
    const userRes = await fetch(mod.oauth2.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ChatFXP-OAuth-Client',
      },
    });
    if (!userRes.ok) {
      throw new Error('Failed to fetch GitHub profile.');
    }
    const ghUser = (await userRes.json()) as {
      id: number | string;
      login?: string;
      name?: string;
      email?: string | null;
      avatar_url?: string;
    };

    let resolvedEmail = typeof ghUser.email === 'string' && ghUser.email.trim() ? ghUser.email.trim() : '';
    if (!resolvedEmail && mod.oauth2.emailUrl) {
      const emailsRes = await fetch(mod.oauth2.emailUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'ChatFXP-OAuth-Client',
        },
      });
      if (emailsRes.ok) {
        const emailsList = (await emailsRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const primaryVerified =
          emailsList.find((e) => e.primary && e.verified) ||
          emailsList.find((e) => e.verified) ||
          emailsList[0];
        if (primaryVerified?.email) {
          resolvedEmail = primaryVerified.email;
        }
      }
    }

    const providerUserId = String(ghUser.id);
    return {
      provider: 'github',
      providerUserId,
      uid: `oauth:github:${providerUserId}`,
      email: resolvedEmail || `github_${providerUserId}@users.chatfxp.com`,
      displayName: (ghUser.name || ghUser.login || `GitHub_${providerUserId}`).trim().slice(0, 32),
      avatarUrl: ghUser.avatar_url,
    };
  }

  if (mod.id === 'discord') {
    const userRes = await fetch(mod.oauth2.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    if (!userRes.ok) {
      throw new Error('Failed to fetch Discord profile.');
    }
    const dcUser = (await userRes.json()) as {
      id: string;
      username?: string;
      global_name?: string;
      email?: string | null;
      avatar?: string | null;
    };
    const providerUserId = String(dcUser.id);
    const avatarUrl = dcUser.avatar
      ? `https://cdn.discordapp.com/avatars/${encodeURIComponent(providerUserId)}/${encodeURIComponent(dcUser.avatar)}.png?size=256`
      : undefined;

    return {
      provider: 'discord',
      providerUserId,
      uid: `oauth:discord:${providerUserId}`,
      email:
        typeof dcUser.email === 'string' && dcUser.email.trim()
          ? dcUser.email.trim()
          : `discord_${providerUserId}@users.chatfxp.com`,
      displayName: (dcUser.global_name || dcUser.username || `Discord_${providerUserId}`).trim().slice(0, 32),
      avatarUrl,
    };
  }

  throw new Error(`No profile mapper defined for provider ${mod.id}`);
}

export async function signModularOAuthToken(
  profile: NormalizedOAuthProfile,
  envConfig: OAuthEnvConfig = readProcessOAuthEnv()
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const headerSeg = base64UrlEncodeJson({ alg: 'HS256', typ: 'JWT' });
  const payload: DecodedModularOAuthToken = {
    tokenType: 'chatfxp_oauth',
    uid: profile.uid,
    provider: profile.provider,
    email: profile.email,
    name: profile.displayName,
    picture: profile.avatarUrl,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  };
  const payloadSeg = base64UrlEncodeJson(payload);
  const key = await importHs256Key(getOAuthSigningSecret(envConfig));
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${headerSeg}.${payloadSeg}`));
  return `${headerSeg}.${payloadSeg}.${base64UrlEncodeBytes(new Uint8Array(sig))}`;
}

export function isModularOAuthToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = base64UrlDecodeJson<{ tokenType?: string }>(parts[1]);
    return payload.tokenType === 'chatfxp_oauth';
  } catch {
    return false;
  }
}

export async function verifyModularOAuthToken(
  token: string,
  envConfig: OAuthEnvConfig = readProcessOAuthEnv()
): Promise<DecodedModularOAuthToken> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed modular OAuth token.');
  }
  const [headerSeg, payloadSeg, sigSeg] = parts;
  const header = base64UrlDecodeJson<{ alg?: string }>(headerSeg);
  if (header.alg !== 'HS256') {
    throw new Error('Unsupported OAuth session algorithm.');
  }

  const key = await importHs256Key(getOAuthSigningSecret(envConfig));
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecodeToBytes(sigSeg),
    new TextEncoder().encode(`${headerSeg}.${payloadSeg}`)
  );
  if (!valid) {
    throw new Error('Invalid modular OAuth session signature.');
  }

  const payload = base64UrlDecodeJson<DecodedModularOAuthToken>(payloadSeg);
  if (payload.tokenType !== 'chatfxp_oauth' || !payload.uid) {
    throw new Error('Invalid modular OAuth claims.');
  }
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(payload.exp) || payload.exp <= now) {
    throw new Error('Modular OAuth session expired.');
  }
  return payload;
}

export function renderOAuthCallbackHtml(result: {
  ok: boolean;
  provider: string;
  token?: string;
  user?: {
    id: number;
    uid: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    role: string;
  };
  error?: string;
}): string {
  const safePayload = JSON.stringify({
    type: result.ok ? 'OAUTH_AUTH_SUCCESS' : 'OAUTH_AUTH_ERROR',
    provider: result.provider,
    token: result.token ?? null,
    user: result.user ?? null,
    error: result.error ?? null,
  }).replace(/</g, '\\u003c');

  const safeStatusText = result.ok
    ? 'Authentication complete. Returning to ChatFXP Sanctum...'
    : 'Authentication could not be completed. You may close this window.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ChatFXP OAuth</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #070609; color: #f3eaf1; font-family: system-ui, sans-serif; }
    .card { border: 1px solid rgba(212,166,74,0.45); background: #120d14; padding: 24px 28px; border-radius: 10px; text-align: center; max-width: 380px; }
    h1 { margin: 0 0 8px; font-size: 16px; color: #ffe39a; }
    p { margin: 0; font-size: 13px; color: #c5bac7; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ChatFXP.com · Modular OAuth</h1>
    <p>${safeStatusText}</p>
  </div>
  <script>
    (function() {
      var msg = ${safePayload};
      try {
        if (window.opener) {
          window.opener.postMessage(msg, '*');
          window.close();
          return;
        }
      } catch (e) {}
      window.location.href = '/';
    })();
  </script>
</body>
</html>`;
}
