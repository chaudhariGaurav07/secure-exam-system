import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { createAuditLog } from "@/services/audit.service";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body;

    const user = await User.findOne({ email });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        {
          status: 401,
        },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return Response.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      );
    }
    const token = await createToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    const cookieStore = await cookies();

    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    await createAuditLog({
      userId: user._id,
      action: "LOGIN",
      role: user.role,
      ip: "unknown",
      details: {
        email,
      },
    });

    return Response.json({
      suceess: true,
      message: "login successful",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Login failed",
      },
      { status: 500 },
    );
  }
}
