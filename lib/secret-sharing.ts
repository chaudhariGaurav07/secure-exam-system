
import crypto from "crypto";

const ZERO  = BigInt(0);
const ONE   = BigInt(1);
const TWO   = BigInt(2);
// Mersenne prime 2^127 - 1 — larger than any 128-bit secret
const PRIME = TWO ** BigInt(127) - ONE;

function mod(n: bigint, p: bigint): bigint {
  return ((n % p) + p) % p;
}

function modInverse(a: bigint, p: bigint): bigint {
  let old_r = a, r = p;
  let old_s = ONE, s = ZERO;
  while (r !== ZERO) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  return mod(old_s, p);
}

export function splitSecret(secret: string, n: number, k: number): string[] {
  if (k > n) throw new Error("k must be <= n");

  // Hash the secret to exactly 16 bytes so it always fits in the 127-bit prime field
  const secretHash   = crypto.createHash("sha256").update(secret).digest();
  const secret16     = secretHash.subarray(0, 16); // first 128 bits
  const secretBigInt = BigInt("0x" + secret16.toString("hex"));

  // Polynomial: f(x) = secret + a1*x + ... + a(k-1)*x^(k-1)  (mod p)
  const coeffs: bigint[] = [secretBigInt];
  for (let i = 1; i < k; i++) {
    const rand = BigInt("0x" + crypto.randomBytes(16).toString("hex"));
    coeffs.push(rand % PRIME);
  }

  return Array.from({ length: n }, (_, i) => {
    const x = BigInt(i + 1);
    let y    = ZERO;
    let xPow = ONE;
    for (const c of coeffs) {
      y    = mod(y + c * xPow, PRIME);
      xPow = mod(xPow * x, PRIME);
    }
    return `${(i + 1).toString(16)}:${y.toString(16)}`;
  });
}

export function reconstructSecret(shares: string[]): string {
  const points = shares.map((s) => {
    const [xh, yh] = s.split(":");
    return { x: BigInt("0x" + xh), y: BigInt("0x" + yh) };
  });

  let secret = ZERO;

  for (let i = 0; i < points.length; i++) {
    const { x: xi, y: yi } = points[i];
    let num = ONE;
    let den = ONE;

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const xj = points[j].x;
      num = mod(num * mod(ZERO - xj, PRIME), PRIME);
      den = mod(den * mod(xi - xj, PRIME), PRIME);
    }

    secret = mod(secret + yi * mod(num * modInverse(den, PRIME), PRIME), PRIME);
  }

  const hexStr = secret.toString(16);
  const padded = hexStr.length % 2 ? "0" + hexStr : hexStr;
  // Return as hex — caller uses this 16-byte value as a derived key
  return padded;
}
