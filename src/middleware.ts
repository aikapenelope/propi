import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/p(.*)",
  "/preview(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/health",
  "/api/cron(.*)",
]);

// Only activate Clerk middleware if the keys are configured.
// This allows the landing page to work on Vercel without Clerk env vars.
const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

const clerkHandler = clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect();
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
