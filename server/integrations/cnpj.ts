import { z } from "zod";

const nullableString = z.string().nullable().optional();
const BrasilApiResponse = z.object({
  cnpj: nullableString,
  razao_social: nullableString,
  nome_fantasia: nullableString,
  descricao_situacao_cadastral: nullableString,
  cnae_fiscal: z.union([z.number(), z.string()]).nullable().optional(),
  municipio: nullableString,
  uf: nullableString,
});

export type CnpjLookup = {
  cnpj: string;
  legalName: string | null;
  tradeName: string | null;
  registrationStatus: string | null;
  mainCnae: string | null;
  city: string | null;
  state: string | null;
  source: string;
  consultedAt: string;
};

export async function lookupCnpj(cnpj: string): Promise<CnpjLookup> {
  const normalized = cnpj.replace(/\D/g, "");
  if (normalized.length !== 14) throw new Error("CNPJ_INVALID: informe 14 dígitos.");
  let response: Response;
  try {
    response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${normalized}`, { headers: { accept: "application/json" } });
  } catch {
    throw new Error("CNPJ_PROVIDER_UNAVAILABLE: o serviço cadastral não respondeu.");
  }
  if (response.status === 404) throw new Error("CNPJ_NOT_FOUND: empresa não encontrada no provedor cadastral.");
  if (!response.ok) throw new Error(`CNPJ_PROVIDER_UNAVAILABLE: consulta indisponível (${response.status}).`);
  let payload: z.infer<typeof BrasilApiResponse>;
  try {
    payload = BrasilApiResponse.parse(await response.json());
  } catch {
    throw new Error("CNPJ_PROVIDER_INVALID_RESPONSE: o provedor retornou dados incompatíveis.");
  }
  return {
    cnpj: normalized,
    legalName: payload.razao_social ?? null,
    tradeName: payload.nome_fantasia ?? null,
    registrationStatus: payload.descricao_situacao_cadastral ?? null,
    mainCnae: payload.cnae_fiscal !== null && payload.cnae_fiscal !== undefined ? String(payload.cnae_fiscal) : null,
    city: payload.municipio ?? null,
    state: payload.uf ?? null,
    source: "brasilapi",
    consultedAt: new Date().toISOString(),
  };
}
