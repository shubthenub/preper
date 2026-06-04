import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { revalidateJobInfoCache } from "./dbCache"
import { eq } from "drizzle-orm"

export async function insertJobInfo(jobInfo: typeof JobInfoTable.$inferInsert) {
  return await db.transaction(async (tx) => {
    const [newJobInfo] = await tx.insert(JobInfoTable).values(jobInfo).returning({
      id: JobInfoTable.id,
      userId: JobInfoTable.userId,
    })

    revalidateJobInfoCache(newJobInfo)

    return newJobInfo
  })
}

export async function updateJobInfo(
  id: string,
  jobInfo: Partial<typeof JobInfoTable.$inferInsert>
) {
  return await db.transaction(async (tx) => {
    const [updatedJobInfo] = await tx
      .update(JobInfoTable)
      .set(jobInfo)
      .where(eq(JobInfoTable.id, id))
      .returning({
        id: JobInfoTable.id,
        userId: JobInfoTable.userId,
      })

    revalidateJobInfoCache(updatedJobInfo)

    return updatedJobInfo
  })
}