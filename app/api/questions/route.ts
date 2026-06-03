import { connectDB } from "@/lib/db";
import { Question } from "@/models/Question";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status     = searchParams.get("status");     // filter: pending|approved|rejected
    const subject    = searchParams.get("subject");    // filter by subject
    const difficulty = searchParams.get("difficulty"); // filter: easy|medium|hard
    const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip       = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status)     filter.status     = status;
    if (subject)    filter.subject    = subject;
    if (difficulty) filter.difficulty = difficulty;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .select("-encryptedQuestion") // never expose ciphertext in list
        .populate("createdBy",  "name email role")
        .populate("reviewedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("LIST QUESTIONS ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
