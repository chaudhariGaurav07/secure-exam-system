import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Template } from "@/models/Template";
import { createAuditLog } from "@/services/audit.service";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Identity injected by proxy.ts after JWT + RBAC check (admin only)
    const headerStore = await headers();
    const userId   = headerStore.get("x-user-id");
    const userRole = headerStore.get("x-user-role");

    const body = await req.json();

    const template = await Template.create({
      ...body,
      createdBy: userId, // from verified JWT — never from body
    });

    await createAuditLog({
      userId,
      action:  "TEMPLATE_CREATED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { templateId: template._id, title: template.title },
    });

    return Response.json({ success: true, template });
  } catch (error) {
    console.error("TEMPLATE CREATE ERROR:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}