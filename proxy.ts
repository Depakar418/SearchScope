import { NextResponse } from "next/server";
import { auth } from "./auth";

// All Sites identity headers supplied by clients are discarded at the Vercel edge.
// Existing API and server components only see values derived from the verified session.
export const proxy = auth((request) => {
  const headers = new Headers(request.headers);
  for (const header of [
    "oai-authenticated-user-id",
    "oai-authenticated-user-email",
    "oai-authenticated-user-full-name",
    "oai-authenticated-user-full-name-encoding",
  ]) headers.delete(header);

  const user = request.auth?.user;
  if (user?.id?.startsWith("github:")) {
    headers.set("oai-authenticated-user-id", user.id);
    if (user.email) headers.set("oai-authenticated-user-email", user.email);
    if (user.name) {
      headers.set("oai-authenticated-user-full-name", encodeURIComponent(user.name));
      headers.set("oai-authenticated-user-full-name-encoding", "percent-encoded-utf-8");
    }
  }
  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: ["/((?!api/auth(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
