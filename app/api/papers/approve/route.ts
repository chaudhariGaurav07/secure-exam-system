import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Paper } from "@/models/Paper";
import { createAuditLog } from "@/services/audit.service";
import { validateBody, ApprovePaperSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await connectDB();

    const headerStore = await headers();
    const userId   = headerStore.get("x-user-id")!;
    const userRole = headerStore.get("x-user-role")!;

    const { paperId } = await validateBody(req, ApprovePaperSchema);

    const paper = await Paper.findById(paperId);
    if (!paper) return Response.json({ success: false, error: "Paper not found" }, { status: 404 });
    if (paper.finalized) return Response.json({ success: false, error: "Paper already finalized" }, { status: 409 });

    const alreadyApproved = paper.approvals.some((a: any) => a.userId.toString() === userId);
    if (alreadyApproved) {
      return Response.json({ success: false, error: "You have already approved this paper" }, { status: 409 });
    }

    paper.approvals.push({ userId, role: userRole, approvedAt: new Date() });
    await paper.save();

    const approvalCount   = paper.approvals.length;
    const required        = paper.approvalsRequired;
    const readyToFinalize = approvalCount >= required;

    await createAuditLog({
      userId,
      action:  "PAPER_APPROVED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { paperId, approvalCount, required, readyToFinalize },
    });

    return Response.json({
      success: true,
      approvalCount,
      required,
      readyToFinalize,
      message: readyToFinalize
        ? `${approvalCount}/${required} approvals — paper is ready to finalize`
        : `${approvalCount}/${required} approvals — waiting for more reviewers`,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("APPROVE ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
