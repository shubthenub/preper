import { db } from "@/drizzle/db"
import { InterviewTable } from "@/drizzle/schema"
import { revalidateInterviewCache } from "./dbCache"
import { eq } from "drizzle-orm"

export async function insertInterview(
  interview: typeof InterviewTable.$inferInsert
) {
  return await db.transaction(async (tx) => {
    const [newInterview] = await tx
      .insert(InterviewTable)
      .values(interview)
      .returning({ id: InterviewTable.id, jobInfoId: InterviewTable.jobInfoId })

    revalidateInterviewCache(newInterview)

    return newInterview
  })
}

export async function updateInterview(
  id: string,
  interview: Partial<typeof InterviewTable.$inferInsert>
) {
  return await db.transaction(async (tx) => {
    const [newInterview] = await tx
      .update(InterviewTable)
      .set(interview)
      .where(eq(InterviewTable.id, id))
      .returning({ id: InterviewTable.id, jobInfoId: InterviewTable.jobInfoId })

    revalidateInterviewCache(newInterview)

    return newInterview
  })
}