import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Question } from "@/models/Question";
import { createAuditLog } from "@/services/audit.service";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Identity injected by proxy.ts after JWT + RBAC check
    const headerStore = await headers();
    const reviewerId = headerStore.get("x-user-id");
    const userRole   = headerStore.get("x-user-role");

    const body = await req.json();

    if (!["approved", "rejected"].includes(body.status)) {
      return Response.json(
        { success: false, error: "Invalid status — must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      body.questionId,
      {
        status:     body.status,
        reviewedBy: reviewerId, 
      },
      { new: true } 
    );

    if (!updatedQuestion) {
      return Response.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    await createAuditLog({
      userId:  reviewerId,
      action:  "QUESTION_REVIEWED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { questionId: body.questionId, status: body.status },
    });

    return Response.json({ success: true, updatedQuestion });
  } catch (error) {
    console.error("REVIEW ERROR:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}