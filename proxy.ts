import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { auth } from "./auth";
import { identityHeaders, localTestingEnabled, localRequestAllowed, LOCAL_TEST_USER } from "./lib/local-testing";

// Discard client-supplied identity headers, then use only the verified session.
const authenticatedProxy = auth((request, _event: NextFetchEvent) => {
  void _event;
  const user = request.auth?.user;
  const headers = identityHeaders(request.headers, user?.id?.startsWith("github:") ? user : undefined);
  return NextResponse.next({ request: { headers } });
});
export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (localTestingEnabled() && localRequestAllowed(request.url)) {
    return NextResponse.next({ request: { headers: identityHeaders(request.headers, LOCAL_TEST_USER) } });
  }
  return authenticatedProxy(request, event);
}
export const config = {
  matcher: ["/((?!api/auth(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
