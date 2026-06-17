import { getGlobalTag, getIdTag, getJobInfoTag } from "@/lib/dataCache"
import { revalidateRedisTag } from "@/lib/redisCache"

export function getInterviewGlobalTag() {
  return getGlobalTag("interviews")
}

export function getInterviewJobInfoTag(jobInfoId: string) {
  return getJobInfoTag("interviews", jobInfoId)
}

export function getInterviewIdTag(id: string) {
  return getIdTag("interviews", id)
}

export function revalidateInterviewCache({
  id,
  jobInfoId,
}: {
  id: string
  jobInfoId: string
}) {
  revalidateRedisTag(getInterviewGlobalTag())
  revalidateRedisTag(getInterviewJobInfoTag(jobInfoId))
  revalidateRedisTag(getInterviewIdTag(id))
}