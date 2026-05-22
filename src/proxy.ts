import type { NextRequest } from "next/server";
import { proxy as rootProxy } from "../proxy";

export function proxy(request: NextRequest) {
  return rootProxy(request);
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[^/]+$).*)",
  ],
};
