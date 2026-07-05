import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Settings, Shield, Mail, User as UserIcon } from "lucide-react";

const roleLabel: Record<string, string> = {
  admin: "Administrator",
  author: "Question Author",
  reviewer: "Reviewer",
  exam_center: "Exam Center",
};

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value!;
  const payload = await verifyToken(token);

  await connectDB();
  const user = await User.findById(payload?.id).select("name email role createdAt publicKey").lean() as {
    _id: unknown; name: string; email: string; role: string; createdAt: Date; publicKey?: string;
  } | null;

  if (!user) return null;

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title"><Settings size={22} /> Account Settings</h1>
        <p className="page-subtitle">Your profile and security information</p>
      </div>

      {/* Profile card */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        <div className="gov-card">
          <div className="section-title">Profile Information</div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", fontWeight: 900, color: "white", flexShrink: 0,
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--clr-primary-dark)" }}>{user.name}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--clr-text-muted)" }}>{user.email}</div>
              <span className="badge badge-approved" style={{ marginTop: 4, textTransform: "capitalize" }}>
                {roleLabel[user.role] || user.role}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { icon: <UserIcon size={15} />, label: "Full Name", value: user.name },
              { icon: <Mail size={15} />, label: "Email Address", value: user.email },
              { icon: <Shield size={15} />, label: "Role", value: roleLabel[user.role] || user.role },
              { icon: <Settings size={15} />, label: "Account Created", value: formatDate(user.createdAt) },
            ].map((row) => (
              <div key={row.label} style={{
                display: "flex", gap: "0.75rem", alignItems: "center",
                padding: "0.625rem 0.875rem",
                background: "var(--clr-surface)", borderRadius: 8,
              }}>
                <span style={{ color: "var(--clr-primary)", flexShrink: 0 }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clr-grey-02)", letterSpacing: "0.04em" }}>{row.label}</div>
                  <div style={{ fontWeight: 600, color: "var(--clr-text-dark)", fontSize: "0.875rem" }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security info */}
        <div className="gov-card">
          <div className="section-title">Security & Keys</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div className="info-box info">
              <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Digital Signature Key</div>
                <div style={{ fontSize: "0.82rem" }}>
                  {user.publicKey ? "RSA-2048 key pair is configured for this account." : "No signing key found. Contact admin."}
                </div>
              </div>
            </div>

            {user.publicKey && (
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clr-grey-02)", marginBottom: 4 }}>
                  Public Key (preview)
                </div>
                <div style={{
                  fontFamily: "monospace", fontSize: "0.72rem", wordBreak: "break-all",
                  background: "var(--clr-surface)", padding: "0.75rem", borderRadius: 8,
                  color: "var(--clr-primary)", border: "1px solid var(--clr-border)",
                  maxHeight: 120, overflow: "hidden", position: "relative",
                }}>
                  {user.publicKey.slice(0, 200)}…
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
                    background: "linear-gradient(transparent, var(--clr-surface))",
                  }} />
                </div>
              </div>
            )}

            <div className="info-box warning">
              <div style={{ fontSize: "0.82rem" }}>
                <strong>Password changes</strong> must be done through your system administrator.
                Private keys are AES-256 encrypted and never exposed.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
