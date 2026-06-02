import { createHash } from "./encryption";

export function verifyIntegrity(
  encryptedPaper: string,
  originalHash: string
) {
  const currentHash =
    createHash(
      encryptedPaper
    );

  return (
    currentHash === originalHash
  );
}