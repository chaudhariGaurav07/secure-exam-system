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

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value!;
  const payload = await verifyToken(token);

  await connectDB();

  const isAdmin = payload?.role === "admin";

  const [
    totalQuestions,
    pendingQuestions,
    approvedQuestions,
    rejectedQuestions,
    totalPapers,
    finalizedPapers,
    totalUsers,
    recentAudit,
  ] = await Promise.all([
    Question.countDocuments({}),
    Question.countDocuments({ status: "pending" }),
    Question.countDocuments({ status: "approved" }),
    Question.countDocuments({ status: "rejected" }),
    Paper.countDocuments({}),
    Paper.countDocuments({ finalized: true }),
    isAdmin ? User.countDocuments({}) : Promise.resolve(0),
    Audit.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("userId", "name email")
      .lean(),
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
    LOGIN:                "var(--clr-info)",
    LOGOUT:               "var(--clr-grey-02)",
    QUESTION_CREATED:     "var(--clr-success)",
    CREATE_QUESTION:      "var(--clr-success)",
    REVIEW_QUESTION:      "#856404",
    PAPER_SETS_GENERATED: "var(--clr-primary)",
    PAPER_APPROVED:       "var(--clr-success)",
    PAPER_FINALIZED:      "var(--clr-primary-dark)",
    PAPER_RELEASED:       "var(--clr-danger)",
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
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
        {isAdmin && (
          <div className="gov-stat-card">
            <div className="gov-stat-icon blue"><Users size={22} /></div>
            <div>
              <div className="gov-stat-value">{totalUsers}</div>
              <div className="gov-stat-label">Total Users</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions + Question status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="gov-card">
          <div className="section-title">Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {(payload?.role === "author" || payload?.role === "admin") && (
              <Link href="/dashboard/questions" id="qs-action-questions" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                <HelpCircle size={16} /> Manage Questions
              </Link>
            )}
            {payload?.role === "reviewer" && (
              <Link href="/dashboard/questions" id="qs-action-review" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                <HelpCircle size={16} /> Review Questions ({pendingQuestions} pending)
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
            {isAdmin && (
              <Link href="/dashboard/audit" id="qs-action-audit" className="btn btn-primary" style={{ justifyContent: "flex-start" }}>
                <AlertCircle size={16} /> Audit Log
              </Link>
            )}
          </div>
        </div>

        {/* Question status breakdown */}
        <div className="gov-card">
          <div className="section-title">Question Status Breakdown</div>
          {totalQuestions === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem 0" }}>
              <div className="empty-state-icon" style={{ fontSize: "2rem" }}>📭</div>
              <div className="empty-state-text">No questions yet.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { label: "Approved", count: approvedQuestions, color: "var(--clr-success)" },
                { label: "Pending", count: pendingQuestions, color: "var(--clr-warning)" },
                { label: "Rejected", count: rejectedQuestions, color: "var(--clr-danger)" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: "var(--clr-text-muted)" }}>{s.count} / {totalQuestions}</span>
                  </div>
                  <div style={{ height: 8, background: "var(--clr-linen)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 100, background: s.color,
                      width: totalQuestions ? `${Math.round((s.count / totalQuestions) * 100)}%` : "0%",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="gov-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Recent System Activity</div>
          {isAdmin && (
            <Link href="/dashboard/audit" id="dashboard-view-full-audit" className="btn btn-ghost btn-sm">
              View Full Log →
            </Link>
          )}
        </div>

        {recentAudit.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No activity recorded yet. Events appear here as users interact with the system.</div>
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
                {recentAudit.map((log) => {
                  const logDoc = log as {
                    _id: unknown;
                    action: string;
                    role: string;
                    createdAt: Date;
                    userId?: { name: string; email: string };
                  };
                  return (
                    <tr key={String(logDoc._id)}>
                      <td>
                        <span style={{
                          fontWeight: 700, fontSize: "0.78rem",
                          color: actionColor[logDoc.action] || "var(--clr-primary)",
                          fontFamily: "monospace",
                          background: "var(--clr-surface)",
                          padding: "2px 8px", borderRadius: 4,
                          display: "inline-block",
                        }}>
                          {logDoc.action}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {logDoc.userId?.name ?? "System"}
                        {logDoc.userId?.email && (
                          <div style={{ fontSize: "0.72rem", color: "var(--clr-text-muted)" }}>{logDoc.userId.email}</div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-approved" style={{ textTransform: "capitalize" }}>
                          {logDoc.role}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>
                        {formatTime(logDoc.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
