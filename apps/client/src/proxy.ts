import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const legacyPrefixes = ["/docs", "/blog2"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (legacyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    console.log(" request", request);
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/proxy/:path*", "/blog/:path*", "/docs/:path*"],
};
