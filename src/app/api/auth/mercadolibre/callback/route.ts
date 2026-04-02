import { NextResponse } from "next/server";
import { exchangeMeliCode } from "@/lib/mercadolibre";
import { db } from "@/lib/db";
import { socialAccounts } from "@/server/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * OAuth2 callback for MercadoLibre.
 * Receives ?code=XXX&state=YYY, exchanges for tokens, saves in DB.
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

    const existing = await db.query.socialAccounts.findFirst({
      where: eq(socialAccounts.platform, "mercadolibre"),
    });

    const accountData = {
      platform: "mercadolibre" as const,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      platformAccountId: String(tokens.userId),
      accountName: `MeLi User ${tokens.userId}`,
      tokenExpiresAt: tokens.expiresAt,
      metadata: {
        userId: tokens.userId,
      },
    };

    if (existing) {
      await db
        .update(socialAccounts)
        .set(accountData)
        .where(eq(socialAccounts.platform, "mercadolibre"));
    } else {
      await db.insert(socialAccounts).values(accountData);
    }

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
