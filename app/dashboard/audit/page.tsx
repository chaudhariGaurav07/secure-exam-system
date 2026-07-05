"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, RefreshCw, Search } from "lucide-react";
import { adminApi, type AuditLog } from "@/lib/api-client";

const ACTION_COLORS: Record<string, string> = {
  LOGIN:             "var(--clr-info)",
  LOGOUT:            "var(--clr-grey-02)",
  CREATE_QUESTION:   "var(--clr-success)",
  REVIEW_QUESTION:   "#856404",
  GENERATE_PAPER:    "var(--clr-primary)",
  FINALIZE_PAPER:    "var(--clr-primary-dark)",
  APPROVE_PAPER:     "var(--clr-success)",
  RELEASE_PAPER:     "var(--clr-danger)",
  REGISTER:          "var(--clr-success)",
};

const ACTIONS = [
  "LOGIN", "LOGOUT", "CREATE_QUESTION", "REVIEW_QUESTION",
  "GENERATE_PAPER", "APPROVE_PAPER", "FINALIZE_PAPER", "RELEASE_PAPER",
];

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { limit: "100" };
      if (filterAction) params.action = filterAction;
      const data = await adminApi.audit(params);
      setLogs(data.logs);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [filterAction]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function formatDate(d: string) {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.role.toLowerCase().includes(q) ||
      log.userId?.name?.toLowerCase().includes(q) ||
      log.userId?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 className="page-title"><ClipboardList size={22} /> Audit Log</h1>
            <p className="page-subtitle">Complete trail of all system events and user actions</p>
          </div>
          <button id="audit-refresh-btn" onClick={fetchLogs} className="btn btn-ghost btn-sm"><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="gov-card" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}>
        <div className="filter-row">
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={15} style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "var(--clr-grey-02)", pointerEvents: "none",
            }} />
            <input
              id="audit-search-input"
              type="text"
              className="form-input"
              placeholder="Search by user, action, role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clr-text-muted)", marginBottom: 4 }}>Action</div>
            <div className="chip-group">
              <button id="audit-action-all" className={`chip ${!filterAction ? "active" : ""}`} onClick={() => setFilterAction("")}>All</button>
              {ACTIONS.map((a) => (
                <button key={a} id={`audit-action-${a.toLowerCase()}`}
                  className={`chip ${filterAction === a ? "active" : ""}`}
                  onClick={() => setFilterAction(a)}>
                  {a.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "0.875rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {[
          { label: "Total Events", value: logs.length, color: "var(--clr-primary)" },
          { label: "Login Events", value: logs.filter((l) => l.action === "LOGIN").length, color: "var(--clr-info)" },
          { label: "Questions Created", value: logs.filter((l) => l.action === "CREATE_QUESTION").length, color: "var(--clr-success)" },
          { label: "Papers Released", value: logs.filter((l) => l.action === "RELEASE_PAPER").length, color: "var(--clr-danger)" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--clr-white)", border: "1px solid var(--clr-border)",
            borderRadius: 10, padding: "0.625rem 1.25rem", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="gov-card" style={{ padding: 0 }}>
        {error && <div className="info-box danger" style={{ margin: "1rem" }} role="alert">{error}</div>}

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
            <p style={{ color: "var(--clr-text-muted)", marginTop: "0.75rem" }}>Loading audit log…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No audit events found{search ? ` for "${search}"` : ""}.</div>
          </div>
        ) : (
          <div className="gov-table-wrap">
            <table className="gov-table" aria-label="System audit log">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>IP Address</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, idx) => (
                  <tr key={log._id}>
                    <td style={{ color: "var(--clr-grey-02)", fontSize: "0.78rem", fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td>
                      <span style={{
                        fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700,
                        color: ACTION_COLORS[log.action] || "var(--clr-primary)",
                        background: "var(--clr-surface)", padding: "2px 8px",
                        borderRadius: 4, display: "inline-block",
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{log.userId?.name ?? "System"}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--clr-text-muted)" }}>{log.userId?.email ?? "—"}</div>
                    </td>
                    <td>
                      <span className="badge badge-approved" style={{ textTransform: "capitalize" }}>{log.role}</span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--clr-grey-03)" }}>
                      {log.ip || "—"}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--clr-text-muted)", maxWidth: 200 }}>
                      {log.details ? (
                        <code style={{ fontSize: "0.72rem", wordBreak: "break-all" }}>
                          {JSON.stringify(log.details).slice(0, 60)}{JSON.stringify(log.details).length > 60 ? "…" : ""}
                        </code>
                      ) : "—"}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count footer */}
      {!loading && filtered.length > 0 && (
        <div style={{ textAlign: "center", padding: "0.75rem 0", fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>
          Showing {filtered.length} of {logs.length} events
        </div>
      )}
    </>
  );
}
