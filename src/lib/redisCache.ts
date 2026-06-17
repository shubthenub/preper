import { createClient } from "redis"

let client: ReturnType<typeof createClient> | null = null

async function getRedisClient() {
  if (client && client.isOpen) {
    return client
  }

  const redisUrl = process.env.PREPER_REDIS_REDIS_URL
  if (!redisUrl) return null

  try {
    client = createClient({ url: redisUrl })
    client.on("error", (err) => console.error("Redis Client Error", err))
    await client.connect()
    return client
  } catch (error) {
    console.error("Failed to connect to Redis:", error)
    return null
  }
}

export async function getCachedData<T>(
  key: string,
  tagsOrTagFn: string[] | ((data: T) => string[]),
  fn: () => Promise<T>,
  ttlSeconds = 3600
): Promise<T> {
  const redis = await getRedisClient()
  if (!redis) {
    return await fn()
  }

  // 1. Try to get from Redis
  try {
    const cached = await redis.get(key)
    if (cached !== null && cached !== undefined) {
      return JSON.parse(cached) as T
    }
  } catch (error) {
    console.error("Redis cache get error:", error)
  }

  // 2. Fetch fresh data
  const data = await fn()

  // 3. Save to Redis
  try {
    const serialized = JSON.stringify(data)
    await redis.set(key, serialized, { EX: ttlSeconds })

    // Associate keys with tags
    const tags = typeof tagsOrTagFn === "function" ? tagsOrTagFn(data) : tagsOrTagFn
    if (tags && tags.length > 0) {
      const multi = redis.multi()
      for (const tag of tags) {
        multi.sAdd(`tag:${tag}`, key)
        multi.expire(`tag:${tag}`, ttlSeconds * 2)
      }
      await multi.exec()
    }
  } catch (error) {
    console.error("Redis cache set error:", error)
  }

  return data
}

export async function revalidateRedisTag(tag: string): Promise<void> {
  const redis = await getRedisClient()
  if (!redis) return

  try {
    const tagKey = `tag:${tag}`
    const keys = await redis.sMembers(tagKey)
    if (keys && keys.length > 0) {
      const multi = redis.multi()
      multi.del(keys)
      multi.del(tagKey)
      await multi.exec()
    }
  } catch (error) {
    console.error(`Redis revalidateTag error for tag ${tag}:`, error)
  }
}
