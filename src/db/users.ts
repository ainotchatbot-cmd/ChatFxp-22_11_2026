import { eq, ilike } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

const DEFAULT_SUPER_ADMIN_EMAILS = ['ainotchatbot@gmail.com'];

export function isSuperAdminEmail(email?: string | null, extraEmails?: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const envRaw =
    extraEmails ??
    (typeof process !== 'undefined' && process.env ? process.env.SUPER_ADMIN_EMAILS || '' : '');
  const envList = envRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const allowed = new Set([...DEFAULT_SUPER_ADMIN_EMAILS, ...envList]);
  return allowed.has(normalized);
}

export async function getOrCreateUser(params: {
  uid: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}) {
  try {
    const cleanName = (params.displayName || params.email.split('@')[0] || 'Member').trim().slice(0, 32);
    const defaultAvatar =
      params.avatarUrl || '/src/assets/images/avatar_member_knight_1795091471991.jpg';
    const superAdminMatch = isSuperAdminEmail(params.email);

    // 1. Lookup by Firebase UID
    const byUid = await db.select().from(users).where(eq(users.uid, params.uid)).limit(1);
    if (byUid.length > 0) {
      const current = byUid[0];
      const shouldElevate = superAdminMatch && current.role !== 'super_admin';
      const [updated] = await db
        .update(users)
        .set({
          email: params.email,
          ...(shouldElevate
            ? {
                role: 'super_admin',
                rankTitle: 'Super Admin · Supreme Architect',
                maxMana: Math.max(250, current.maxMana),
                mana: Math.max(250, current.mana),
              }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, current.id))
        .returning();
      return updated;
    }

    // 2. Fallback: bind pre-seeded / email-matched account (e.g. Super Admin email) to real Firebase UID
    if (params.email) {
      const byEmail = await db
        .select()
        .from(users)
        .where(ilike(users.email, params.email.trim()))
        .limit(1);
      if (byEmail.length > 0) {
        const matched = byEmail[0];
        const shouldElevate = superAdminMatch && matched.role !== 'super_admin';
        const [linked] = await db
          .update(users)
          .set({
            uid: params.uid,
            email: params.email,
            ...(params.avatarUrl ? { avatarUrl: params.avatarUrl } : {}),
            ...(shouldElevate
              ? {
                  role: 'super_admin',
                  rankTitle: 'Super Admin · Supreme Architect',
                  maxMana: Math.max(250, matched.maxMana),
                  mana: Math.max(250, matched.mana),
                }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(users.id, matched.id))
          .returning();
        return linked;
      }
    }

    // 3. Create brand new user (elevated automatically if Super Admin email)
    const inserted = await db
      .insert(users)
      .values({
        uid: params.uid,
        email: params.email,
        username: cleanName.replace(/\s+/g, '_'),
        displayName: cleanName,
        avatarUrl: defaultAvatar,
        role: superAdminMatch ? 'super_admin' : 'member',
        rankTitle: superAdminMatch ? 'Super Admin · Supreme Architect' : 'חבר חדש',
        xp: superAdminMatch ? 15000 : 250,
        level: superAdminMatch ? 34 : 2,
        reputation: superAdminMatch ? 1200 : 15,
        occultEssence: superAdminMatch ? 1000 : 25,
        mana: superAdminMatch ? 250 : 140,
        maxMana: superAdminMatch ? 250 : 200,
        unlockedBadgesJson: '[]',
        loginStreak: superAdminMatch ? 30 : 1,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: params.email,
          ...(superAdminMatch
            ? {
                role: 'super_admin',
                rankTitle: 'Super Admin · Supreme Architect',
              }
            : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Failed to sync user in PostgreSQL:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Failed to query user by UID:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}
