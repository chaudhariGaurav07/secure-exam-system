import { connectDB } from "@/lib/db";
import { Question } from "@/models/Quesition";
import { encrypt, createHash } from "@/lib/encryption";


export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const encryptionQuestion = encrypt(body.question);

    const hash = createHash(body.question);

    const question = await Question.create({
      encryptionQuestion,
      hash,

      subject: body.subject,
      module: body.module,
      marks: body.marks,
      difficulty: body.difficulty,

      createdBy: body.createdBy,

      isRepeated: body.isRepeated,
    });

    return Response.json({
      success: true,
      question,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Question creation failed",
      },
      { status: 500 },
    );
  }
}
