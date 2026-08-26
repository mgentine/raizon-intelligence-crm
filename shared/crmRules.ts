export function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCnpj(value: string) {
  return normalizeCnpj(value).length === 14;
}

export function classifyCommercialPriority(input: { urgency: number; fit: number; contactability: number; decisionAccess: number }) {
  const score = input.urgency + input.fit + input.contactability + input.decisionAccess;
  if (score >= 16) return "A" as const;
  if (score >= 11) return "B" as const;
  if (score >= 6) return "C" as const;
  return "D" as const;
}
