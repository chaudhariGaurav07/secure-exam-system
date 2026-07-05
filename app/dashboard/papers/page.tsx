"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, RefreshCw, Check, Lock, Unlock, Send } from "lucide-react";
import { papersApi, templatesApi, type Paper, type Template } from "@/lib/api-client";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filterFinalized, setFilterFinalized] = useState("");

  // Generate modal
  const [genOpen, setGenOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  // Finalize modal
  const [finalOpen, setFinalOpen] = useState(false);
  const [finalPaperId, setFinalPaperId] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [finalForm, setFinalForm] = useState({
    releaseAt: "",
    examDurationHours: 3,
    approvalsRequired: 2,
    enableThreshold: false,
    thresholdK: 2,
    thresholdN: 3,
  });

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Paper | null>(null);

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: "15" };
      if (filterFinalized) params.finalized = filterFinalized;
      const data = await papersApi.list(params);
      setPapers(data.papers);
      setPagination(data.pagination);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [page, filterFinalized]);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  useEffect(() => {
    templatesApi.list().then((d) => setTemplates(d.templates)).catch(() => {});
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return;
    setGenerating(true);
    setGenError("");
    try {
      await papersApi.generate(selectedTemplate);
      setGenOpen(false);
      setSelectedTemplate("");
      fetchPapers();
    } catch (e) {
      setGenError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove(paperId: string) {
    if (!confirm("Approve this exam paper?")) return;
    try {
      await papersApi.approve(paperId);
      fetchPapers();
    } catch (e) { alert(String(e)); }
  }

  async function handleFinalize(e: React.FormEvent) {
    e.preventDefault();
    setFinalizing(true);
    try {
      await papersApi.finalize({ paperId: finalPaperId, ...finalForm });
      setFinalOpen(false);
      fetchPapers();
    } catch (e) { alert(String(e)); } finally { setFinalizing(false); }
  }

  async function handleRelease(paperId: string) {
    if (!confirm("Release this paper? This action is irreversible.")) return;
    try {
      await papersApi.release(paperId);
      fetchPapers();
    } catch (e) { alert(String(e)); }
  }

  function formatDate(d?: string) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n) + "…" : s; }

  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 className="page-title"><FileText size={22} /> Exam Papers</h1>
            <p className="page-subtitle">Generate, approve, finalize, and release exam papers</p>
          </div>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button id="papers-refresh-btn" onClick={fetchPapers} className="btn btn-ghost btn-sm"><RefreshCw size={15} /></button>
            <button id="papers-generate-btn" onClick={() => setGenOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Generate Paper
            </button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="gov-card" style={{ marginBottom: "1.25rem", padding: "0.875rem 1.25rem" }}>
        <div className="filter-row">
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--clr-text-muted)" }}>Status:</span>
          <div className="chip-group">
            {[
              { label: "All", value: "" },
              { label: "Draft", value: "false" },
              { label: "Finalized", value: "true" },
            ].map((f) => (
              <button key={f.label} id={`filter-papers-${f.label.toLowerCase()}`}
                className={`chip ${filterFinalized === f.value ? "active" : ""}`}
                onClick={() => { setFilterFinalized(f.value); setPage(1); }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="gov-card" style={{ padding: 0 }}>
        {error && <div className="info-box danger" style={{ margin: "1rem" }} role="alert">{error}</div>}

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
            <p style={{ color: "var(--clr-text-muted)", marginTop: "0.75rem" }}>Loading papers…</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No exam papers generated yet.</div>
            <button id="empty-generate-btn" className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setGenOpen(true)}>
              <Plus size={15} /> Generate First Paper
            </button>
          </div>
        ) : (
          <>
            <div className="gov-table-wrap">
              <table className="gov-table" aria-label="Exam papers">
                <thead>
                  <tr>
                    <th>Set #</th>
                    <th>Template</th>
                    <th>Status</th>
                    <th>Approvals</th>
                    <th>Release At</th>
                    <th>IPFS CID</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <span style={{ fontWeight: 800, color: "var(--clr-primary-dark)", fontSize: "1rem" }}>#{p.setNumber}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.templateId?.title ?? "—"}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--clr-text-muted)" }}>{p.templateId?.subject} · {p.templateId?.totalMarks} marks</div>
                      </td>
                      <td>
                        <StatusBadge status={p.finalized ? "finalized" : "pending"} />
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{p.approvals.length}</span>
                        <span style={{ color: "var(--clr-grey-02)", fontSize: "0.8rem" }}> / {p.approvalsRequired}</span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(p.releaseAt)}
                      </td>
                      <td style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--clr-primary)" }}>
                        {p.cid ? (
                          <a href={`https://ipfs.io/ipfs/${p.cid}`} target="_blank" rel="noreferrer" title={p.cid}>
                            {truncate(p.cid, 12)}
                          </a>
                        ) : "—"}
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(p.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <button id={`detail-btn-${p._id}`} className="btn btn-ghost btn-sm"
                            onClick={() => { setSelected(p); setDetailOpen(true); }}>
                            Details
                          </button>
                          {!p.finalized && p.approvals.length < p.approvalsRequired && (
                            <button id={`approve-btn-${p._id}`} className="btn btn-success btn-sm"
                              onClick={() => handleApprove(p._id)}>
                              <Check size={13} /> Approve
                            </button>
                          )}
                          {!p.finalized && p.approvals.length >= p.approvalsRequired && (
                            <button id={`finalize-btn-${p._id}`} className="btn btn-primary btn-sm"
                              onClick={() => { setFinalPaperId(p._id); setFinalOpen(true); }}>
                              <Lock size={13} /> Finalize
                            </button>
                          )}
                          {p.finalized && p.releaseAt && new Date(p.releaseAt) <= new Date() && (
                            <button id={`release-btn-${p._id}`} className="btn btn-danger btn-sm"
                              onClick={() => handleRelease(p._id)}>
                              <Unlock size={13} /> Release
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination" style={{ padding: "0.875rem 1rem" }}>
              <span>Showing {(pagination.page - 1) * 15 + 1}–{Math.min(pagination.page * 15, pagination.total)} of {pagination.total}</span>
              <div className="pagination-btns">
                <button id="papers-prev-btn" className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                <button id="papers-next-btn" className="btn btn-ghost btn-sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Generate Paper Modal ─── */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate Exam Paper"
        footer={
          <>
            <button id="gen-cancel-btn" className="btn btn-ghost" onClick={() => setGenOpen(false)} disabled={generating}>Cancel</button>
            <button id="gen-submit-btn" form="gen-paper-form" type="submit" className="btn btn-primary" disabled={generating || !selectedTemplate}>
              {generating ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating…</> : <><Send size={14} /> Generate</>}
            </button>
          </>
        }
      >
        {genError && <div className="info-box danger" style={{ marginBottom: "1rem" }} role="alert">{genError}</div>}
        <form id="gen-paper-form" onSubmit={handleGenerate}>
          <div className="form-group">
            <label htmlFor="gen-template-select" className="form-label">Select Template *</label>
            <select id="gen-template-select" className="form-input" value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)} required>
              <option value="">Choose a template…</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>{t.title} — {t.subject} ({t.totalMarks} marks)</option>
              ))}
            </select>
            <span className="form-hint">Questions are automatically selected from the approved question bank.</span>
          </div>
        </form>
      </Modal>

      {/* ─── Finalize Paper Modal ─── */}
      <Modal open={finalOpen} onClose={() => setFinalOpen(false)} title="Finalize &amp; Seal Paper" maxWidth="520px"
        footer={
          <>
            <button id="final-cancel-btn" className="btn btn-ghost" onClick={() => setFinalOpen(false)} disabled={finalizing}>Cancel</button>
            <button id="final-submit-btn" form="finalize-paper-form" type="submit" className="btn btn-primary" disabled={finalizing}>
              {finalizing ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Finalizing…</> : <><Lock size={14} /> Seal Paper</>}
            </button>
          </>
        }
      >
        <div className="info-box warning" style={{ marginBottom: "1rem" }}>
          <div>Once finalized, the paper is encrypted and sealed. This cannot be undone.</div>
        </div>
        <form id="finalize-paper-form" onSubmit={handleFinalize}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="final-release-at" className="form-label">Release Date &amp; Time *</label>
              <input id="final-release-at" type="datetime-local" className="form-input"
                value={finalForm.releaseAt} onChange={(e) => setFinalForm({ ...finalForm, releaseAt: e.target.value })} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div className="form-group">
                <label htmlFor="final-duration" className="form-label">Duration (hrs)</label>
                <input id="final-duration" type="number" min={1} className="form-input"
                  value={finalForm.examDurationHours} onChange={(e) => setFinalForm({ ...finalForm, examDurationHours: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label htmlFor="final-approvals" className="form-label">Approvals Required</label>
                <input id="final-approvals" type="number" min={1} className="form-input"
                  value={finalForm.approvalsRequired} onChange={(e) => setFinalForm({ ...finalForm, approvalsRequired: Number(e.target.value) })} />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>
              <input id="final-threshold" type="checkbox" checked={finalForm.enableThreshold}
                onChange={(e) => setFinalForm({ ...finalForm, enableThreshold: e.target.checked })} />
              Enable Threshold Secret Sharing
            </label>
            {finalForm.enableThreshold && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", paddingLeft: "1rem", borderLeft: "2px solid var(--clr-primary-light)" }}>
                <div className="form-group">
                  <label htmlFor="final-threshold-k" className="form-label">Threshold K</label>
                  <input id="final-threshold-k" type="number" min={2} className="form-input"
                    value={finalForm.thresholdK} onChange={(e) => setFinalForm({ ...finalForm, thresholdK: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label htmlFor="final-threshold-n" className="form-label">Total Shares N</label>
                  <input id="final-threshold-n" type="number" min={2} className="form-input"
                    value={finalForm.thresholdN} onChange={(e) => setFinalForm({ ...finalForm, thresholdN: Number(e.target.value) })} />
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ─── Detail Modal ─── */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Paper #${selected?.setNumber ?? ""} Details`} maxWidth="520px">
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { label: "Status", value: <StatusBadge status={selected.finalized ? "finalized" : "pending"} /> },
                { label: "Set Number", value: `#${selected.setNumber}` },
                { label: "Template", value: selected.templateId?.title ?? "—" },
                { label: "Subject", value: selected.templateId?.subject ?? "—" },
                { label: "Total Marks", value: selected.templateId?.totalMarks ? `${selected.templateId.totalMarks}` : "—" },
                { label: "Approvals", value: `${selected.approvals.length} / ${selected.approvalsRequired}` },
                { label: "Release At", value: formatDate(selected.releaseAt) },
                { label: "Auto-Destroy At", value: formatDate(selected.destroyAt) },
              ].map((r) => (
                <div key={r.label} style={{ background: "var(--clr-surface)", borderRadius: 8, padding: "0.625rem 0.875rem" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clr-grey-02)", marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontWeight: 600, color: "var(--clr-primary-dark)" }}>{r.value}</div>
                </div>
              ))}
            </div>
            {selected.generatedHash && (
              <div>
                <div className="section-title">Integrity Hash</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.72rem", wordBreak: "break-all",
                  background: "var(--clr-surface)", padding: "0.625rem", borderRadius: 6,
                  color: "var(--clr-primary)", border: "1px solid var(--clr-border)" }}>
                  {selected.generatedHash}
                </div>
              </div>
            )}
            {selected.cid && (
              <div className="info-box info">
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>IPFS Storage</div>
                  <a href={`https://ipfs.io/ipfs/${selected.cid}`} target="_blank" rel="noreferrer"
                    style={{ fontFamily: "monospace", fontSize: "0.78rem", wordBreak: "break-all" }}>
                    {selected.cid}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
