import { getGlobalTag, getIdTag, getJobInfoTag } from "@/lib/dataCache"
import { revalidateRedisTag } from "@/lib/redisCache"

export function getQuestionGlobalTag() {
  return getGlobalTag("questions")
}

export function getQuestionJobInfoTag(jobInfoId: string) {
  return getJobInfoTag("questions", jobInfoId)
}

export function getQuestionIdTag(id: string) {
  return getIdTag("questions", id)
}

export function revalidateQuestionCache({
  id,
  jobInfoId,
}: {
  id: string
  jobInfoId: string
}) {
  revalidateRedisTag(getQuestionGlobalTag())
  revalidateRedisTag(getQuestionJobInfoTag(jobInfoId))
  revalidateRedisTag(getQuestionIdTag(id))
}