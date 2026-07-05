"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, RefreshCw, Trash2 } from "lucide-react";
import { templatesApi, type Template, type StructureBlock } from "@/lib/api-client";
import Modal from "@/components/ui/Modal";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "History", "Geography"];

const emptyBlock = (): StructureBlock => ({
  questionNo: "", subQuestion: "", marks: 1, candidatesNeeded: 1,
});

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    title: "", subject: "", totalMarks: 100,
    structure: [emptyBlock()],
  });

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await templatesApi.list();
      setTemplates(data.templates);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      await templatesApi.create(form);
      setCreateOpen(false);
      setForm({ title: "", subject: "", totalMarks: 100, structure: [emptyBlock()] });
      fetchTemplates();
    } catch (e) {
      setCreateError(String(e));
    } finally {
      setCreating(false);
    }
  }

  function addBlock() {
    setForm((f) => ({ ...f, structure: [...f.structure, emptyBlock()] }));
  }
  function removeBlock(i: number) {
    setForm((f) => ({ ...f, structure: f.structure.filter((_, idx) => idx !== i) }));
  }
  function updateBlock(i: number, key: keyof StructureBlock, value: string | number) {
    setForm((f) => ({
      ...f,
      structure: f.structure.map((b, idx) => idx === i ? { ...b, [key]: value } : b),
    }));
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 className="page-title"><BookOpen size={22} /> Exam Templates</h1>
            <p className="page-subtitle">Define question paper structure and marks distribution</p>
          </div>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button id="templates-refresh-btn" onClick={fetchTemplates} className="btn btn-ghost btn-sm"><RefreshCw size={15} /></button>
            <button id="templates-create-btn" onClick={() => setCreateOpen(true)} className="btn btn-primary">
              <Plus size={16} /> New Template
            </button>
          </div>
        </div>
      </div>

      {error && <div className="info-box danger" style={{ marginBottom: "1rem" }} role="alert">{error}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
          <p style={{ color: "var(--clr-text-muted)", marginTop: "0.75rem" }}>Loading templates…</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="gov-card">
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-text">No templates yet. Create one to start generating exam papers.</div>
            <button id="empty-template-btn" className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Create Template
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {templates.map((t) => (
            <div key={t._id} className="gov-card" style={{ cursor: "pointer" }}
              onClick={() => { setSelected(t); setDetailOpen(true); }}
              role="button" tabIndex={0} aria-label={`View template ${t.title}`}
              onKeyDown={(e) => { if (e.key === "Enter") { setSelected(t); setDetailOpen(true); } }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--clr-primary-dark)", marginBottom: 2 }}>{t.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>{t.subject}</div>
                </div>
                <div style={{
                  background: "var(--clr-primary-lightest)", color: "var(--clr-primary-dark)",
                  borderRadius: 8, padding: "4px 10px", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0,
                }}>
                  {t.totalMarks} marks
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--clr-border)", paddingTop: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clr-grey-02)", marginBottom: "0.5rem" }}>
                  Structure ({t.structure.length} blocks)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {t.structure.slice(0, 3).map((b, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: "0.8rem", color: "var(--clr-text-muted)",
                      background: "var(--clr-surface)", borderRadius: 6, padding: "3px 8px",
                    }}>
                      <span>Q{b.questionNo}{b.subQuestion}</span>
                      <span style={{ fontWeight: 600 }}>{b.marks} marks × {b.candidatesNeeded}</span>
                    </div>
                  ))}
                  {t.structure.length > 3 && (
                    <div style={{ fontSize: "0.75rem", color: "var(--clr-primary)", fontWeight: 600 }}>
                      + {t.structure.length - 3} more blocks…
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--clr-grey-02)" }}>
                Created by {t.createdBy?.name ?? "—"} · {formatDate(t.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Create Template Modal ─── */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setCreateError(""); }}
        title="New Exam Template"
        maxWidth="640px"
        footer={
          <>
            <button id="template-cancel-btn" className="btn btn-ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</button>
            <button id="template-submit-btn" form="create-template-form" type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : "Create Template"}
            </button>
          </>
        }
      >
        {createError && <div className="info-box danger" style={{ marginBottom: "1rem" }} role="alert">{createError}</div>}
        <form id="create-template-form" onSubmit={handleCreate} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="tpl-title" className="form-label">Template Title *</label>
                <input id="tpl-title" type="text" className="form-input" placeholder="e.g. Mid-Term Mathematics"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="tpl-subject" className="form-label">Subject *</label>
                <select id="tpl-subject" className="form-input" value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                  <option value="">Select subject…</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="tpl-marks" className="form-label">Total Marks *</label>
                <input id="tpl-marks" type="number" min={1} className="form-input"
                  value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })} required />
              </div>
            </div>

            {/* Structure blocks */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Question Structure</div>
                <button type="button" id="add-block-btn" className="btn btn-outline btn-sm" onClick={addBlock}>
                  <Plus size={14} /> Add Block
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {form.structure.map((block, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "80px 80px 80px 100px 32px",
                    gap: "0.5rem", alignItems: "end",
                    background: "var(--clr-surface)", borderRadius: 8, padding: "0.625rem",
                  }}>
                    <div className="form-group" style={{ gap: 2 }}>
                      <label className="form-label" style={{ fontSize: "0.65rem" }}>Q.No</label>
                      <input type="text" className="form-input" placeholder="1"
                        value={block.questionNo}
                        onChange={(e) => updateBlock(i, "questionNo", e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.82rem" }} />
                    </div>
                    <div className="form-group" style={{ gap: 2 }}>
                      <label className="form-label" style={{ fontSize: "0.65rem" }}>Sub-Q</label>
                      <input type="text" className="form-input" placeholder="a"
                        value={block.subQuestion}
                        onChange={(e) => updateBlock(i, "subQuestion", e.target.value)}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.82rem" }} />
                    </div>
                    <div className="form-group" style={{ gap: 2 }}>
                      <label className="form-label" style={{ fontSize: "0.65rem" }}>Marks</label>
                      <input type="number" min={1} className="form-input"
                        value={block.marks}
                        onChange={(e) => updateBlock(i, "marks", Number(e.target.value))}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.82rem" }} />
                    </div>
                    <div className="form-group" style={{ gap: 2 }}>
                      <label className="form-label" style={{ fontSize: "0.65rem" }}>Candidates</label>
                      <input type="number" min={1} className="form-input"
                        value={block.candidatesNeeded}
                        onChange={(e) => updateBlock(i, "candidatesNeeded", Number(e.target.value))}
                        style={{ padding: "0.4rem 0.5rem", fontSize: "0.82rem" }} />
                    </div>
                    <button type="button" id={`remove-block-${i}`} className="btn btn-danger btn-icon btn-sm"
                      onClick={() => removeBlock(i)} disabled={form.structure.length === 1}
                      title="Remove block" aria-label="Remove structure block">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── Detail Modal ─── */}
      <Modal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelected(null); }}
        title={selected?.title ?? "Template Details"}
        maxWidth="560px"
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { label: "Subject", value: selected.subject },
                { label: "Total Marks", value: String(selected.totalMarks) },
                { label: "Created By", value: selected.createdBy?.name ?? "—" },
                { label: "Created On", value: formatDate(selected.createdAt) },
              ].map((r) => (
                <div key={r.label} style={{ background: "var(--clr-surface)", borderRadius: 8, padding: "0.625rem 0.875rem" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clr-grey-02)", marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontWeight: 600, color: "var(--clr-primary-dark)" }}>{r.value}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="section-title">Question Structure</div>
              <div className="gov-table-wrap">
                <table className="gov-table">
                  <thead>
                    <tr><th>Q.No</th><th>Sub-Q</th><th>Marks</th><th>Candidates</th></tr>
                  </thead>
                  <tbody>
                    {selected.structure.map((b, i) => (
                      <tr key={i}>
                        <td>{b.questionNo}</td>
                        <td>{b.subQuestion}</td>
                        <td><strong>{b.marks}</strong></td>
                        <td>{b.candidatesNeeded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
