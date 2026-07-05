import { Shield, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Paper } from "@/models/Paper";

export default async function BlockchainPage() {
  await connectDB();
  const totalFinalized = await Paper.countDocuments({ finalized: true, cid: { $exists: true, $ne: null } });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title"><Shield size={22} /> Blockchain Ledger</h1>
        <p className="page-subtitle">Immutable record of all finalized exam papers stored on chain</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="gov-stat-card">
          <div className="gov-stat-icon blue"><Shield size={22} /></div>
          <div>
            <div className="gov-stat-value">{totalFinalized}</div>
            <div className="gov-stat-label">Papers on Ledger</div>
          </div>
        </div>
        <div className="gov-stat-card">
          <div className="gov-stat-icon green"><Lock size={22} /></div>
          <div>
            <div className="gov-stat-value">AES-256</div>
            <div className="gov-stat-label">Encryption Standard</div>
          </div>
        </div>
      </div>

      <div className="gov-card">
        <div className="section-title">How It Works</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            {
              step: "1",
              title: "Paper Generation",
              desc: "Questions are selected from the encrypted pool and assembled into an exam paper.",
            },
            {
              step: "2",
              title: "Digital Signing",
              desc: "Admin signs the paper hash using their RSA-2048 private key. The signature is stored permanently.",
            },
            {
              step: "3",
              title: "IPFS Upload",
              desc: "The encrypted paper is pinned to IPFS via Pinata, producing a content-addressed CID.",
            },
            {
              step: "4",
              title: "Chain Block Added",
              desc: "A block recording the CID, hash, signer, and timestamp is appended to the local chain.",
            },
            {
              step: "5",
              title: "Time-Locked Release",
              desc: "Paper is automatically released at the scheduled exam time. Auto-destroyed after exam window.",
            },
          ].map((item) => (
            <div key={item.step} style={{
              display: "flex", gap: "1rem", alignItems: "flex-start",
              padding: "1rem", background: "var(--clr-surface)", borderRadius: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: "var(--clr-primary)",
                color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.875rem", flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--clr-primary-dark)", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--clr-text-muted)" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--clr-border)" }}>
          <Link href="/dashboard/papers" id="blockchain-view-papers" className="btn btn-primary">
            View Exam Papers <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </>
  );
}
