import { NextResponse } from "next/server";
import { exchangeMeliCode } from "@/lib/mercadolibre";
import { upsertSocialAccount } from "@/server/actions/social-accounts";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/**
 * OAuth2 callback for MercadoLibre.
 * Receives ?code=XXX&state=YYY, exchanges for tokens, saves in DB.
 * The user must be authenticated (Clerk middleware protects this route).
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
