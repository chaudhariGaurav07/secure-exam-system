import { connectDB } from "@/lib/db";
import { Paper } from "@/models/Paper";
import { User } from "@/models/User";
import { verifySignature } from "@/lib/digital-signature";

interface RouteParams {
  params: Promise<{ paperId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await connectDB();

    const { paperId } = await params;
    const paper = await Paper.findById(paperId);

    if (!paper) {
      return Response.json({ success: false, error: "Paper not found" }, { status: 404 });
    }
    if (!paper.signature || !paper.signedBy) {
      return Response.json({ success: false, error: "Paper has no digital signature" }, { status: 400 });
    }

    // Fetch the signer's public key from the database
    const signer = await User.findById(paper.signedBy).select("publicKey name email role");
    if (!signer?.publicKey) {
      return Response.json({ success: false, error: "Signer not found" }, { status: 404 });
    }

    // Verify the signature against the stored hash
    const isValid = verifySignature(paper.generatedHash, paper.signature, signer.publicKey);

    return Response.json({
      success: true,
      valid:   isValid,
      paperId,
      hash:    paper.generatedHash,
      signer: {
        id:    signer._id,
        name:  signer.name,
        email: signer.email,
        role:  signer.role,
      },
      message: isValid
        ? "Signature is VALID — paper has not been tampered with"
        : "Signature is INVALID — paper may have been tampered with",
    });
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
