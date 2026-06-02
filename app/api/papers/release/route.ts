import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Paper } from "@/models/Paper";
import { readFromIPFS } from "@/lib/ipfs";
import { decrypt } from "@/lib/encryption";
import { createAuditLog } from "@/services/audit.service";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Identity injected by proxy.ts — only admin/reviewer/exam_center can reach here
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

    const paper = await Paper.findById(paperId);

    if (!paper) {
      return Response.json(
        { success: false, error: "Paper not found" },
        { status: 404 }
      );
    }

    if (!paper.finalized) {
      return Response.json(
        { success: false, error: "Paper has not been finalized yet" },
        { status: 403 }
      );
    }

    //  Time-lock check — use releaseAt stored securely at finalize time 
    // releaseAt and cid come from the DATABASE, not the request body
    // This prevents attackers from bypassing the time lock by sending a fake date
    const now       = new Date();
    const releaseAt = paper.releaseAt;

    if (!releaseAt) {
      return Response.json(
        { success: false, error: "No release time set on this paper" },
        { status: 403 }
      );
    }

    if (now < releaseAt) {
      const remaining = Math.ceil((releaseAt.getTime() - now.getTime()) / 1000 / 60);
      return Response.json(
        {
          success:  false,
          message:  "Paper is still time-locked",
          releaseAt: releaseAt.toISOString(),
          minutesRemaining: remaining,
        },
        { status: 403 }
      );
    }

    //  Fetch encrypted paper from IPFS using the stored CID
    const cid             = paper.cid;
    const encryptedPaper  = await readFromIPFS(cid);

    //Decrypt and verify integrity
    const decryptedPaper = decrypt(encryptedPaper);

    await createAuditLog({
      userId,
      action:  "PAPER_RELEASED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { paperId, cid, setNumber: paper.setNumber },
    });

    return Response.json({
      success:   true,
      setNumber: paper.setNumber,
      paper:     JSON.parse(decryptedPaper),
    });
  } catch (error) {
    console.error("RELEASE ERROR:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
