import { randomBytes } from "node:crypto";

export function newVoucherCode(): string {
  const hex = randomBytes(4).toString("hex").toUpperCase();
  return `CO123-${hex.slice(0, 4)}-${hex.slice(4)}`;
}

export function newId(): string {
  return randomBytes(8).toString("hex");
}
