import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name:  String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "author", "reviewer", "exam_center"],
      default: "author",
    },

    // Digital Signature keys — generated on registration
    publicKey:           { type: String }, // PEM — stored in plaintext (public)
    encryptedPrivateKey: { type: String }, // PEM — stored AES-encrypted
  },
  { timestamps: true }
);

export const User = models.User || mongoose.model("User", UserSchema);
