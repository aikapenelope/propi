import "@clerk/nextjs";

/**
 * Extend Clerk's session claims to include publicMetadata.
 *
 * This requires configuring the session token in Clerk Dashboard:
 * Sessions > Customize session token > Add:
 *   { "metadata": "{{user.public_metadata}}" }
 *
 * Without this configuration, sessionClaims.metadata will be undefined
 * and the middleware cannot enforce trial/plan expiration.
 */
declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      /** Current plan: "trial" or "pro" */
      plan?: "trial" | "pro";
      /** ISO date when the trial expires (only for plan === "trial") */
      trialEndsAt?: string;
      /** ISO date when the paid period expires (only for plan === "pro") */
      paidUntil?: string;
      /** Admin can explicitly deactivate a user */
      active?: boolean;
    };
  }
}
