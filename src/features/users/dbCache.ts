import { getGlobalTag, getIdTag } from "@/lib/dataCache"
import { revalidateRedisTag } from "@/lib/redisCache"

export function getUserGlobalTag() {
  return getGlobalTag("users")
}

export function getUserIdTag(id: string) {
  return getIdTag("users", id)
}

export function revalidateUserCache(id: string) {
  revalidateRedisTag(getUserGlobalTag())
  revalidateRedisTag(getUserIdTag(id))
}