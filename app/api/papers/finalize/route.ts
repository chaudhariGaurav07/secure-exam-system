import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Paper } from "@/models/Paper";
import { encrypt } from "@/lib/encryption";
import { createAuditLog } from "@/services/audit.service";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Identity injected by proxy.ts only admin/reviewer dekh sakta hai 
    const headerStore = await headers();
    const userId   = headerStore.get("x-user-id");
    const userRole = headerStore.get("x-user-role");

    const body = await req.json();
    const { paperId } = body;

    if (!paperId) {
      return Response.json(
        { success: false, error: "paperId is required" },
        { status: 400 }
      );
    }

    // Fetch the paper and verify it hasn't already been finalized
    const paper = await Paper.findById(paperId);

    if (!paper) {
      return Response.json(
        { success: false, error: "Paper not found" },
        { status: 404 }
      );
    }

    if (paper.finalized) {
      return Response.json(
        { success: false, error: "Paper is already finalized and cannot be changed" },
        { status: 409 }
      );
    }

    // Encrypt the full paper payload for secure at rest storage
    const encryptedPaper = encrypt(JSON.stringify(paper.toObject()));

    const finalizedPaper = await Paper.findByIdAndUpdate(
      paperId,
      {
        finalized:      true,
        reviewedBy:     userId,
        encryptedPaper,
      },
      { new: true }
    );

    await createAuditLog({
      userId,
      action:  "PAPER_FINALIZED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { paperId, setNumber: paper.setNumber },
    });

    return Response.json({
      success: true,
      message: "Paper finalized and encrypted",
      paperId:   finalizedPaper?._id,
      setNumber: finalizedPaper?.setNumber,
      finalized: finalizedPaper?.finalized,
    });
  } catch (error) {
    console.error("FINALIZE ERROR:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
