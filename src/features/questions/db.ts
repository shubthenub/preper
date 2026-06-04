import { db } from "@/drizzle/db"
import { QuestionTable } from "@/drizzle/schema"
import { revalidateQuestionCache } from "./dbCache"

export async function insertQuestion(
  question: typeof QuestionTable.$inferInsert
) {
  return await db.transaction(async (tx) => {
    const [newQuestion] = await tx
      .insert(QuestionTable)
      .values(question)
      .returning({
        id: QuestionTable.id,
        jobInfoId: QuestionTable.jobInfoId,
      })

    revalidateQuestionCache({
      id: newQuestion.id,
      jobInfoId: newQuestion.jobInfoId,
    })

    return newQuestion
  })
}