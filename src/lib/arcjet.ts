import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next"
import { env } from "@/data/env/server"

// For AI questions & feedback: 50 capacity, refill 15 per hour
export const questionsAj = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["userId"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
    }),
    tokenBucket({
      capacity: 50,
      refillRate: 15,
      interval: "1h",
      mode: "LIVE",
    }),
  ],
})

// For Resume analysis: 5 capacity, refill 2 per hour
export const resumesAj = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["userId"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
    }),
    tokenBucket({
      capacity: 5,
      refillRate: 2,
      interval: "1h",
      mode: "LIVE",
    }),
  ],
})
