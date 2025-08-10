// lib/sign.ts
import crypto from "crypto";

const SECRET = process.env.BATS_SIGNING_SECRET || "dev-secret-change-me";

export function sign(value: string): string {
  const mac = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("base64url"); // <- string
  return `${value}.${mac}`;
}

export function unsign(signed: string): string | "" {
  const [value, mac] = signed.split(".");
  if (!value || !mac) return "";
  const check = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("base64url");
  return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(check))
    ? value
    : "";
}
