import { z } from "zod";

// Auth 

export const RegisterSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
              .regex(/[A-Z]/, "Password must contain an uppercase letter")
              .regex(/[0-9]/, "Password must contain a number"),
  role:     z.enum(["admin", "author", "reviewer", "exam_center"]).default("author"),
});

export const LoginSchema = z.object({
  email:    z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});


export const CreateQuestionSchema = z.object({
  question:   z.string().min(10, "Question must be at least 10 characters"),
  subject:    z.string().min(1, "Subject is required"),
  module:     z.string().min(1, "Module is required"),
  marks:      z.number().int().positive("Marks must be a positive integer"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  isRepeated: z.boolean().optional().default(false),
});

export const ReviewQuestionSchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
  status:     z.enum(["approved", "rejected"]),
  feedback:   z.string().optional(),
});


const StructureBlockSchema = z.object({
  questionNo:        z.string().min(1),
  subQuestion:       z.string().min(1),
  marks:             z.number().int().positive(),
  candidatesNeeded:  z.number().int().positive(),
});

export const CreateTemplateSchema = z.object({
  title:      z.string().min(3, "Title must be at least 3 characters"),
  subject:    z.string().min(1, "Subject is required"),
  totalMarks: z.number().int().positive("Total marks must be positive"),
  structure:  z.array(StructureBlockSchema).min(1, "At least one structure block is required"),
});


export const GeneratePaperSchema = z.object({
  templateId: z.string().min(1, "templateId is required"),
});

export const ApprovePaperSchema = z.object({
  paperId: z.string().min(1, "paperId is required"),
});

export const FinalizePaperSchema = z.object({
  paperId:          z.string().min(1, "paperId is required"),
  releaseAt:        z.string().datetime("releaseAt must be a valid ISO datetime"),
  examDurationHours: z.number().positive().default(3),
  approvalsRequired: z.number().int().min(1).default(2),
  enableThreshold:  z.boolean().default(false),
  thresholdK:       z.number().int().min(2).default(2),
  thresholdN:       z.number().int().min(2).default(3),
  holderUserIds:    z.array(z.string()).default([]),
});

export const ReleasePaperSchema = z.object({
  paperId: z.string().min(1, "paperId is required"),
});


/** Validates request body and returns { data } or throws a 400 Response */
export async function validateBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Response.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw Response.json(
      {
        success: false,
        error:   "Validation failed",
        issues:  result.error.issues.map((i) => ({
          field:   i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  return result.data;
}
