import { ConnectionMessage } from "@humeai/voice-react"

type CondensedMessage = {
  isUser: boolean
  content: string[]
}

/**
 * IMPORTANT:
 * useVoice().messages is a protocol stream, not a clean type.
 * So we accept unknown[] and narrow at runtime.
 */
export function condenseChatMessages(
  messages: unknown[]
): CondensedMessage[] {
  return messages.reduce<CondensedMessage[]>((acc, message) => {
    const data =
      getChatEventData(message) ??
      getJsonMessageData(message)

    if (!data || !data.content) return acc

    const last = acc.at(-1)

    if (!last || last.isUser !== data.isUser) {
      acc.push({
        isUser: data.isUser,
        content: [data.content],
      })
    } else {
      last.content.push(data.content)
    }

    return acc
  }, [])
}

/* ---------- HELPERS ---------- */

function getJsonMessageData(message: unknown) {
  const m = message as any

  if (
    m?.type !== "user_message" &&
    m?.type !== "assistant_message"
  ) {
    return null
  }

  return {
    isUser: m.type === "user_message",
    content: m.message?.content,
  }
}

function getChatEventData(message: unknown) {
  const m = message as any

  if (
    m?.type !== "USER_MESSAGE" &&
    m?.type !== "AGENT_MESSAGE"
  ) {
    return null
  }

  return {
    isUser: m.type === "USER_MESSAGE",
    content: m.messageText,
  }
}
