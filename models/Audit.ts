import mongoose, { Schema, models } from "mongoose";

const AuditSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: String,
    ip: String,
    role: String,
    details: Object,
  },
  { timestamps: true },
);

export const Audit = models.Audit || mongoose.model("Audit", AuditSchema);
