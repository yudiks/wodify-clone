import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/coach") && req.auth.user.role !== "COACH") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/coach/:path*", "/submissions/:path*"],
};
