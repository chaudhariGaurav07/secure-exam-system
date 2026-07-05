import Link from "next/link";
import { Shield, Lock, FileText, Users, CheckCircle, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-surface)" }}>
      {/* ── Top bar ── */}
      <header className="gov-topbar" role="banner">
        <div className="gov-logo">
          <div className="gov-logo-icon">
            <Shield size={20} />
          </div>
          <div>
            <div className="gov-logo-text">Secure Exam System</div>
            <div className="gov-logo-sub">Examination Management Portal</div>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          <Link href="/login" id="home-login-btn" className="btn btn-outline btn-sm"
            style={{ color: "white", borderColor: "rgba(165,187,243,0.5)" }}>
            Sign In to Portal
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(165,187,243,0.15)", border: "1px solid rgba(165,187,243,0.3)",
            borderRadius: 100, padding: "6px 16px", marginBottom: "1.5rem",
            fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--clr-primary-light)"
          }}>
            <Lock size={12} />
            End-to-End Encrypted Platform
          </div>

          <h1 id="hero-heading" className="hero-title">
            Secure, Transparent &amp;<br />Tamper-Proof Examinations
          </h1>
          <p className="hero-subtitle">
            Manage question banks, generate cryptographically signed exam papers,
            enforce multi-role approvals, and maintain a complete audit trail — all in one platform.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" id="hero-signin-btn" className="btn btn-primary btn-lg"
              style={{ background: "white", color: "var(--clr-primary)", border: "none", fontWeight: 800 }}>
              Access Portal
              <ArrowRight size={18} />
            </Link>
            <a href="#features" id="hero-features-btn" className="btn btn-lg"
              style={{ background: "transparent", color: "white", border: "2px solid rgba(165,187,243,0.4)" }}>
              See Features
            </a>
          </div>
        </div>

        {/* Floating stats */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "2rem", marginTop: "3rem",
          flexWrap: "wrap", position: "relative", zIndex: 1,
        }}>
          {[
            { label: "Role-Based Access", value: "4 Roles" },
            { label: "Encryption", value: "AES-256" },
            { label: "Digital Signatures", value: "RSA" },
            { label: "Audit Events", value: "Full Log" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(165,187,243,0.2)",
              borderRadius: 10, padding: "0.75rem 1.5rem", textAlign: "center", minWidth: 120,
            }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "white" }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--clr-primary-light)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" aria-labelledby="features-heading" style={{ background: "var(--clr-surface)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem 1rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 id="features-heading" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--clr-primary-dark)", margin: "0 0 0.5rem" }}>
              Platform Capabilities
            </h2>
            <p style={{ color: "var(--clr-text-muted)", maxWidth: 500, margin: "0 auto" }}>
              Every stage of exam management is secured with cryptographic guarantees and multi-party controls.
            </p>
          </div>
        </div>

        <div className="feature-grid">
          {[
            {
              icon: <Lock size={24} />,
              title: "Encrypted Question Bank",
              desc: "Questions are AES-256 encrypted at rest. Only authorized authors and reviewers can create and review them.",
              delay: "0.05s",
            },
            {
              icon: <CheckCircle size={24} />,
              title: "Multi-Role Approval",
              desc: "Papers require digital signatures from multiple stakeholders before finalization — no single point of trust.",
              delay: "0.1s",
            },
            {
              icon: <FileText size={24} />,
              title: "Cryptographic Paper Sealing",
              desc: "Finalized papers are IPFS-stored with RSA signatures. Any tampering is immediately detectable.",
              delay: "0.15s",
            },
            {
              icon: <Shield size={24} />,
              title: "Time-Locked Release",
              desc: "Papers are released only at the scheduled exam time. Threshold secret sharing prevents early decryption.",
              delay: "0.2s",
            },
            {
              icon: <Users size={24} />,
              title: "Role-Based Access Control",
              desc: "Admins, Authors, Reviewers, and Exam Centers each have precisely scoped permissions.",
              delay: "0.25s",
            },
            {
              icon: <FileText size={24} />,
              title: "Full Audit Trail",
              desc: "Every login, approval, rejection, and release is permanently logged with timestamps and IPs.",
              delay: "0.3s",
            },
          ].map((f) => (
            <div key={f.title} className="feature-card" style={{ animationDelay: f.delay }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        background: "linear-gradient(135deg, var(--clr-primary-dark), var(--clr-primary))",
        padding: "3rem 2rem", textAlign: "center", marginTop: "2rem",
      }}>
        <h2 style={{ color: "white", fontWeight: 800, margin: "0 0 0.75rem", fontSize: "1.5rem" }}>
          Ready to get started?
        </h2>
        <p style={{ color: "var(--clr-primary-light)", margin: "0 0 1.5rem" }}>
          Sign in with your credentials to access the exam management dashboard.
        </p>
        <Link href="/login" id="cta-signin-btn" className="btn btn-lg"
          style={{ background: "white", color: "var(--clr-primary)", fontWeight: 800, border: "none" }}>
          Sign In to Portal
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="gov-footer" role="contentinfo">
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} Secure Exam System. All rights reserved. &nbsp;|&nbsp;
          Built with end-to-end encryption, IPFS storage &amp; digital signatures.
        </p>
      </footer>
    </div>
  );
}