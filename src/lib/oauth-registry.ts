import type { AuthProviderKind, OAuthProviderStrategy } from '../types';

export interface OAuth2EndpointSpec {
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  emailUrl?: string;
  scopes: string[];
  clientIdEnvKey: string;
  clientSecretEnvKey: string;
  callbackPath: string;
  extraAuthorizeParams?: Record<string, string>;
}

export interface OAuthProviderModule {
  id: AuthProviderKind;
  labelHe: string;
  labelEn: string;
  descriptionHe: string;
  descriptionEn: string;
  strategy: OAuthProviderStrategy;
  callbackPath: string;
  badgeHe: string;
  badgeEn: string;
  accentHex: string;
  oauth2?: OAuth2EndpointSpec;
}

/**
 * Declarative Modular OAuth Provider Registry.
 * Add new OAuth providers by appending a module descriptor here and registering its profile mapper in oauth-server.ts.
 */
export const OAUTH_PROVIDER_MODULES: OAuthProviderModule[] = [
  {
    id: 'google',
    labelHe: 'Google',
    labelEn: 'Google',
    descriptionHe: 'התחברות מהירה ומאומתת דרך חשבון Google',
    descriptionEn: 'Instant verified sign-in via Google identity',
    strategy: 'firebase',
    callbackPath: '/__/auth/handler',
    badgeHe: 'פעיל אוטומטית',
    badgeEn: 'Ready',
    accentHex: '#EA4335',
  },
  {
    id: 'github',
    labelHe: 'GitHub',
    labelEn: 'GitHub',
    descriptionHe: 'חיבור OAuth 2.0 ישיר לחשבון המפתחים שלך',
    descriptionEn: 'Direct OAuth 2.0 popup connection for developer accounts',
    strategy: 'oauth2_popup',
    callbackPath: '/auth/callback/github',
    badgeHe: 'OAuth 2.0 מודולרי',
    badgeEn: 'Modular OAuth2',
    accentHex: '#A855F7',
    oauth2: {
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      emailUrl: 'https://api.github.com/user/emails',
      scopes: ['read:user', 'user:email'],
      clientIdEnvKey: 'GITHUB_CLIENT_ID',
      clientSecretEnvKey: 'GITHUB_CLIENT_SECRET',
      callbackPath: '/auth/callback/github',
    },
  },
  {
    id: 'discord',
    labelHe: 'Discord',
    labelEn: 'Discord',
    descriptionHe: 'אימות מהיר דרך פרופיל Discord הקהילתי שלך',
    descriptionEn: 'Fast community verification via your Discord profile',
    strategy: 'oauth2_popup',
    callbackPath: '/auth/callback/discord',
    badgeHe: 'OAuth 2.0 מודולרי',
    badgeEn: 'Modular OAuth2',
    accentHex: '#5865F2',
    oauth2: {
      authorizeUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      userInfoUrl: 'https://discord.com/api/users/@me',
      scopes: ['identify', 'email'],
      clientIdEnvKey: 'DISCORD_CLIENT_ID',
      clientSecretEnvKey: 'DISCORD_CLIENT_SECRET',
      callbackPath: '/auth/callback/discord',
      extraAuthorizeParams: {
        prompt: 'consent',
      },
    },
  },
  {
    id: 'apple',
    labelHe: 'Apple',
    labelEn: 'Apple',
    descriptionHe: 'כניסה מאובטחת באמצעות Apple ID',
    descriptionEn: 'Privacy-preserving sign-in with Apple ID',
    strategy: 'firebase',
    callbackPath: '/__/auth/handler',
    badgeHe: 'Firebase SSO',
    badgeEn: 'Firebase SSO',
    accentHex: '#D4A64A',
  },
  {
    id: 'facebook',
    labelHe: 'Facebook',
    labelEn: 'Facebook',
    descriptionHe: 'חיבור חשבון דרך פרופיל Facebook',
    descriptionEn: 'Social login powered by Facebook identity',
    strategy: 'firebase',
    callbackPath: '/__/auth/handler',
    badgeHe: 'Firebase SSO',
    badgeEn: 'Firebase SSO',
    accentHex: '#38BDF8',
  },
];

export function getOAuthProviderModule(id: string): OAuthProviderModule | undefined {
  return OAUTH_PROVIDER_MODULES.find((m) => m.id === id);
}
