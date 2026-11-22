import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';
import { adminAuth } from '../lib/firebase-admin.ts';
import { isModularOAuthToken, verifyModularOAuthToken } from '../lib/oauth-server.ts';

export interface DbUserRecord {
  id: number;
  uid: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  coverUrl: string | null;
  bio: string | null;
  role: string;
  rankTitle: string;
  xp: number;
  level: number;
  reputation: number;
  isBanned: boolean;
  privacyShowOnline: boolean;
}

export interface AuthRequest extends Request {
  firebaseUser?: DecodedIdToken;
  dbUser?: DbUserRecord;
}

export async function verifyNodeUnifiedToken(token: string): Promise<{
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  firebaseDecoded?: DecodedIdToken;
}> {
  if (isModularOAuthToken(token)) {
    const decoded = await verifyModularOAuthToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  }
  const decodedToken = await adminAuth.verifyIdToken(token);
  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name,
    picture: decodedToken.picture,
    firebaseDecoded: decodedToken,
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'נדרשת התחברות לביצוע פעולה זו.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const identity = await verifyNodeUnifiedToken(token);
    if (identity.firebaseDecoded) {
      req.firebaseUser = identity.firebaseDecoded;
    }

    const dbUser = await getOrCreateUser({
      uid: identity.uid,
      email: identity.email || `${identity.uid}@chatfxp.com`,
      displayName: identity.name,
      avatarUrl: identity.picture,
    });

    if (dbUser.isBanned) {
      return res.status(403).json({ error: 'חשבון זה הושעה על ידי הנהלת הקהילה.' });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'אסימון ההתחברות אינו תקף או שפג תוקפו.' });
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const identity = await verifyNodeUnifiedToken(token);
    if (identity.firebaseDecoded) {
      req.firebaseUser = identity.firebaseDecoded;
    }
    const dbUser = await getOrCreateUser({
      uid: identity.uid,
      email: identity.email || `${identity.uid}@chatfxp.com`,
      displayName: identity.name,
      avatarUrl: identity.picture,
    });
    if (!dbUser.isBanned) {
      req.dbUser = dbUser;
    }
  } catch {
    // Proceed anonymously if optional token is invalid
  }
  next();
};

export const requireModeratorOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.dbUser) {
    return res.status(401).json({ error: 'נדרשת התחברות.' });
  }
  const allowed = ['moderator', 'senior_moderator', 'administrator', 'super_admin'];
  if (!allowed.includes(req.dbUser.role)) {
    return res.status(403).json({ error: 'גישה מותרת למנהלים ומפקחים בלבד.' });
  }
  next();
};
