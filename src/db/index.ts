import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export type AppDb = NodePgDatabase<typeof schema>;

declare global {
  var _postgresPool: Pool | undefined;
  var _postgresDrizzle: AppDb | undefined;
}

const edgeDbStorage = new AsyncLocalStorage<AppDb>();

export function createPool(): Pool {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL?.trim();
    global._postgresPool = connectionString
      ? new Pool({
          connectionString,
          max: 10,
          connectionTimeoutMillis: 15000,
        })
      : new Pool({
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          max: 10,
          connectionTimeoutMillis: 15000,
        });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
}

function getNodeDb(): AppDb {
  if (!global._postgresDrizzle) {
    global._postgresDrizzle = drizzle(createPool(), { schema });
  }
  return global._postgresDrizzle;
}

/**
 * Runs a handler inside an isolated per-request PostgreSQL connection (for Cloudflare Workers + Hyperdrive / DATABASE_URL)
 * and cleanly closes the request-scoped Pool via optional waitUntil after the response finishes.
 */
export async function runWithEdgeDb<T>(
  connectionString: string,
  fn: () => Promise<T>,
  waitUntil?: (promise: Promise<unknown>) => void
): Promise<T> {
  const pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (err) => {
    console.error('Edge SQL pool error:', err);
  });
  const requestDb = drizzle(pool, { schema });
  try {
    return await edgeDbStorage.run(requestDb, fn);
  } finally {
    const cleanup = pool.end().catch(() => {});
    if (waitUntil) {
      waitUntil(cleanup);
    } else {
      await cleanup;
    }
  }
}

export const db: AppDb = new Proxy({} as AppDb, {
  get(_target, prop, receiver) {
    const activeDb = edgeDbStorage.getStore() ?? getNodeDb();
    const value = Reflect.get(activeDb, prop, activeDb);
    return typeof value === 'function' ? value.bind(activeDb) : value;
  },
});
