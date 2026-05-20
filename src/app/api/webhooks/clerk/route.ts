import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Clerk webhook handler for user provisioning.
 *
 * Listens for `user.created` events and auto-assigns a 7-day free trial
 * by setting publicMetadata on the user. The middleware reads this metadata
 * from the session token to gate access to the app.
 *
 * Setup in Clerk Dashboard:
 * 1. Webhooks > Add Endpoint > URL: https://propi.aikalabs.cc/api/webhooks/clerk
 * 2. Events: select "user.created"
 * 3. Copy the Signing Secret and set as CLERK_WEBHOOK_SECRET env var
 *
 * Required env var: CLERK_WEBHOOK_SECRET
 */

const TRIAL_DAYS = 7;

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

function getWebhookSecret(): string {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }
  return secret;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const secret = getWebhookSecret();

  // Get Svix headers for verification
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const body = await request.text();

  // Verify the webhook signature
  const wh = new Webhook(secret);
  let event: { type: string; data: { id: string; email_addresses?: { email_address: string }[]; first_name?: string; last_name?: string } };

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch (err) {
    log.auth.error({ error: err instanceof Error ? err.message : String(err) }, "clerk webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 },
    );
  }

  // ---------------------------------------------------------------------------
  // Handle user.created — assign 7-day trial
  // ---------------------------------------------------------------------------

  if (event.type === "user.created") {
    const userId = event.data.id;

    try {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          plan: "trial",
          trialEndsAt: trialEndsAt.toISOString(),
        },
      });

      log.auth.info(
        { user_id: userId, trial_days: TRIAL_DAYS, expires: trialEndsAt.toISOString() },
        "user provisioned with trial",
      );
    } catch (err) {
      log.auth.error({ user_id: userId, error: err instanceof Error ? err.message : String(err) }, "failed to set trial for user");
      // Return 200 anyway so Clerk doesn't retry indefinitely.
      // The user will be allowed in (no metadata = allow by default).
    }
  }

  return NextResponse.json({ received: true });
}
