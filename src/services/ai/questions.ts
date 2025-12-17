import {
  JobInfoTable,
  QuestionDifficulty,
  QuestionTable,
} from "@/drizzle/schema"
import { generateText, streamText } from "ai"
import { google } from "./models/google"

export async function generateAiQuestion({
  jobInfo,
  previousQuestions,
  difficulty,
  onFinish,
}: {
  jobInfo: Pick<
    typeof JobInfoTable.$inferSelect,
    "title" | "description" | "experienceLevel"
  >
  previousQuestions: Pick<
    typeof QuestionTable.$inferSelect,
    "text" | "difficulty"
  >[]
  difficulty: QuestionDifficulty
  onFinish?: (text: string) => Promise<void>
}) {
  const previousQuestionsText =
    previousQuestions.length > 0
      ? previousQuestions
          .map(
            q =>
              `- Difficulty: ${q.difficulty}\n  Question:\n  ${q.text}`
          )
          .join("\n\n")
      : "None"

  const prompt = `
You are an AI assistant that creates technical interview questions tailored to a specific job role.

Your task is to generate ONE realistic and relevant technical interview question.

Job Information:
- Job Description: ${jobInfo.description}
- Experience Level: ${jobInfo.experienceLevel}
${jobInfo.title ? `- Job Title: ${jobInfo.title}` : ""}

Previously Asked Questions:
${previousQuestionsText}

Difficulty Level:
${difficulty}

Guidelines:
- The question MUST reflect the skills and technologies mentioned in the job description.
- The question MUST match the given difficulty level (easy, medium, hard).
- Prefer practical, real-world problems over theoretical trivia.
- It is acceptable to focus on a single skill or technology from the job description.
- Do NOT repeat any of the previous questions.
- Do NOT include the answer.
- Do NOT include explanations or hints.
- Output ONLY the question.
- Format the question in clean, readable Markdown.
- Stop immediately after the full question is written.

Generate the question now.
`.trim()

  return streamText({
    model: google("gemini-2.5-flash"), 
    prompt,
    onFinish: async ({ text }) => {
      if (onFinish) await onFinish(text)
    }
  })
}


export function generateAiQuestionFeedback({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  return streamText({
    model: google("gemini-2.5-flash"),
    prompt: answer,
    system: `You are an expert technical interviewer. Your job is to evaluate the candidate's answer to a technical interview question.
    

The original question was:
\`\`\`
${question}
\`\`\`

Instructions:
- Review the candidate's answer (provided in the user prompt).
- Assign a rating from **1 to 10**, where:
  - 10 = Perfect, complete, and well-articulated
  - 7-9 = Mostly correct, with minor issues or room for optimization
  - 4-6 = Partially correct or incomplete
  - 1-3 = Largely incorrect or missing the point
- Provide **concise, constructive feedback** on what was done well and what could be improved.
- Be honest but professional.
- Include a full correct answer in the output. Do not use this answer as part of the grading. Only look at the candidate's response when assigning a rating.
- Try to generate a concise answer where possible, but do not sacrifice quality for brevity.
- Refer to the candidate as "you" in your feedback. This feedback should be written as if you were speaking directly to the interviewee.
- Stop generating output as soon you have provided the rating, feedback, and full correct answer.

Output Format (strictly follow this structure):
\`\`\`
## Feedback (Rating: <Your rating from 1 to 10>/10)
<Your written feedback as markdown>
---
## Correct Answer
<The full correct answer as markdown>
\`\`\``,
  })
}