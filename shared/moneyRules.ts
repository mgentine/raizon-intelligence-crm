export type MoneyValue = string | number;

function normalizedDecimal(value: MoneyValue): string {
  const raw = String(value).trim().replace(/\s/g, "");
  if (!raw || !/^-?[\d.,]+$/.test(raw)) throw new Error("Valor monetário inválido.");
  const sign = raw.startsWith("-") ? "-" : "";
  const unsigned = raw.replace(/^-/, "");
  const commaIndex = unsigned.lastIndexOf(",");
  const dotIndex = unsigned.lastIndexOf(".");
  let integer = unsigned;
  let fraction = "";
  if (commaIndex >= 0 || dotIndex >= 0) {
    const decimalIndex = commaIndex > dotIndex ? commaIndex : dotIndex;
    const hasBothSeparators = commaIndex >= 0 && dotIndex >= 0;
    const separator = unsigned[decimalIndex];
    const digitsAfter = unsigned.length - decimalIndex - 1;
    if (!hasBothSeparators && digitsAfter > 2) throw new Error("Valor monetário inválido.");
    integer = unsigned.slice(0, decimalIndex);
    fraction = unsigned.slice(decimalIndex + 1);
    if (hasBothSeparators) integer = integer.replace(/[.,]/g, "");
    if (separator !== "," && separator !== ".") throw new Error("Valor monetário inválido.");
  }
  if (!/^\d+$/.test(integer || "0") || (fraction && !/^\d+$/.test(fraction))) throw new Error("Valor monetário inválido.");
  const centsText = fraction.padEnd(2, "0").slice(0, 2);
  let minor = BigInt(centsText || "0");
  if (fraction[2] && Number(fraction[2]) >= 5) minor += BigInt(1);
  let major = BigInt(integer || "0");
  if (minor >= BigInt(100)) {
    major += BigInt(1);
    minor = BigInt(0);
  }
  return `${sign}${major}.${minor.toString().padStart(2, "0")}`;
}

export function moneyToCents(value: MoneyValue): bigint {
  const normalized = normalizedDecimal(value);
  const negative = normalized.startsWith("-");
  const unsigned = normalized.replace(/^-/, "");
  const [major, minor] = unsigned.split(".");
  const cents = BigInt(major) * BigInt(100) + BigInt(minor);
  return negative ? -cents : cents;
}

export function centsToDecimal(cents: bigint): string {
  const negative = cents < BigInt(0);
  const absolute = negative ? -cents : cents;
  return `${negative ? "-" : ""}${absolute / BigInt(100)}.${(absolute % BigInt(100)).toString().padStart(2, "0")}`;
}

export function sumMoney(values: MoneyValue[]): string {
  return centsToDecimal(values.reduce((total, value) => total + moneyToCents(value), BigInt(0)));
}

export function splitMoney(value: MoneyValue, installments: number): string[] {
  if (!Number.isInteger(installments) || installments <= 0) throw new Error("Quantidade de parcelas inválida.");
  const total = moneyToCents(value);
  const base = total / BigInt(installments);
  const remainder = total % BigInt(installments);
  const extra = remainder >= BigInt(0) ? BigInt(1) : BigInt(-1);
  const remainderCount = Number(remainder >= BigInt(0) ? remainder : -remainder);
  return Array.from({ length: installments }, (_, index) => centsToDecimal(base + (index < remainderCount ? extra : BigInt(0))));
}

export function formatBrl(cents: bigint): string {
  const absolute = cents < BigInt(0) ? -cents : cents;
  const [major, minor] = centsToDecimal(absolute).split(".");
  return `${cents < BigInt(0) ? "-" : ""}R$ ${major.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${minor}`;
}
