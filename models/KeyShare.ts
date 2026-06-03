import mongoose, { Schema, models } from "mongoose";

const KeyShareSchema = new Schema(
  {
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
      required: true,
      immutable: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    // Which share number this is (1-based, so receiver knows their index)
    shareIndex: { type: Number, required: true, immutable: true },
    // Total shares generated (n) and threshold needed (k)
    totalShares: { type: Number, required: true, immutable: true },
    threshold:   { type: Number, required: true, immutable: true },
    // The actual share data — stored as hex string
    shareData: { type: String, required: true, immutable: true },
  },
  { timestamps: true }
);

export const KeyShare =
  models.KeyShare || mongoose.model("KeyShare", KeyShareSchema);
