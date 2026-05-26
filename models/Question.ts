import mongoose, { Schema, models } from "mongoose";

const QuestionSchema = new Schema(
  {
    encryptedQuestion: {
      type: String,
      required: true,
    },

    hash: {
      type: String,
      required: true,
    },

    subject: String,

    module: String,

    marks: Number,

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isRepeated: {
      type: Boolean,
      default: false,
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

export const Question =
  models.Question || mongoose.model("Question", QuestionSchema);
