import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Template } from "@/models/Template";
import { createAuditLog } from "@/services/audit.service";
import { validateBody, CreateTemplateSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await connectDB();

    const headerStore = await headers();
    const userId   = headerStore.get("x-user-id")!;
    const userRole = headerStore.get("x-user-role")!;

    const body = await validateBody(req, CreateTemplateSchema);

    const template = await Template.create({
      ...body,
      createdBy: userId,
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
    if (error instanceof Response) return error;
    console.error("TEMPLATE CREATE ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}