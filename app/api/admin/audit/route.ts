import { connectDB } from "@/lib/db";
import { Audit } from "@/models/Audit";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const action  = searchParams.get("action");  // e.g. LOGIN, QUESTION_CREATED
    const userId  = searchParams.get("userId");
    const role    = searchParams.get("role");
    const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit   = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
    const skip    = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (role)   filter.role   = role;

    const [logs, total] = await Promise.all([
      Audit.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Audit.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("AUDIT LIST ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
