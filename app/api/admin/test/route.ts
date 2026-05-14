import { cookies } from "next/headers";

import { verifyToken } from "@/lib/auth";

import { hasRole } from "@/lib/rbac";

export async function GET() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("token")?.value;

  if (!token) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const user: any = await verifyToken(token);

  if (!user) {
    return Response.json(
      {
        success: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }

  const allowed = hasRole(user.role, [
    "admin",
  ]);

  if (!allowed) {
    return Response.json(
      {
        success: false,
        message: "Forbidden",
      },
      { status: 403 }
    );
  }

  return Response.json({
    success: true,
    message: "Welcome admin",
  });
}