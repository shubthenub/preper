import { db } from "@/drizzle/db"
import { QuestionTable } from "@/drizzle/schema"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { getQuestionIdTag } from "@/features/questions/dbCache"
import { generateAiQuestionFeedback } from "@/services/ai/questions"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { eq } from "drizzle-orm"
import { getCachedData } from "@/lib/redisCache"
import z from "zod"

import { questionsAj } from "@/lib/arcjet"

const schema = z.object({
  prompt: z.string().min(1),
  questionId: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = schema.safeParse(body)

  if (!result.success) {
    return new Response("Error generating your feedback", { status: 400 })
  }

  const { prompt: answer, questionId } = result.data
  const { userId } = await getCurrentUser({})

  if (userId == null) {
    return new Response("You are not logged in", { status: 401 })
  }

  // Rate Limiting
  const decision = await questionsAj.protect(req, { userId, requested: 1 })
  if (decision.isDenied()) {
    return new Response("Too many requests. Please try again later.", { status: 429 })
  }

  const question = await getQuestion(questionId, userId)
  if (question == null) {
    return new Response("You do not have permission to do this", {
      status: 403,
    })
  }

  const res = generateAiQuestionFeedback({
    question: question.text,
    answer,
  })

  const encoder = new TextEncoder();
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      // AI SDK protocol: 0 is for text chunks
      controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
    },
  });

  const stream = res.textStream.pipeThrough(transformStream);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-data-stream": "v1", // UI ko update trigger karne ke liye
      "Access-Control-Expose-Headers": "x-vercel-ai-data-stream",
    },
  });
}


async function getQuestion(id: string, userId: string) {
  return getCachedData(
    `question:${id}:${userId}`,
    (data) => {
      if (data) {
        return [getQuestionIdTag(id), getJobInfoIdTag(data.jobInfo.id)]
      }
      return [getQuestionIdTag(id)]
    },
    async () => {
      const question = await db.query.QuestionTable.findFirst({
        where: eq(QuestionTable.id, id),
        with: { jobInfo: { columns: { id: true, userId: true } } },
      })

      if (question == null) return null
      if (question.jobInfo.userId !== userId) return null
      return question
    }
  )
}