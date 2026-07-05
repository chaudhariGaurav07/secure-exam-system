"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      {/* Background circles */}
      <div aria-hidden style={{
        position: "absolute", top: "-80px", right: "-80px",
        width: 340, height: 340, borderRadius: "50%",
        background: "rgba(165,187,243,0.08)", pointerEvents: "none",
      }} />
      <div aria-hidden style={{
        position: "absolute", bottom: "-60px", left: "-60px",
        width: 260, height: 260, borderRadius: "50%",
        background: "rgba(165,187,243,0.06)", pointerEvents: "none",
      }} />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div>
            <div className="login-logo-icon">
              <Shield size={26} />
            </div>
          </div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--clr-primary-dark)", margin: "0 0 0.25rem" }}>
            Secure Exam System
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--clr-text-muted)", margin: 0 }}>
            Sign in to access the examination portal
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--clr-border)", margin: "0 0 1.5rem" }} />

        {/* Error */}
        {error && (
          <div className="info-box danger" style={{ marginBottom: "1.25rem" }} role="alert">
            <Lock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{
                  position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", color: "var(--clr-grey-02)", pointerEvents: "none",
                }} />
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{
                  position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", color: "var(--clr-grey-02)", pointerEvents: "none",
                }} />
                <input
                  id="login-password"
                  type={showPwd ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPwd((p) => !p)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--clr-grey-02)", padding: 4, lineHeight: 0,
                  }}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: "100%", marginTop: "0.25rem", justifyContent: "center" }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Signing In…
                </>
              ) : (
                <>
                  <Shield size={17} />
                  Sign In to Portal
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer note */}
        <div style={{ marginTop: "1.5rem", textAlign: "center", borderTop: "1px solid var(--clr-border)", paddingTop: "1rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--clr-text-muted)", margin: 0 }}>
            Access is restricted to authorized personnel only.
            <br />
            Contact your administrator if you need an account.
          </p>
          <Link href="/" id="back-to-home-link" style={{
            fontSize: "0.78rem", color: "var(--clr-primary)", fontWeight: 600,
            display: "inline-block", marginTop: "0.5rem",
          }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
