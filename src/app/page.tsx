import { redirect } from "next/navigation";

/**
 * Root page redirects to the dashboard.
 * Auth is enforced by Clerk middleware.
 */
export default function Home() {
  redirect("/dashboard");
}
