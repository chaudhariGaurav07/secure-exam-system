import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { generateKeyPair } from "@/lib/digital-signature";
import { validateBody, RegisterSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await validateBody(req, RegisterSchema);

    const hashPassword = await bcrypt.hash(body.password, 12);
    const { publicKey, encryptedPrivateKey } = generateKeyPair();

    const user = await User.create({
      ...body,
      password: hashPassword,
      publicKey,
      encryptedPrivateKey,
    });

    return Response.json({
      success: true,
      user: {
        id:        user._id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        publicKey: user.publicKey,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error; // Zod validation error
    return Response.json(
      { success: false, error: "Registration failed" },
      { status: 500 }
    );
  }
}