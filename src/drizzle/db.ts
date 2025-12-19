import { env } from "@/data/env/server";
import * as schema from "@/drizzle/schema";

// We need both drivers for the segregation
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { neon } from '@neondatabase/serverless';
import { PgDatabase } from "drizzle-orm/pg-core";


const createDb = () => {
  // If we are in production (Vercel), use Neon's HTTP driver
  if (process.env.NODE_ENV === "production") {
    const client = neon(env.NEON_DB_URL!);
    return drizzleNeon(client, { schema });
  }

  
  return drizzleNode(env.DATABASE_URL, { schema });
};

//helper type to extract your schema relations
type FullSchema = typeof schema;

//Export the db with a simplified cast that doesn't conflict with internal HKTs
export const db = createDb() as unknown as ReturnType<typeof drizzleNeon<FullSchema>>;