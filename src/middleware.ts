import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/p(.*)",
  "/agente(.*)",
  "/preview(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/subscribe",
  "/api/webhooks(.*)",
  "/api/health",
  "/api/cron(.*)",
  "/api/auth(.*)",
]);

// Only activate Clerk middleware if the keys are configured.
// This allows the landing page to work on Vercel without Clerk env vars.
const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

// ---------------------------------------------------------------------------
// Plan/trial expiration check
// ---------------------------------------------------------------------------

/**
 * Determine if a user should be blocked from accessing the app.
 *
 * Logic: only block users whose trial or paid plan has explicitly expired.
 * Users with no metadata, no plan, or an active plan are allowed through.
 * This prevents blocking new users before the webhook sets their trial.
 *
 * Metadata shapes (set by webhook or admin via Clerk Dashboard):
 *   { "plan": "trial", "trialEndsAt": "2026-05-01T00:00:00Z" }
 *   { "plan": "pro", "paidUntil": "2026-06-01T00:00:00Z" }
 *   { "active": false }  — explicitly deactivated by admin
 */
function isBlocked(
  sessionClaims: CustomJwtSessionClaims | null | undefined,
): boolean {
  const metadata = sessionClaims?.metadata;

  // No metadata = new user or session token not configured — allow access
  if (!metadata) return false;

  // Explicitly deactivated by admin
  if (metadata.active === false) return true;

  const { plan, trialEndsAt, paidUntil } = metadata;

  // No plan set — allow (webhook may not have fired yet)
  if (!plan) return false;

  // Trial expired
  if (plan === "trial") {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt) <= new Date();
  }

  // Paid plan expired
  if (plan === "pro") {
    if (!paidUntil) return false;
    return new Date(paidUntil) <= new Date();
  }

  // Unknown plan — allow
  return false;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

const clerkHandler = clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      if (isPublicRoute(request)) return;

      // Require authentication first
      const { userId, sessionClaims, redirectToSignIn } = await auth();

      if (!userId) {
        return redirectToSignIn();
      }

      // Block users with expired plans — redirect to /subscribe
      if (isBlocked(sessionClaims)) {
        const subscribeUrl = new URL("/subscribe", request.url);
        return NextResponse.redirect(subscribeUrl);
      }
    })
  : undefined;

export default function middleware(request: NextRequest) {
  // If Clerk is not configured, allow public routes and block app routes
  if (!clerkHandler) {
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }
    // Redirect to landing if trying to access protected route without auth
    return NextResponse.redirect(new URL("/", request.url));
  }

  return clerkHandler(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json|png)).*)",
    "/(api|trpc)(.*)",
  ],
};
