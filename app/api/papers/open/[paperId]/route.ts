import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Paper } from "@/models/Paper";
import { decrypt } from "@/lib/encryption";
import { createAuditLog } from "@/services/audit.service";

interface RouteParams {
  params: Promise<{ paperId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await connectDB();

    // Identity injected by proxy.ts — only admin/reviewer/exam_center can reach here
    const headerStore = await headers();
    const userId   = headerStore.get("x-user-id");
    const userRole = headerStore.get("x-user-role");

    const { paperId } = await params;

    const paper = await Paper.findById(paperId);

    if (!paper) {
      return Response.json(
        { success: false, error: "Paper not found" },
        { status: 404 }
      );
    }

    if (!paper.finalized) {
      return Response.json(
        { success: false, error: "Paper has not been finalized yet" },
        { status: 403 }
      );
    }

    // Decrypt the paper for authorized access
    const decryptedPaper = decrypt(paper.encryptedPaper);

    await createAuditLog({
      userId,
      action:  "PAPER_OPENED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { paperId, setNumber: paper.setNumber },
    });

    return Response.json({
      success: true,
      paper: JSON.parse(decryptedPaper),
    });
  } catch (error) {
    console.error("OPEN PAPER ERROR:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
