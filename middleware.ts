import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "./lib/auth";

const protectedRoutes = [
  "/dashboard",
];

export async function middleware(
  req: NextRequest
) {
  const token = req.cookies.get("token")?.value;

  const pathname = req.nextUrl.pathname;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  return NextResponse.next();
}

// Configure middleware matcher
// Middleware will run only for dashboard routes
export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};