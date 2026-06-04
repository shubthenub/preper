import { db } from "@/drizzle/db"
import { JobInfoTable, QuestionTable } from "@/drizzle/schema"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { hasPermission } from "@/services/clerk/lib/hasPermission"
import { count, eq } from "drizzle-orm"

export async function canCreateQuestion(): Promise<boolean> {
  // Try unlimited questions first
  if (await hasPermission("unlimited_questions")) {
    return true;
  }

  // Then try the 5 questions limit
  if (await hasPermission("5_questions")) {
    const userCount = await getUserQuestionCount();
    if (userCount < 5) {
      return true;
    }
  }

  return false;
}

async function getUserQuestionCount() {
  const { userId } = await getCurrentUser({})
  if (userId == null) return 0

  return getQuestionCount(userId)
}

async function getQuestionCount(userId: string) {
  const [{ count: c }] = await db
    .select({ count: count() })
    .from(QuestionTable)
    .innerJoin(JobInfoTable, eq(QuestionTable.jobInfoId, JobInfoTable.id))
    .where(eq(JobInfoTable.userId, userId))

  return c
}