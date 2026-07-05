import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";
import { checkRateLimit, isSuspicious } from "./lib/rate-limiter";

// Public API routes that do NOT need authentication
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/me",       // Token verified inside the route handler
  "/api/papers/verify", // Signature verification is public
];

// Role requirements per API route prefix
const ROLE_REQUIREMENTS: Record<string, string[]> = {
  // Admin-only
  "/api/admin":              ["admin"],

  // Paper lifecycle
  "/api/papers/generate":    ["admin", "author"],
  "/api/papers/finalize":    ["admin", "reviewer"],
  "/api/papers/approve":     ["reviewer", "admin"],
  "/api/papers/release":     ["admin", "reviewer", "exam_center"],
  "/api/papers/open":        ["admin", "reviewer", "exam_center"],

  // List routes (all roles)
  "/api/papers":             ["admin", "reviewer", "author", "exam_center"],
  "/api/templates":          ["admin", "reviewer", "author", "exam_center"],
  "/api/questions/review":   ["reviewer", "admin"],
  "/api/questions/create":   ["author", "admin"],
  "/api/questions":          ["admin", "reviewer", "author", "exam_center"],
};


export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  //  API routes
  if (isApiRoute) {
    // Intrusion Detection + Rate Limiting
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    // Skip rate limiting for localhost (dev/test environment)
    const isLocalhost = ip === "unknown" || ip === "127.0.0.1" || ip === "::1";
    const rateLimit   = isLocalhost ? 5000 : 30; // 5000/min locally, 30/min in prod
    const rateResult  = checkRateLimit(ip, rateLimit, 60_000);

    if (!rateResult.allowed) {
      // Log intrusion asynchronously — fire and forget
      console.warn(`[INTRUSION] Rate limit exceeded — IP: ${ip}, count: ${rateResult.count}`);
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests — rate limit exceeded",
          resetAt: new Date(rateResult.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Flag suspicious activity (high volume, likely brute force)
    if (isSuspicious(ip, 20)) {
      console.warn(`[INTRUSION] Suspicious activity detected — IP: ${ip}`);
      // Still allow through (not blocked yet) but logged for audit
    }

    // Allow public endpoints through
    if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // RBAC check — find the most specific matching route prefix
    const matchedPrefix = Object.keys(ROLE_REQUIREMENTS)
      .filter((prefix) => pathname.startsWith(prefix))
      .sort((a, b) => b.length - a.length)[0]; // longest match wins

    if (matchedPrefix) {
      const allowedRoles = ROLE_REQUIREMENTS[matchedPrefix];
      if (!allowedRoles.includes(payload.role as string)) {
        return NextResponse.json(
          {
            success: false,
            message: `Forbidden — requires one of: ${allowedRoles.join(", ")}`,
          },
          { status: 403 }
        );
      }
    }

    // Forward user identity to route handlers via request headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id",   String(payload.id));
    requestHeaders.set("x-user-role",  String(payload.role));
    requestHeaders.set("x-user-email", String(payload.email));

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  //  Page routes 
  const isProtectedPage = pathname.startsWith("/dashboard");
  if (!isProtectedPage) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // All API routes
    "/api/:path*",
    // Protected pages
    "/dashboard/:path*",
  ],
};