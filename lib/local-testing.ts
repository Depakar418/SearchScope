/** Explicit development-only access. Never enable this on a hosted deployment. */
export function localTestingEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.SEARCHSCOPE_LOCAL_TESTING === "1" && env.NODE_ENV === "development" && !env.VERCEL;
}
export const LOCAL_TEST_USER = { id: "local:test-account", email: "tester@searchscope.local", name: "Local test account" };
export function localRequestAllowed(url: string): boolean {
  return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname);
}
export function identityHeaders(headers: Headers, user?: { id?: string; email?: string | null; name?: string | null }): Headers {
  const result = new Headers(headers);
  for (const name of ["id", "email", "full-name", "full-name-encoding"]) result.delete(`oai-authenticated-user-${name}`);
  if (user?.id) {
    result.set("oai-authenticated-user-id", user.id);
    if (user.email) result.set("oai-authenticated-user-email", user.email);
    if (user.name) {
      result.set("oai-authenticated-user-full-name", encodeURIComponent(user.name));
      result.set("oai-authenticated-user-full-name-encoding", "percent-encoded-utf-8");
    }
  }
  return result;
}
