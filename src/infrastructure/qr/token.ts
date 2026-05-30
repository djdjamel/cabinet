import { randomBytes } from "crypto";
import type { TokenGenerator } from "@application/ports";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function toBase62(buf: Buffer): string {
  let n = BigInt("0x" + buf.toString("hex"));
  const zero = BigInt(0);
  const base = BigInt(62);
  let result = "";
  while (n > zero) {
    result = BASE62[Number(n % base)] + result;
    n = n / base;
  }
  return result.padStart(22, "0"); // ~128 bits en base62 = ~22 chars
}

export const tokenGenerator: TokenGenerator = {
  generate(): string {
    return toBase62(randomBytes(16));
  },
};
