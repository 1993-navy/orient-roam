import { auth } from "@/lib/auth";

// Returns the session only if the current user is a platform admin, else null.
// Pages redirect on null; API routes return 403.
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") return null;
  return session;
}
