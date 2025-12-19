import { env } from "@/data/env/server";
import * as schema from "@/drizzle/schema";

// We need both drivers for the segregation
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { neon } from '@neondatabase/serverless';


const createDb = () => {
  // If we are in production (Vercel), use Neon's HTTP driver
  if (process.env.NODE_ENV === "production") {
    const client = neon(env.NEON_DB_URL!);
    return drizzleNeon(client, { schema });
  }

  
  return drizzleNode(env.DATABASE_URL, { schema });
};

export const db = createDb();