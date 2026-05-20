import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isBlocked } from "@/lib/plan-gate";

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
// Middleware (Edge Runtime — NO prom-client imports allowed here)
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
