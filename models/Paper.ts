import mongoose, { Schema, models } from "mongoose";

const PaperSchema = new Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
    },

    setNumber: Number,

    questions: Array,

    generatedHash: String,

    finalized: {
      type: Boolean,
      default: false,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    encryptedPaper: String,
  },
  {
    timestamps: true,
  },
);

export const Paper = models.Paper || mongoose.model("Paper", PaperSchema);
