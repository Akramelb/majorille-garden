import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.ORDER_TOKEN_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ORDER_TOKEN_SECRET missing or too short (>=16 chars)");
  }
  return s;
}

export function signOrderToken(orderId: string): string {
  return createHmac("sha256", secret()).update(orderId).digest("hex").slice(0, 32);
}

export function verifyOrderToken(orderId: string, token: string | undefined | null): boolean {
  if (!token || token.length !== 32) return false;
  let expected: string;
  try {
    expected = signOrderToken(orderId);
  } catch {
    return false;
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
