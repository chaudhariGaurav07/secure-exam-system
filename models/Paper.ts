import mongoose, { Schema, models } from "mongoose";

const PaperSchema = new Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
    },

    setNumber: Number,

    questions: Array,

    generatedHash: { type: String, immutable: true },

    // IPFS content identifier — set at finalize, immutable after
    cid: { type: String, immutable: true },

    // Time-lock: paper cannot be released before this timestamp
    releaseAt: { type: Date },

    finalized: {
      type: Boolean,
      default: false,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    encryptedPaper: { type: String, immutable: true },
  },
  {
    timestamps: true,
  },
);

export const Paper = models.Paper || mongoose.model("Paper", PaperSchema);
