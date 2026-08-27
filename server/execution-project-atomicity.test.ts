import { beforeEach, describe, expect, it, vi } from "vitest";
import { executionProjects, projectChecklist, projectTasks } from "../drizzle/schema";

const state = vi.hoisted(() => ({
  selectResults: [] as unknown[][],
  committedInserts: [] as Array<{ table: unknown; values: unknown }>,
  committedUpdates: [] as Array<{ table: unknown; values: unknown }>,
  failChecklistInsert: false,
}));

function lockable<T>(rows: T[]) {
  Object.assign(rows, { for: () => rows });
  return rows as T[] & { for: (strength: string) => T[] };
}

function transaction(work: (tx: any) => Promise<unknown>) {
  const stagedInserts: Array<{ table: unknown; values: unknown }> = [];
  const stagedUpdates: Array<{ table: unknown; values: unknown }> = [];
  const tx = {
    select: () => ({
      from: () => {
        const rows = lockable((state.selectResults.shift() ?? []) as unknown[]);
        return {
          where: () => ({
            limit: () => rows,
            for: () => rows,
          }),
        };
      },
    }),
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: async () => { stagedUpdates.push({ table, values }); },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        stagedInserts.push({ table, values });
        if (table === projectChecklist && state.failChecklistInsert) return Promise.reject(new Error("falha simulada no checklist"));
        return Object.assign(Promise.resolve(undefined), {
          $returningId: async () => table === executionProjects ? [{ id: 701 }] : [],
        });
      },
    }),
  };

  return Promise.resolve(work(tx)).then((result) => {
    state.committedInserts.push(...stagedInserts);
    state.committedUpdates.push(...stagedUpdates);
    return result;
  });
}

const fakeDb = { transaction: vi.fn(transaction) };

vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn(() => fakeDb) }));

import { updateExecutionProjectStatus, updateProposalDetails, updateProposalStatus } from "./db";

const acceptedCandidate = {
  id: 44,
  status: "negotiating",
  proposalNumber: "058/2026",
  opportunityId: 18,
  companyId: 12,
  investment: "3500.00",
  scopeSnapshot: "Renovar outorga.",
  deliverablesSnapshot: "Protocolos e relatório.",
  assumptionsSnapshot: "Dados fornecidos pelo cliente.",
  exclusionsSnapshot: null,
  requiredDocumentsSnapshot: "Outorga anterior\nCroqui dos poços",
};

describe("aceite de proposta e setup atômico de execução", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "mysql://test:local@localhost:3306/raizon";
    state.selectResults = [];
    state.committedInserts = [];
    state.committedUpdates = [];
    state.failChecklistInsert = false;
    fakeDb.transaction.mockClear();
  });

  it("confirma status, projeto e checklist como uma única unidade transacional", async () => {
    state.selectResults = [[acceptedCandidate], []];

    await expect(updateProposalStatus(44, "accepted", 9)).resolves.toEqual({ success: true, executionProjectId: 701, alreadyApplied: false });

    expect(fakeDb.transaction).toHaveBeenCalledTimes(1);
    expect(state.committedUpdates).toHaveLength(1);
    expect(state.committedUpdates[0]?.values).toEqual(expect.objectContaining({ status: "accepted", reviewedBy: 9 }));
    expect(state.committedInserts).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: executionProjects, values: expect.objectContaining({ proposalId: 44, ownerId: 9, opportunityId: 18, companyId: 12 }) }),
      expect.objectContaining({ table: projectChecklist, values: expect.arrayContaining([
        expect.objectContaining({ projectId: 701, title: "Outorga anterior", ownerId: 9 }),
        expect.objectContaining({ projectId: 701, title: "Croqui dos poços", ownerId: 9 }),
      ]) }),
    ]));
    expect(state.committedInserts.some((insert) => insert.table === projectTasks)).toBe(false);
  });

  it("não confirma o aceite nem o projeto quando a criação do checklist falha", async () => {
    state.selectResults = [[acceptedCandidate], []];
    state.failChecklistInsert = true;

    await expect(updateProposalStatus(44, "accepted", 9)).rejects.toThrow("falha simulada no checklist");

    expect(state.committedUpdates).toEqual([]);
    expect(state.committedInserts).toEqual([]);
  });

  it("reutiliza o projeto existente quando o aceite é reexecutado", async () => {
    state.selectResults = [[{ ...acceptedCandidate, status: "accepted" }], [{ id: 702 }]];

    await expect(updateProposalStatus(44, "accepted", 9)).resolves.toEqual({ success: true, executionProjectId: 702, alreadyApplied: true });

    expect(state.committedUpdates).toEqual([]);
    expect(state.committedInserts).toEqual([]);
  });

  it("bloqueia edição de conteúdo depois que a proposta foi emitida", async () => {
    state.selectResults = [[{ id: 44, status: "issued" }]];

    await expect(updateProposalDetails(44, { investment: "4900.00" })).rejects.toThrow("não pode ser alterada");

    expect(state.committedUpdates).toEqual([]);
  });

  it("não encerra projeto enquanto houver checklist obrigatório pendente", async () => {
    state.selectResults = [[{ id: 701, status: "accepted", acceptanceNotes: null, deliveredAt: null, acceptedAt: new Date(), closedAt: null }], [{ required: 1, status: "pending" }]];

    await expect(updateExecutionProjectStatus(701, "closed")).rejects.toThrow("documentos obrigatórios pendentes");

    expect(state.committedUpdates).toEqual([]);
  });
});
