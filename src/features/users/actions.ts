"use server"

import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getUserIdTag } from "./dbCache"
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { UserTable } from "@/drizzle/schema";

export async function getUser(userId: string) {
    "use cache"
    cacheTag(getUserIdTag(userId));

    return db.query.UserTable.findFirst({
        where: eq(UserTable.id, userId)
    })
}