import { z } from "zod";

const BrasilApiResponse = z.object({
  cnpj: z.string().optional(),
  razao_social: z.string().optional(),
  nome_fantasia: z.string().optional(),
  descricao_situacao_cadastral: z.string().optional(),
  cnae_fiscal: z.number().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
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
  if (normalized.length !== 14) throw new Error("CNPJ deve conter 14 dígitos");
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${normalized}`, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Consulta de CNPJ indisponível (${response.status})`);
  const payload = BrasilApiResponse.parse(await response.json());
  return {
    cnpj: normalized,
    legalName: payload.razao_social ?? null,
    tradeName: payload.nome_fantasia ?? null,
    registrationStatus: payload.descricao_situacao_cadastral ?? null,
    mainCnae: payload.cnae_fiscal ? String(payload.cnae_fiscal) : null,
    city: payload.municipio ?? null,
    state: payload.uf ?? null,
    source: "brasilapi",
    consultedAt: new Date().toISOString(),
  };
}
