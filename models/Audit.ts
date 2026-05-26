import mongoose, { Schema, models } from "mongoose";

const AuditSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      immutable: true,
    },
    action:  { type: String, immutable: true },
    ip:      { type: String, immutable: true },
    role:    { type: String, immutable: true },
    details: { type: Object, immutable: true },
  },
  {
    timestamps: true,
    // Prevent existing logs from being overwritten via save()
    strict: true,
  },
);

// Prevent deletion of individual audit records
AuditSchema.pre("deleteOne", function () {
  throw new Error("Audit logs are immutable and cannot be deleted.");
});
AuditSchema.pre("deleteMany", function () {
  throw new Error("Audit logs are immutable and cannot be deleted.");
});
AuditSchema.pre("findOneAndDelete", function () {
  throw new Error("Audit logs are immutable and cannot be deleted.");
});

export const Audit = models.Audit || mongoose.model("Audit", AuditSchema);

