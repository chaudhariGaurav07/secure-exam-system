import mongoose, { Schema, models } from "mongoose";

const ApprovalSchema = new Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", immutable: true },
    role:       { type: String, immutable: true },
    approvedAt: { type: Date, default: Date.now, immutable: true },
  },
  { _id: false }
);

const PaperSchema = new Schema(
  {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
    setNumber:  Number,
    questions:  Array,

    //  Integrity
    generatedHash:  { type: String, immutable: true },
    cid:            { type: String, immutable: true }, // IPFS CID
    encryptedPaper: { type: String, immutable: true },

    //  Digital Signature 
    signature: { type: String, immutable: true }, // base64 RSA signature
    signedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", immutable: true },

    //  Multi Signature Approval
    approvals:         { type: [ApprovalSchema], default: [] },
    approvalsRequired: { type: Number, default: 2 },

    //  Time Lock 
    releaseAt: { type: Date },

    //  Auto Destruction (TTL)
    // MongoDB deletes this document automatically when destroyAt is reached
    destroyAt: { type: Date, index: true },

    //  Threshold Key Sharing 
    thresholdEnabled: { type: Boolean, default: false },
    threshold:        { type: Number, default: 2 }, // k
    totalShares:      { type: Number, default: 3 }, // n

    finalized:  { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes when destroyAt is reached
PaperSchema.index({ destroyAt: 1 }, { expireAfterSeconds: 0 });

export const Paper = models.Paper || mongoose.model("Paper", PaperSchema);
