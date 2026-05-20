import { NextResponse } from "next/server";
import { exchangeMeliCode } from "@/lib/mercadolibre";
import { upsertSocialAccount } from "@/server/actions/social-accounts";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { serviceCredentials } from "@/server/schema";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * OAuth2 callback for MercadoLibre.
 * Receives ?code=XXX, exchanges for tokens, saves in:
 * 1. service_credentials (platform-level, used by sync worker) — ALWAYS
 * 2. social_accounts (per-user, backward compat) — only if logged in
 *
 * The service_credentials entry is what powers the global market sync.
 * Only one ML service credential exists — last authorization wins.
 *
 * This callback does NOT require the user to be logged in to Propi.
 * The platform token is saved regardless of Clerk session state.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/marketing/settings?ml_error=auth_denied", request.url),
    );
  }

  try {
    const tokens = await exchangeMeliCode(code);

    // 1. ALWAYS save as platform service credential (used by sync worker)
    await db
      .insert(serviceCredentials)
      .values({
        service: "mercadolibre",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        metadata: { meliUserId: tokens.userId },
      })
      .onConflictDoUpdate({
        target: serviceCredentials.service,
        set: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
          metadata: { meliUserId: tokens.userId },
        },
      });

    // 2. Optionally save per-user (backward compat)
    const { userId } = await auth();
    if (userId) {
      await upsertSocialAccount({
        platform: "mercadolibre",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        platformAccountId: String(tokens.userId),
        accountName: `MeLi User ${tokens.userId}`,
        tokenExpiresAt: tokens.expiresAt.toISOString(),
        metadata: { userId: tokens.userId },
        userId,
      });
    }

    return NextResponse.redirect(
      new URL("/marketing/settings?ml_success=true", request.url),
    );
  } catch (err) {
    log.external.error({ error: err instanceof Error ? err.message : String(err) }, "MercadoLibre OAuth callback failed");
    return NextResponse.redirect(
      new URL("/marketing/settings?ml_error=token_exchange", request.url),
    );
  }
}
