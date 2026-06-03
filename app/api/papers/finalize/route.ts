import { connectDB } from "@/lib/db";
import { headers } from "next/headers";
import { Paper } from "@/models/Paper";
import { User } from "@/models/User";
import { KeyShare } from "@/models/KeyShare";
import { encrypt, createHash } from "@/lib/encryption";
import { uploadToIPFS } from "@/lib/ipfs";
import { addBlock } from "@/lib/blockchain";
import { signData } from "@/lib/digital-signature";
import { splitSecret } from "@/lib/secret-sharing";
import { createAuditLog } from "@/services/audit.service";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Identity injected by proxy.ts only admin/reviewer dekh sakta hai
    const headerStore = await headers();
    const userId = headerStore.get("x-user-id")!;
    const userRole = headerStore.get("x-user-role")!;

    const body = await req.json();
    const {
      paperId,
      releaseAt,
      examDurationHours = 3,    // Auto-destruction: hours after releaseAt
      approvalsRequired = 2,    // Multi-sig: how many approvals needed
      enableThreshold = false, // Threshold key sharing
      thresholdK = 2,    // k-of-n: minimum shares to decrypt
      thresholdN = 3,    // k-of-n: total shares generated
      holderUserIds = [],   // User IDs who get key shares
    } = body;

    if (!paperId || !releaseAt) {
      return Response.json({ success: false, error: "paperId and releaseAt are required" }, { status: 400 });
    }

    const paper = await Paper.findById(paperId);
    if (!paper) return Response.json({ success: false, error: "Paper not found" }, { status: 404 });
    if (paper.finalized) return Response.json({ success: false, error: "Already finalized" }, { status: 409 });

    //  Multi-Signature Check 
    if (paper.approvals.length < approvalsRequired) {
      return Response.json({
        success: false,
        error: `Multi-signature requirement not met: ${paper.approvals.length}/${approvalsRequired} approvals received`,
      }, { status: 403 });
    }

    //  Encrypt paper content 
    const paperString = JSON.stringify(paper.questions);
    const encryptedPaper = encrypt(paperString);
    const hash = createHash(encryptedPaper);

    //  Feature 1: Digital Signature 
    const admin = await User.findById(userId).select("encryptedPrivateKey");
    if (!admin?.encryptedPrivateKey) {
      return Response.json({ success: false, error: "Admin signing key not found — please re-register" }, { status: 400 });
    }
    const signature = signData(hash, admin.encryptedPrivateKey);

    // ── Upload to IPFS ────────────────────────────────────────────────────────
    const cid = await uploadToIPFS(encryptedPaper);

    //  Blockchain record 
    const block = await addBlock({ cid, hash, paperId: paper._id, signedBy: userId });

    // Auto Destruction (TTL) 
    const releaseDate = new Date(releaseAt);
    const destroyAt = new Date(releaseDate.getTime() + examDurationHours * 60 * 60 * 1000);

    //  Save finalized paper 
    paper.encryptedPaper = encryptedPaper;
    paper.generatedHash = hash;
    paper.cid = cid;
    paper.signature = signature;
    paper.signedBy = userId as any;
    paper.releaseAt = releaseDate;
    paper.destroyAt = destroyAt;
    paper.reviewedBy = userId as any;
    paper.approvalsRequired = approvalsRequired;
    paper.thresholdEnabled = enableThreshold;
    paper.threshold = thresholdK;
    paper.totalShares = thresholdN;
    paper.finalized = true;
    await paper.save();

    //  Threshold Key Sharing 
    let sharesCreated = 0;
    if (enableThreshold && holderUserIds.length >= thresholdN) {
      const encryptionSecret = process.env.ENCRYPTION_SECRET!;
      const shares = splitSecret(encryptionSecret, thresholdN, thresholdK);

      for (let i = 0; i < thresholdN; i++) {
        await KeyShare.create({
          paperId: paper._id,
          userId: holderUserIds[i],
          shareIndex: i + 1,
          totalShares: thresholdN,
          threshold: thresholdK,
          shareData: shares[i],
        });
      }
      sharesCreated = thresholdN;
    }

    await createAuditLog({
      userId,
      action: "PAPER_FINALIZED",
      role: userRole,
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      details: { paperId, cid, hash, blockIndex: block.index, sharesCreated, destroyAt },
    });

    return Response.json({
      success: true,
      message: "Paper finalized, signed, encrypted, and pinned to IPFS",
      cid,
      hash,
      signature: signature.substring(0, 32) + "...", // preview only
      blockIndex: block.index,
      releaseAt,
      destroyAt: destroyAt.toISOString(),
      sharesCreated,
    });
  } catch (error) {
    console.error("FINALIZE ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
