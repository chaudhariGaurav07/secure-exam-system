import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Question } from "@/models/Question";
import { createAuditLog } from "@/services/audit.service";
import { validateBody, ReviewQuestionSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await connectDB();

    const headerStore = await headers();
    const reviewerId = headerStore.get("x-user-id")!;
    const userRole   = headerStore.get("x-user-role")!;

    const body = await validateBody(req, ReviewQuestionSchema);

    const updatedQuestion = await Question.findByIdAndUpdate(
      body.questionId,
      {
        status:     body.status,
        reviewedBy: reviewerId,
        ...(body.feedback ? { feedback: body.feedback } : {}),
      },
      { new: true }
    );

    if (!updatedQuestion) {
      return Response.json({ success: false, error: "Question not found" }, { status: 404 });
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
    if (error instanceof Response) return error;
    console.error("REVIEW ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}