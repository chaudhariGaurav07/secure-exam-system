import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Question } from "@/models/Question";
import { Paper } from "@/models/Paper";
import { Audit } from "@/models/Audit";
import { User } from "@/models/User";
import {
  HelpCircle, FileText, BookOpen, Users,
  CheckCircle, Clock, AlertCircle, Activity,
} from "lucide-react";
import Link from "next/link";

interface AuditDoc {
  _id: string;
  action: string;
  role: string;
  createdAt: Date;
  userId?: { name: string; email: string };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value!;
  const payload = await verifyToken(token);

  await connectDB();

  const [
    totalQuestions,
    pendingQuestions,
    approvedQuestions,
    totalPapers,
    finalizedPapers,
    totalUsers,
    recentAudit,
  ] = await Promise.all([
    Question.countDocuments({}),
    Question.countDocuments({ status: "pending" }),
    Question.countDocuments({ status: "approved" }),
    Paper.countDocuments({}),
    Paper.countDocuments({ finalized: true }),
    payload?.role === "admin" ? User.countDocuments({}) : Promise.resolve(null),
    Audit.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("userId", "name email")
      .lean() as Promise<AuditDoc[]>,
  ]);

  const roleLabel: Record<string, string> = {
    admin: "Administrator",
    author: "Question Author",
    reviewer: "Reviewer",
    exam_center: "Exam Center",
  };

  function formatTime(d: Date | string) {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const actionColor: Record<string, string> = {
    LOGIN: "var(--clr-info)",
    LOGOUT: "var(--clr-grey-02)",
    CREATE_QUESTION: "var(--clr-success)",
    REVIEW_QUESTION: "var(--clr-warning)",
    GENERATE_PAPER: "var(--clr-primary)",
    FINALIZE_PAPER: "var(--clr-primary-dark)",
    APPROVE_PAPER: "var(--clr-success)",
    RELEASE_PAPER: "var(--clr-danger)",
  };

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">
          <Activity size={22} />
          Dashboard Overview
        </h1>
        <p className="page-subtitle">
          Welcome back — {roleLabel[payload?.role ?? ""] || payload?.role}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="gov-stat-card">
          <div className="gov-stat-icon blue"><HelpCircle size={22} /></div>
          <div>
            <div className="gov-stat-value">{totalQuestions}</div>
            <div className="gov-stat-label">Total Questions</div>
          </div>
        </div>
        <div className="gov-stat-card">
          <div className="gov-stat-icon yellow"><Clock size={22} /></div>
          <div>
            <div className="gov-stat-value">{pendingQuestions}</div>
            <div className="gov-stat-label">Pending Review</div>
          </div>
        </div>
        <div className="gov-stat-card">
          <div className="gov-stat-icon green"><CheckCircle size={22} /></div>
          <div>
            <div className="gov-stat-value">{approvedQuestions}</div>
            <div className="gov-stat-label">Approved Questions</div>
          </div>
        </div>
        <div className="gov-stat-card">
          <div className="gov-stat-icon blue"><FileText size={22} /></div>
          <div>
            <div className="gov-stat-value">{totalPapers}</div>
            <div className="gov-stat-label">Exam Papers</div>
          </div>
        </div>
        <div className="gov-stat-card">
          <div className="gov-stat-icon green"><BookOpen size={22} /></div>
          <div>
            <div className="gov-stat-value">{finalizedPapers}</div>
            <div className="gov-stat-label">Finalized Papers</div>
          </div>
        </div>
        {payload?.role === "admin" && totalUsers !== null && (
          <div className="gov-stat-card">
            <div className="gov-stat-icon blue"><Users size={22} /></div>
            <div>
              <div className="gov-stat-value">{totalUsers}</div>
              <div className="gov-stat-label">Total Users</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="gov-card">
          <div className="section-title">Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {(payload?.role === "author" || payload?.role === "admin") && (
              <Link href="/dashboard/questions" id="qs-action-questions" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                <HelpCircle size={16} /> Manage Questions
              </Link>
            )}
            {(payload?.role === "author" || payload?.role === "admin") && (
              <Link href="/dashboard/templates" id="qs-action-templates" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                <BookOpen size={16} /> Exam Templates
              </Link>
            )}
            <Link href="/dashboard/papers" id="qs-action-papers" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
              <FileText size={16} /> View Exam Papers
            </Link>
            {payload?.role === "admin" && (
              <Link href="/dashboard/audit" id="qs-action-audit" className="btn btn-primary" style={{ justifyContent: "flex-start" }}>
                <AlertCircle size={16} /> Audit Log
              </Link>
            )}
          </div>
        </div>

        {/* Question status breakdown */}
        <div className="gov-card">
          <div className="section-title">Question Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { label: "Pending", count: pendingQuestions, total: totalQuestions, color: "var(--clr-warning)" },
              { label: "Approved", count: approvedQuestions, total: totalQuestions, color: "var(--clr-success)" },
              { label: "Rejected", count: totalQuestions - pendingQuestions - approvedQuestions, total: totalQuestions, color: "var(--clr-danger)" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "var(--clr-text-dark)" }}>{s.label}</span>
                  <span style={{ color: "var(--clr-text-muted)" }}>{s.count} / {s.total}</span>
                </div>
                <div style={{ height: 8, background: "var(--clr-linen)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 100,
                    background: s.color,
                    width: s.total ? `${Math.round((s.count / s.total) * 100)}%` : "0%",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="gov-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Recent Activity</div>
          {payload?.role === "admin" && (
            <Link href="/dashboard/audit" id="dashboard-view-full-audit" className="btn btn-ghost btn-sm">
              View Full Log →
            </Link>
          )}
        </div>

        {recentAudit.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No activity recorded yet.</div>
          </div>
        ) : (
          <div className="gov-table-wrap">
            <table className="gov-table" aria-label="Recent audit activity">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentAudit.map((log) => (
                  <tr key={String(log._id)}>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: "0.78rem",
                        color: actionColor[log.action] || "var(--clr-primary)",
                        fontFamily: "monospace",
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {log.userId?.name ?? "—"}
                      {log.userId?.email && (
                        <div style={{ fontSize: "0.72rem", color: "var(--clr-text-muted)" }}>{log.userId.email}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-approved" style={{ textTransform: "capitalize" }}>
                        {log.role}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>
                      {formatTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
