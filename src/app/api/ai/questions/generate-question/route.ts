import { db } from "@/drizzle/db"
import {
  JobInfoTable,
  questionDifficulties,
  QuestionTable,
} from "@/drizzle/schema"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { insertQuestion } from "@/features/questions/db"
import { getQuestionJobInfoTag } from "@/features/questions/dbCache"
import { canCreateQuestion } from "@/features/questions/permissions"
import { PLAN_LIMIT_MESSAGE } from "@/lib/errorToast"
import { generateAiQuestion } from "@/services/ai/questions"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { google } from "@/services/ai/models/google"
import { streamText } from "ai"
import { and, asc, eq } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import z from "zod"

import { after } from "next/server"

import { questionsAj } from "@/lib/arcjet"

const schema = z.object({
  prompt: z.enum(questionDifficulties),
  jobInfoId: z.string().min(1),
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return new Response("Invalid request", { status: 400 })

  const { prompt: difficulty, jobInfoId } = result.data
  const { userId } = await getCurrentUser({})
  
  if (userId == null) {
    return new Response("You are not logged in", { status: 401 })
  }

  // Rate Limiting
  const decision = await questionsAj.protect(req, { userId, requested: 1 })
  if (decision.isDenied()) {
    return new Response("Too many requests. Please try again later.", { status: 429 })
  }

  // Permission Check
  if (!(await canCreateQuestion())) {
    return new Response(PLAN_LIMIT_MESSAGE, { status: 403 })
  }

  const jobInfo = await getJobInfo(jobInfoId, userId)
  if (jobInfo == null) {
    return new Response("Job Info not found", { status: 404 })
  }
  const previousQuestions = await getQuestions(jobInfoId)

  const questionId = crypto.randomUUID()

  const aiResult = await generateAiQuestion({
    jobInfo,
    previousQuestions,
    difficulty,
  })

  after(async () => {
    try {
      const text = await aiResult.text
      await insertQuestion({
        id: questionId,
        text: text.trim(),
        jobInfoId,
        difficulty,
      })
    } catch (e) {
      console.error("Failed to save question in background after stream:", e)
    }
  })

  const encoder = new TextEncoder();
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      // 0: means text chunk in AI SDK protocol
      controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
    },
  });

  const stream = aiResult.textStream.pipeThrough(transformStream);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-data-stream": "v1", // <--- Ye trigger karega UI updates
      "x-question-id": questionId,
      "Access-Control-Expose-Headers": "x-question-id",
    },
  });
}

async function getQuestions(jobInfoId: string) {
  "use cache"
  cacheTag(getQuestionJobInfoTag(jobInfoId))

  return db.query.QuestionTable.findMany({
    where: eq(QuestionTable.jobInfoId, jobInfoId),
    orderBy: asc(QuestionTable.createdAt),
  })
}

async function getJobInfo(id: string, userId: string) {
  "use cache"
  cacheTag(getJobInfoIdTag(id))

  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
  })
}