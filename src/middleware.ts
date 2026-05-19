import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  httpRequestsTotal,
  httpRequestDuration,
  normalizeRoutePath,
} from "@/lib/metrics";

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
  "/api/metrics",
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
  const start = Date.now();
  const method = request.method;
  const routePath = normalizeRoutePath(request.nextUrl.pathname);

  // Skip metrics collection for the /api/metrics endpoint itself
  const isMetricsRoute = request.nextUrl.pathname === "/api/metrics";

  // If Clerk is not configured, allow public routes and block app routes
  if (!clerkHandler) {
    if (isPublicRoute(request)) {
      if (!isMetricsRoute) {
        recordMetrics(method, routePath, 200, start);
      }
      return NextResponse.next();
    }
    recordMetrics(method, routePath, 302, start);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Run Clerk handler and record metrics after
  const response = clerkHandler(request, {} as never);

  // Record metrics for the request (we can't get the actual status from
  // clerkMiddleware's return, so we record 200 for allowed requests.
  // Actual error statuses are tracked at the API route level.)
  if (!isMetricsRoute) {
    recordMetrics(method, routePath, 200, start);
  }

  return response;
}

/**
 * Record HTTP metrics for a request.
 * Uses route patterns (not real URLs) to prevent cardinality explosion.
 */
function recordMetrics(
  method: string,
  routePath: string,
  status: number,
  startMs: number,
): void {
  const durationSeconds = (Date.now() - startMs) / 1000;

  httpRequestsTotal.inc({
    method,
    path: routePath,
    status: String(status),
  });

  httpRequestDuration.observe(
    { method, path: routePath },
    durationSeconds,
  );
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json|png)).*)",
    "/(api|trpc)(.*)",
  ],
};
