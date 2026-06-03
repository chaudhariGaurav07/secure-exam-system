import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Question } from "@/models/Question";
import { encrypt, createHash } from "@/lib/encryption";
import { createAuditLog } from "@/services/audit.service";
import { validateBody, CreateQuestionSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await connectDB();

    const headerStore = await headers();
    const userId   = headerStore.get("x-user-id")!;
    const userRole = headerStore.get("x-user-role")!;

    const body = await validateBody(req, CreateQuestionSchema);

    const encryptedQuestion = encrypt(body.question);
    const hash              = createHash(body.question);

    const question = await Question.create({
      encryptedQuestion,
      hash,
      subject:    body.subject,
      module:     body.module,
      marks:      body.marks,
      difficulty: body.difficulty,
      isRepeated: body.isRepeated,
      createdBy:  userId,
    });

    await createAuditLog({
      userId,
      action:  "QUESTION_CREATED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { questionId: question._id, subject: body.subject },
    });

    return Response.json({ success: true, question });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("QUESTION CREATE ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}