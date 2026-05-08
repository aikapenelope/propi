import { NextResponse } from "next/server";
import { exchangeMeliCode } from "@/lib/mercadolibre";
import { upsertSocialAccount } from "@/server/actions/social-accounts";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { serviceCredentials } from "@/server/schema";

export const dynamic = "force-dynamic";

/**
 * OAuth2 callback for MercadoLibre.
 * Receives ?code=XXX, exchanges for tokens, saves in:
 * 1. social_accounts (per-user, backward compat)
 * 2. service_credentials (platform-level, used by sync worker)
 *
 * The service_credentials entry is what powers the global market sync.
 * Only one ML service credential exists — last authorization wins.
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        new URL("/marketing/settings?ml_error=not_authenticated", request.url),
      );
    }

    const tokens = await exchangeMeliCode(code);

    // 1. Save per-user (backward compat for user-facing features)
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

    // 2. Save as platform service credential (used by sync worker)
    await db
      .insert(serviceCredentials)
      .values({
        service: "mercadolibre",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        metadata: { userId: tokens.userId },
      })
      .onConflictDoUpdate({
        target: serviceCredentials.service,
        set: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
          metadata: { userId: tokens.userId },
        },
      });

    return NextResponse.redirect(
      new URL("/marketing/settings?ml_success=true", request.url),
    );
  } catch (err) {
    console.error("MeLi OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/marketing/settings?ml_error=token_exchange", request.url),
    );
  }
}
