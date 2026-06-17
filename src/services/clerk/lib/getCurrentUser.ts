import { db } from "@/drizzle/db";
import { UserTable } from "@/drizzle/schema";
import { getUserIdTag } from "@/features/users/dbCache";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getCachedData } from "@/lib/redisCache";


export async function getCurrentUser({ allData = false } : { allData?: boolean }) {
    const {userId, redirectToSignIn} = await auth();
    return{
        userId,
        redirectToSignIn,
        user : allData&&userId? await getUser(userId):undefined
    }
}

async function getUser(userId: string) {
    return getCachedData(
        `user:${userId}`,
        [getUserIdTag(userId)],
        () => db.query.UserTable.findFirst({
            where: eq(UserTable.id, userId)
        })
    )
}