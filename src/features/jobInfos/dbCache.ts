import { getGlobalTag, getIdTag, getUserTag } from "@/lib/dataCache"
import { revalidateRedisTag } from "@/lib/redisCache"

export function getJobInfoGlobalTag() {
  return getGlobalTag("jobInfos")
}

export function getJobInfoUserTag(userId: string) {
  return getIdTag("jobInfos", userId)
}

export function getJobInfoIdTag(id:string){
    return getIdTag("jobInfos", id)
}

export function revalidateJobInfoCache({
  id,
  userId,
}: {
  id: string
  userId: string
}) {
  revalidateRedisTag(getJobInfoGlobalTag())
  revalidateRedisTag(getJobInfoUserTag(userId))
  revalidateRedisTag(getJobInfoIdTag(id))
}