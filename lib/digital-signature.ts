import crypto from "crypto";
import { encrypt, decrypt } from "./encryption";

export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding:  { type: "spki",  format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  // Private key is stored AES-encrypted — never exposed in plaintext
  const encryptedPrivateKey = encrypt(privateKey);

  return { publicKey, encryptedPrivateKey };
}

export function signData(data: string, encryptedPrivateKey: string): string {
  const privateKey = decrypt(encryptedPrivateKey);
  const sign = crypto.createSign("SHA256");
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, "base64");
}

export function verifySignature(
  data: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const verify = crypto.createVerify("SHA256");
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, "base64");
  } catch {
    return false;
  }
}
