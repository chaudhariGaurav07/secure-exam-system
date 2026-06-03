import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Template } from "@/models/Template";
import { generatePaperSets } from "@/services/paper.service";
import { Paper } from "@/models/Paper";
import { createAuditLog } from "@/services/audit.service";
import { validateBody, GeneratePaperSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await connectDB();

    const headerStore = await headers();
    const userId   = headerStore.get("x-user-id")!;
    const userRole = headerStore.get("x-user-role")!;

    const { templateId } = await validateBody(req, GeneratePaperSchema);

    const template = await Template.findById(templateId);
    if (!template) {
      return Response.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    const sets = await generatePaperSets(template);

    const savedPapers = await Promise.all(
      sets.map((set) =>
        Paper.create({
          templateId: template._id,
          setNumber:  set.setNo,
          questions:  set.paperQuestions,
          finalized:  false,
        })
      )
    );

    await createAuditLog({
      userId,
      action:  "PAPER_SETS_GENERATED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { templateId, setsCount: savedPapers.length },
    });

    return Response.json({ success: true, sets: savedPapers });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("GENERATE ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}