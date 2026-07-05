"use client";

import { useState, useEffect, useCallback } from "react";
import { HelpCircle, Plus, RefreshCw, Filter, CheckCircle, XCircle } from "lucide-react";
import { questionsApi, type Question } from "@/lib/api-client";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science", "History", "Geography"];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const STATUSES = ["pending", "approved", "rejected"] as const;

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [page, setPage] = useState(1);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    question: "", subject: "", module: "", marks: 1,
    difficulty: "easy" as "easy" | "medium" | "hard", isRepeated: false,
  });

  // Review modal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewQuestion, setReviewQuestion] = useState<Question | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: "15" };
      if (filterStatus) params.status = filterStatus;
      if (filterDifficulty) params.difficulty = filterDifficulty;
      if (filterSubject) params.subject = filterSubject;

      const data = await questionsApi.list(params);
      setQuestions(data.questions);
      setPagination(data.pagination);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterDifficulty, filterSubject]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      await questionsApi.create(form);
      setCreateOpen(false);
      setForm({ question: "", subject: "", module: "", marks: 1, difficulty: "easy", isRepeated: false });
      fetchQuestions();
    } catch (e) {
      setCreateError(String(e));
    } finally {
      setCreating(false);
    }
  }

  async function handleReview(status: "approved" | "rejected") {
    if (!reviewQuestion) return;
    setReviewing(true);
    try {
      await questionsApi.review({ questionId: reviewQuestion._id, status, feedback: reviewFeedback });
      setReviewOpen(false);
      setReviewQuestion(null);
      setReviewFeedback("");
      fetchQuestions();
    } catch (e) {
      alert(String(e));
    } finally {
      setReviewing(false);
    }
  }

  function openReview(q: Question) {
    setReviewQuestion(q);
    setReviewFeedback("");
    setReviewOpen(true);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 className="page-title"><HelpCircle size={22} /> Question Bank</h1>
            <p className="page-subtitle">Manage, review, and approve exam questions</p>
          </div>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button id="questions-refresh-btn" onClick={fetchQuestions} className="btn btn-ghost btn-sm" title="Refresh">
              <RefreshCw size={15} className={loading ? "spinning" : ""} />
            </button>
            <button id="questions-create-btn" onClick={() => setCreateOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Add Question
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="gov-card" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}>
        <div className="filter-row">
          <Filter size={15} style={{ color: "var(--clr-grey-02)" }} />
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clr-text-muted)", marginBottom: 4 }}>Status</div>
            <div className="chip-group">
              <button id="filter-status-all" className={`chip ${!filterStatus ? "active" : ""}`} onClick={() => { setFilterStatus(""); setPage(1); }}>All</button>
              {STATUSES.map((s) => (
                <button key={s} id={`filter-status-${s}`} className={`chip ${filterStatus === s ? "active" : ""}`}
                  onClick={() => { setFilterStatus(s); setPage(1); }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clr-text-muted)", marginBottom: 4 }}>Difficulty</div>
            <div className="chip-group">
              <button id="filter-diff-all" className={`chip ${!filterDifficulty ? "active" : ""}`} onClick={() => { setFilterDifficulty(""); setPage(1); }}>All</button>
              {DIFFICULTIES.map((d) => (
                <button key={d} id={`filter-diff-${d}`} className={`chip ${filterDifficulty === d ? "active" : ""}`}
                  onClick={() => { setFilterDifficulty(d); setPage(1); }}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--clr-text-muted)", marginBottom: 4 }}>Subject</div>
            <select id="filter-subject" className="form-input" style={{ height: 32, padding: "0 0.625rem", fontSize: "0.8rem" }}
              value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setPage(1); }}>
              <option value="">All Subjects</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="gov-card" style={{ padding: 0 }}>
        {error && <div className="info-box danger" style={{ margin: "1rem" }} role="alert">{error}</div>}

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
            <p style={{ color: "var(--clr-text-muted)", marginTop: "0.75rem" }}>Loading questions…</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No questions found.</div>
            <button id="empty-create-btn" className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Create First Question
            </button>
          </div>
        ) : (
          <>
            <div className="gov-table-wrap">
              <table className="gov-table" aria-label="Question bank">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subject / Module</th>
                    <th>Marks</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => (
                    <tr key={q._id}>
                      <td style={{ color: "var(--clr-grey-02)", fontSize: "0.8rem", fontWeight: 600 }}>
                        {(pagination.page - 1) * 15 + idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{q.subject}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>{q.module}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--clr-primary-dark)" }}>{q.marks}</span>
                        <span style={{ color: "var(--clr-grey-02)", fontSize: "0.78rem" }}> pts</span>
                      </td>
                      <td><StatusBadge status={q.difficulty} /></td>
                      <td><StatusBadge status={q.status} /></td>
                      <td style={{ fontSize: "0.82rem" }}>
                        {q.createdBy?.name ?? "—"}
                        {q.isRepeated && <div><span className="badge badge-rejected" style={{ fontSize: "0.65rem" }}>Repeated</span></div>}
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--clr-text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(q.createdAt)}
                      </td>
                      <td>
                        {q.status === "pending" && (
                          <button
                            id={`review-btn-${q._id}`}
                            className="btn btn-outline btn-sm"
                            onClick={() => openReview(q)}
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination" style={{ padding: "0.875rem 1rem" }}>
              <span>Showing {(pagination.page - 1) * 15 + 1}–{Math.min(pagination.page * 15, pagination.total)} of {pagination.total}</span>
              <div className="pagination-btns">
                <button id="questions-prev-btn" className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                <button id="questions-next-btn" className="btn btn-ghost btn-sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Create Modal ─── */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setCreateError(""); }}
        title="Add New Question"
        footer={
          <>
            <button id="create-cancel-btn" className="btn btn-ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</button>
            <button id="create-submit-btn" form="create-question-form" type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : "Save Question"}
            </button>
          </>
        }
      >
        {createError && <div className="info-box danger" style={{ marginBottom: "1rem" }} role="alert">{createError}</div>}
        <form id="create-question-form" onSubmit={handleCreate} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="create-question-text" className="form-label">Question Text *</label>
              <textarea
                id="create-question-text"
                className="form-input"
                rows={4}
                placeholder="Enter the full question text…"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                required
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div className="form-group">
                <label htmlFor="create-subject" className="form-label">Subject *</label>
                <select id="create-subject" className="form-input" value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                  <option value="">Select subject…</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="create-module" className="form-label">Module *</label>
                <input id="create-module" type="text" className="form-input" placeholder="e.g. Algebra"
                  value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="create-marks" className="form-label">Marks *</label>
                <input id="create-marks" type="number" min={1} className="form-input"
                  value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} required />
              </div>
              <div className="form-group">
                <label htmlFor="create-difficulty" className="form-label">Difficulty *</label>
                <select id="create-difficulty" className="form-input" value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value as typeof form.difficulty })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>
              <input id="create-is-repeated" type="checkbox" checked={form.isRepeated}
                onChange={(e) => setForm({ ...form, isRepeated: e.target.checked })} />
              Mark as repeated question
            </label>
          </div>
        </form>
      </Modal>

      {/* ─── Review Modal ─── */}
      <Modal
        open={reviewOpen}
        onClose={() => { setReviewOpen(false); setReviewQuestion(null); }}
        title="Review Question"
        footer={
          <>
            <button id="review-cancel-btn" className="btn btn-ghost" onClick={() => setReviewOpen(false)} disabled={reviewing}>Cancel</button>
            <button id="review-reject-btn" className="btn btn-danger" onClick={() => handleReview("rejected")} disabled={reviewing}>
              <XCircle size={15} /> Reject
            </button>
            <button id="review-approve-btn" className="btn btn-success" onClick={() => handleReview("approved")} disabled={reviewing}>
              <CheckCircle size={15} /> Approve
            </button>
          </>
        }
      >
        {reviewQuestion && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div className="info-box info">
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Question Details</div>
                <div style={{ fontSize: "0.82rem" }}>
                  <strong>Subject:</strong> {reviewQuestion.subject} &nbsp;|&nbsp;
                  <strong>Module:</strong> {reviewQuestion.module} &nbsp;|&nbsp;
                  <strong>Marks:</strong> {reviewQuestion.marks} &nbsp;|&nbsp;
                  <strong>Difficulty:</strong> <StatusBadge status={reviewQuestion.difficulty} />
                </div>
              </div>
            </div>
            <div className="info-box" style={{ background: "var(--clr-linen)", borderColor: "var(--clr-grey-01)", flexDirection: "column", gap: 0 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--clr-grey-03)", marginBottom: 6, textTransform: "uppercase" }}>
                Question (Encrypted — metadata only visible)
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--clr-text-muted)", fontStyle: "italic" }}>
                Question content is encrypted at rest. Review is based on metadata.
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="review-feedback" className="form-label">Feedback (optional)</label>
              <textarea id="review-feedback" className="form-input" rows={3}
                placeholder="Add review notes or reason for rejection…"
                value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)}
                style={{ resize: "vertical" }} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
