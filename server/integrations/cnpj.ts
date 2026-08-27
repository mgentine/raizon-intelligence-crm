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

const CnpjWsResponse = z.object({
  estabelecimento: z.object({
    cnpj: z.string().optional(),
    nome_fantasia: nullableString,
    situacao_cadastral: nullableString,
    atividade_principal: z.object({ id: z.string().optional() }).nullable().optional(),
    cidade: z.object({ nome: z.string().optional() }).nullable().optional(),
    estado: z.object({ sigla: z.string().optional() }).nullable().optional(),
  }).optional(),
  razao_social: nullableString,
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

function normalizeResult(normalized: string, source: string, values: Omit<CnpjLookup, "cnpj" | "source" | "consultedAt">): CnpjLookup {
  return { cnpj: normalized, source, consultedAt: new Date().toISOString(), ...values };
}

async function lookupBrasilApi(normalized: string): Promise<CnpjLookup> {
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${normalized}`, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`PRIMARY_${response.status}`);
  let payload: z.infer<typeof BrasilApiResponse>;
  try { payload = BrasilApiResponse.parse(await response.json()); }
  catch { throw new Error("CNPJ_PROVIDER_INVALID_RESPONSE: o provedor retornou dados incompatíveis."); }
  return normalizeResult(normalized, "brasilapi", {
    legalName: payload.razao_social ?? null,
    tradeName: payload.nome_fantasia ?? null,
    registrationStatus: payload.descricao_situacao_cadastral ?? null,
    mainCnae: payload.cnae_fiscal !== null && payload.cnae_fiscal !== undefined ? String(payload.cnae_fiscal) : null,
    city: payload.municipio ?? null,
    state: payload.uf ?? null,
  });
}

async function lookupCnpjWs(normalized: string): Promise<CnpjLookup> {
  let response: Response;
  try { response = await fetch(`https://publica.cnpj.ws/cnpj/${normalized}`, { headers: { accept: "application/json" } }); }
  catch { throw new Error("CNPJ_PROVIDER_UNAVAILABLE: os serviços cadastrais não responderam."); }
  if (response.status === 404) throw new Error("CNPJ_NOT_FOUND: empresa não encontrada nas bases consultadas.");
  if (!response.ok) throw new Error(`CNPJ_PROVIDER_UNAVAILABLE: provedores indisponíveis (${response.status}).`);
  let payload: z.infer<typeof CnpjWsResponse>;
  try { payload = CnpjWsResponse.parse(await response.json()); }
  catch { throw new Error("CNPJ_PROVIDER_INVALID_RESPONSE: o fallback retornou dados incompatíveis."); }
  const estabelecimento = payload.estabelecimento;
  return normalizeResult(normalized, "cnpj.ws", {
    legalName: payload.razao_social ?? null,
    tradeName: estabelecimento?.nome_fantasia ?? null,
    registrationStatus: estabelecimento?.situacao_cadastral ?? null,
    mainCnae: estabelecimento?.atividade_principal?.id ?? null,
    city: estabelecimento?.cidade?.nome ?? null,
    state: estabelecimento?.estado?.sigla ?? null,
  });
}

export async function lookupCnpj(cnpj: string): Promise<CnpjLookup> {
  const normalized = cnpj.replace(/\D/g, "");
  if (normalized.length !== 14) throw new Error("CNPJ_INVALID: informe 14 dígitos.");
  try {
    return await lookupBrasilApi(normalized);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("CNPJ_PROVIDER_INVALID_RESPONSE")) throw error;
    try { return await lookupCnpjWs(normalized); }
    catch (fallbackError) {
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "";
      if (fallbackMessage.includes("CNPJ_NOT_FOUND")) throw fallbackError;
      if (fallbackMessage.includes("CNPJ_PROVIDER_INVALID_RESPONSE")) throw fallbackError;
      throw new Error("CNPJ_PROVIDER_UNAVAILABLE: consulta indisponível nos provedores cadastrais.");
    }
  }
}
