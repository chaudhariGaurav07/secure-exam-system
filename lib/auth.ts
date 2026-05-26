import { SignJWT, jwtVerify } from "jose"; // jose for signing/verifying tokens

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
}

// Convert JWT secret string into Uint8Array format
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createToken(payload: TokenPayload) {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({
      alg: "HS256", // algorithm used for signing token
    })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}