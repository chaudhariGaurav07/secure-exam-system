"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, LogOut, Bell } from "lucide-react";

interface NavbarProps {
  user: { name: string; role: string } | null;
}

const roleLabel: Record<string, string> = {
  admin: "Administrator",
  author: "Question Author",
  reviewer: "Reviewer",
  exam_center: "Exam Center",
};

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="gov-topbar" role="banner">
      {/* Logo */}
      <Link href="/dashboard" className="gov-logo" aria-label="Secure Exam System Home">
        <div className="gov-logo-icon">
          <Shield size={20} />
        </div>
        <div>
          <div className="gov-logo-text">Secure Exam System</div>
          <div className="gov-logo-sub">Examination Management Portal</div>
        </div>
      </Link>

      {/* Right actions */}
      <div className="gov-nav-actions">
        {user && (
          <>
            <button
              id="nav-notifications-btn"
              className="btn btn-ghost btn-icon"
              style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(165,187,243,0.25)" }}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>

            <div className="user-chip">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="user-name">{user.name || "User"}</div>
                <div className="user-role">{roleLabel[user.role] || user.role}</div>
              </div>
            </div>

            <button
              id="nav-logout-btn"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              style={{ color: "rgba(255,255,255,0.75)", border: "1px solid rgba(165,187,243,0.25)" }}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
