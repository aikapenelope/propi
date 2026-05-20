/**
 * Plan/trial expiration logic — extracted for testability.
 *
 * Determines if a user should be blocked from accessing the app based on
 * their Clerk session claims (publicMetadata).
 *
 * Logic: only block users whose trial or paid plan has explicitly expired.
 * Users with no metadata, no plan, or an active plan are allowed through.
 * This prevents blocking new users before the webhook sets their trial.
 */

export interface PlanMetadata {
  plan?: "trial" | "pro";
  trialEndsAt?: string;
  paidUntil?: string;
  active?: boolean;
}

export interface SessionClaims {
  metadata?: PlanMetadata;
}

/**
 * Check if a user's plan has expired and they should be blocked.
 * Returns true if the user should be redirected to /subscribe.
 */
export function isBlocked(
  sessionClaims: SessionClaims | null | undefined,
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
