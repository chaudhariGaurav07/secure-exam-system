import { connectDB } from "@/lib/db";
import { Paper } from "@/models/Paper";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const finalized  = searchParams.get("finalized");  // "true" | "false"
    const templateId = searchParams.get("templateId");
    const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip       = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (finalized  !== null) filter.finalized  = finalized === "true";
    if (templateId)          filter.templateId = templateId;

    const [papers, total] = await Promise.all([
      Paper.find(filter)
        .select("-encryptedPaper -questions") // never expose ciphertext or raw questions in list
        .populate("templateId", "title subject totalMarks")
        .populate("reviewedBy", "name email")
        .populate("signedBy",   "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Paper.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      papers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("LIST PAPERS ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
