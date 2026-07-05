// Thin API client wrapper — all calls go through here
const BASE = "";

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Request failed");
  }
  return data as T;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request<{ user: { id: string; name: string; role: string; email: string } }>("/api/auth/me"),
};

// Questions
export const questionsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ success: boolean; questions: Question[]; pagination: Pagination }>(`/api/questions${qs}`);
  },
  create: (data: CreateQuestionPayload) =>
    request("/api/questions/create", { method: "POST", body: JSON.stringify(data) }),
  review: (data: { questionId: string; status: "approved" | "rejected"; feedback?: string }) =>
    request("/api/questions/review", { method: "POST", body: JSON.stringify(data) }),
};

// Templates
export const templatesApi = {
  list: () => request<{ success: boolean; templates: Template[] }>("/api/templates"),
  create: (data: CreateTemplatePayload) =>
    request("/api/templates/create", { method: "POST", body: JSON.stringify(data) }),
};

// Papers
export const papersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ success: boolean; papers: Paper[]; pagination: Pagination }>(`/api/papers${qs}`);
  },
  generate: (templateId: string) =>
    request("/api/papers/generate", { method: "POST", body: JSON.stringify({ templateId }) }),
  approve: (paperId: string) =>
    request("/api/papers/approve", { method: "POST", body: JSON.stringify({ paperId }) }),
  finalize: (data: FinalizePaperPayload) =>
    request("/api/papers/finalize", { method: "POST", body: JSON.stringify(data) }),
  release: (paperId: string) =>
    request("/api/papers/release", { method: "POST", body: JSON.stringify({ paperId }) }),
  open: (paperId: string) =>
    request("/api/papers/open", { method: "POST", body: JSON.stringify({ paperId }) }),
};

// Admin
export const adminApi = {
  audit: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ success: boolean; logs: AuditLog[] }>(`/api/admin/audit${qs}`);
  },
};

// ---- Types ----
export interface Question {
  _id: string;
  subject: string;
  module: string;
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  status: "pending" | "approved" | "rejected";
  isRepeated: boolean;
  version: number;
  createdBy?: { name: string; email: string };
  reviewedBy?: { name: string; email: string };
  createdAt: string;
}

export interface Template {
  _id: string;
  title: string;
  subject: string;
  totalMarks: number;
  structure: StructureBlock[];
  createdBy?: { name: string; email: string };
  createdAt: string;
}

export interface StructureBlock {
  questionNo: string;
  subQuestion: string;
  marks: number;
  candidatesNeeded: number;
}

export interface Paper {
  _id: string;
  setNumber: number;
  finalized: boolean;
  generatedHash: string;
  cid: string;
  signature: string;
  releaseAt?: string;
  destroyAt?: string;
  approvals: Approval[];
  approvalsRequired: number;
  templateId?: { title: string; subject: string; totalMarks: number };
  reviewedBy?: { name: string; email: string };
  signedBy?: { name: string; email: string };
  createdAt: string;
}

export interface Approval {
  userId: string;
  role: string;
  approvedAt: string;
}

export interface AuditLog {
  _id: string;
  userId?: { name: string; email: string; role: string };
  action: string;
  role: string;
  ip: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CreateQuestionPayload {
  question: string;
  subject: string;
  module: string;
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  isRepeated?: boolean;
}

export interface CreateTemplatePayload {
  title: string;
  subject: string;
  totalMarks: number;
  structure: StructureBlock[];
}

export interface FinalizePaperPayload {
  paperId: string;
  releaseAt: string;
  examDurationHours?: number;
  approvalsRequired?: number;
  enableThreshold?: boolean;
  thresholdK?: number;
  thresholdN?: number;
  holderUserIds?: string[];
}
