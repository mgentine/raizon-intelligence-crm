import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

function deriveKey(password: string, salt: string, length: number, cost: number, blockSize: number, parallelization: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, { N: cost, r: blockSize, p: parallelization }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 10) throw new Error("A senha deve conter pelo menos 10 caracteres.");
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, COST, BLOCK_SIZE, PARALLELIZATION);
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string | null | undefined): Promise<boolean> {
  if (!password || !encoded) return false;
  const [algorithm, costText, blockText, parallelText, salt, hashHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !costText || !blockText || !parallelText || !salt || !hashHex || hashHex.length % 2 !== 0) return false;
  const cost = Number(costText);
  const blockSize = Number(blockText);
  const parallelization = Number(parallelText);
  if (!Number.isInteger(cost) || !Number.isInteger(blockSize) || !Number.isInteger(parallelization)) return false;
  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = await deriveKey(password, salt, expected.length, cost, blockSize, parallelization);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function localOpenIdForUser(userId: number): string {
  return `local:${userId}`;
}

export function isLocalOpenId(openId: string): boolean {
  return openId.startsWith("local:");
}

export function localAuthLoginFromEnv() {
  return process.env.LOCAL_AUTH_ADMIN_LOGIN?.trim() || "";
}

export function localAuthPasswordFromEnv() {
  return process.env.LOCAL_AUTH_ADMIN_PASSWORD || "";
}
