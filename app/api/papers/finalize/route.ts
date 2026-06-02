import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Paper } from "@/models/Paper";
import { encrypt, createHash } from "@/lib/encryption";
import { uploadToIPFS } from "@/lib/ipfs";
import { addBlock } from "@/lib/blockchain";
import { createAuditLog } from "@/services/audit.service";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Identity injected by proxy.ts only admin/reviewer dekh sakta hai
    const headerStore = await headers();
    const userId   = headerStore.get("x-user-id");
    const userRole = headerStore.get("x-user-role");

    const body = await req.json();
    const { paperId, releaseAt } = body;

    if (!paperId) {
      return Response.json(
        { success: false, error: "paperId is required" },
        { status: 400 }
      );
    }

    if (!releaseAt) {
      return Response.json(
        { success: false, error: "releaseAt (ISO date string) is required" },
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

    if (paper.finalized) {
      return Response.json(
        { success: false, error: "Paper is already finalized and cannot be changed" },
        { status: 409 }
      );
    }

    // 1. Encrypt the full question list for secure at rest storage
    const paperString   = JSON.stringify(paper.questions);
    const encryptedPaper = encrypt(paperString);

    // 2. Hash the encrypted content for tamper detection
    const hash = createHash(encryptedPaper);

    // 3. Upload to IPFS (Pinata) — content-addressed, survives restarts
    const cid = await uploadToIPFS(encryptedPaper);

    // 4. Record this event permanently on the blockchain
    const block = await addBlock({
      cid,
      hash,
      paperId:   paper._id,
      setNumber: paper.setNumber,
      finalizedBy: userId,
    });

    // 5. Lock the paper in the database
    paper.encryptedPaper = encryptedPaper;
    paper.generatedHash  = hash;
    paper.cid            = cid;
    paper.releaseAt      = new Date(releaseAt);
    paper.reviewedBy     = userId as any;
    paper.finalized      = true;

    await paper.save();

    await createAuditLog({
      userId,
      action:  "PAPER_FINALIZED",
      role:    userRole,
      ip:      req.headers.get("x-forwarded-for") ?? "unknown",
      details: { paperId, cid, hash, blockIndex: block.index },
    });

    return Response.json({
      success:   true,
      message:   "Paper finalized, encrypted, and pinned to IPFS",
      cid,
      hash,
      blockIndex: block.index,
      releaseAt,
    });
  } catch (error) {
    console.error("FINALIZE ERROR:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
