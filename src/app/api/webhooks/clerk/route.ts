import { deleteUser, upsertUser } from "@/features/users/db"
import { Webhook } from "svix"
import { NextRequest } from "next/server"
import { WebhookEvent } from "@clerk/nextjs/server"

//verifyWebhook needs CLERK_WEBHOOK_SIGNING_SECRET env variable set

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET")
  }

  const svix_id = request.headers.get("svix-id")
  const svix_timestamp = request.headers.get("svix-timestamp")
  const svix_signature = request.headers.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const body = await request.text()

  const wh = new Webhook(WEBHOOK_SECRET)
  let event: WebhookEvent

  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (error) {
    console.error("Webhook verification failed:", error)
    return new Response("Invalid signature", { status: 400 })
  }

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const clerkData = event.data
        const email = clerkData.email_addresses.find(
          e => e.id === clerkData.primary_email_address_id
        )?.email_address
        
        if (!email) {
          return new Response("No primary email found", { status: 400 })
        }

        await upsertUser({
          id: clerkData.id,
          email,
          name: `${clerkData.first_name || ""} ${clerkData.last_name || ""}`.trim(),
          imageUrl: clerkData.image_url,
          createdAt: new Date(clerkData.created_at),
          updatedAt: new Date(clerkData.updated_at),
        })
        break
      }
      case "user.deleted": {
        if (!event.data.id) {
          return new Response("No user ID found", { status: 400 })
        }
        await deleteUser(event.data.id)
        break
      }
    }

    return new Response("Webhook processed", { status: 200 })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return new Response("Processing failed", { status: 500 })
  }
}