import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: String,

    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "author", "reviewer", "exam_center"],
      default: "author",
    },
  },
  {
    timestamps: true,
  },
);


export const User = models.User || mongoose.model("User", UserSchema)
