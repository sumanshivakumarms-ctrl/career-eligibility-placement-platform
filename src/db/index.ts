import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __careerPathPglite?: PGlite;
  __careerPathPgliteReady?: Promise<void>;
};

const isPglite = databaseUrl.startsWith("pglite://");

if (isPglite) {
  const dataDir = path.resolve(process.cwd(), databaseUrl.slice("pglite://".length));
  const client = globalForDb.__careerPathPglite ?? new PGlite(dataDir);
  globalForDb.__careerPathPglite = client;
  globalForDb.__careerPathPgliteReady ??= migratePglite(drizzlePglite(client), {
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
  await globalForDb.__careerPathPgliteReady;
} else if (!globalForDb.__arenaNextJsPostgresqlPool) {
  globalForDb.__arenaNextJsPostgresqlPool = new Pool({ connectionString: databaseUrl });
}

export const db = isPglite
  ? drizzlePglite(globalForDb.__careerPathPglite!)
  : drizzle(globalForDb.__arenaNextJsPostgresqlPool!);
