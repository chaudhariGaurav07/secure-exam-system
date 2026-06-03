import { connectDB } from "@/lib/db";
import { verifyBlockchain } from "@/lib/blockchain";
import { Block } from "@/lib/blockchain";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip  = (page - 1) * limit;

    // Verify entire chain integrity
    const { valid, brokenAt } = await verifyBlockchain();

    // Fetch recent blocks for display
    const [blocks, total] = await Promise.all([
      Block.find().sort({ index: -1 }).skip(skip).limit(limit),
      Block.countDocuments(),
    ]);

    return Response.json({
      success: true,
      chainIntegrity: {
        valid,
        totalBlocks: total,
        ...(brokenAt !== undefined ? { brokenAt } : {}),
        message: valid
          ? `Chain is intact — ${total} blocks verified`
          : `TAMPERED — chain broken at block index ${brokenAt}`,
      },
      blocks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("BLOCKCHAIN VERIFY ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
