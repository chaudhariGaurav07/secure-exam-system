import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Template } from "@/models/Template";
import { Paper } from "@/models/Paper";
import { generatePaperSets } from "@/services/paper.service";
import { createAuditLog } from "@/services/audit.service";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Identity injected by proxy.ts after JWT + RBAC check (admin only)
    const headerStore = await headers();
    const userId   = headerStore.get("x-user-id");
    const userRole = headerStore.get("x-user-role");

    const body = await req.json();

    const template = await Template.findById(body.templateId);

    if (!template) {
      return Response.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    const sets = await generatePaperSets(template);

  
    const savedPapers = await Promise.all(
      sets.map(async (set) => {
        return await Paper.create({
          templateId: template._id,
          setNumber: set.setNo,
          questions: set.paperQuestions,
          finalized: false,
        });
      })
    );

    await createAuditLog({
      userId,
      action:  "PAPER_SETS_GENERATED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { templateId: body.templateId, setsCount: savedPapers.length },
    });

    return Response.json({ success: true, sets: savedPapers });
  } catch (error) {
    console.error("GENERATE ERROR:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}