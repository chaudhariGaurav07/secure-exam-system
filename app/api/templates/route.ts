import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit   = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip    = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (subject) filter.subject = subject;

    const [templates, total] = await Promise.all([
      Template.find(filter)
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Template.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      templates,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("LIST TEMPLATES ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
