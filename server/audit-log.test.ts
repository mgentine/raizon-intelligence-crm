import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditEvents, companies, evidenceFiles, executionProjects, projectTasks } from "../drizzle/schema";

const state = vi.hoisted(() => ({
  selectResults: [] as unknown[][],
  inserts: [] as Array<{ table: unknown; values: unknown }>,
  updates: [] as Array<{ table: unknown; values: unknown }>,
}));

function lockable<T>(rows: T[]) {
  Object.assign(rows, { for: () => rows });
  return rows as T[] & { for: (strength: string) => T[] };
}

function transaction(work: (tx: any) => Promise<unknown>) {
  const stagedInserts: Array<{ table: unknown; values: unknown }> = [];
  const stagedUpdates: Array<{ table: unknown; values: unknown }> = [];
  const tx = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => lockable((state.selectResults.shift() ?? []) as unknown[]) }) }) }),
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        stagedInserts.push({ table, values });
        const result = table === companies ? [{ insertId: 91 }] : [];
        return Object.assign(Promise.resolve(result), { $returningId: async () => table === projectTasks ? [{ id: 81 }] : [] });
      },
    }),
    update: (table: unknown) => ({ set: (values: unknown) => ({ where: async () => { stagedUpdates.push({ table, values }); } }) }),
  };
  return Promise.resolve(work(tx)).then((result) => {
    state.inserts.push(...stagedInserts);
    state.updates.push(...stagedUpdates);
    return result;
  });
}

const fakeDb = { transaction: vi.fn(transaction) };
vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn(() => fakeDb) }));

import { archiveEvidenceFile, createCompany, updateExecutionProjectStatus, updateProjectTaskStatus } from "./db";

describe("audit log de mutações críticas", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "mysql://test:local@localhost:3306/raizon";
    state.selectResults = [];
    state.inserts = [];
    state.updates = [];
    fakeDb.transaction.mockClear();
  });

  it("cria empresa e evento de auditoria no mesmo commit", async () => {
    await expect(createCompany({ cnpj: "45746112000124", legalName: "Município de teste", relationshipStatus: "prospect", source: "manual", auditActorId: 7 })).resolves.toBe(91);
    expect(fakeDb.transaction).toHaveBeenCalledTimes(1);
    expect(state.inserts).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: companies }),
      expect.objectContaining({ table: auditEvents, values: expect.objectContaining({ entityType: "company", entityId: 91, action: "created", actorId: 7 }) }),
    ]));
  });

  it("registra a transição de projeto com ator e snapshots de estado", async () => {
    state.selectResults = [[{ id: 1, status: "in_progress", phase: "in_progress", acceptanceNotes: null, deliveredAt: null, acceptedAt: null, closedAt: null }]];
    await expect(updateExecutionProjectStatus(1, "delivered", undefined, 7)).resolves.toEqual({ success: true });
    expect(state.inserts).toContainEqual(expect.objectContaining({ table: auditEvents, values: expect.objectContaining({ entityType: "execution_project", entityId: 1, action: "status_changed", actorId: 7 }) }));
  });

  it("registra a conclusão de tarefa com o estado anterior e o ator", async () => {
    state.selectResults = [[{ id: 81, projectId: 1, status: "in_progress", completedAt: null }], [{ id: 1, status: "in_progress" }]];
    await expect(updateProjectTaskStatus(81, "done", 7)).resolves.toEqual({ success: true });
    expect(state.inserts).toContainEqual(expect.objectContaining({ table: auditEvents, values: expect.objectContaining({ entityType: "project_task", entityId: 81, action: "status_changed", actorId: 7 }) }));
  });

  it("arquiva evidência sem apagar o histórico e registra o evento", async () => {
    state.selectResults = [[{ id: 41, archivedAt: null, storageKey: "evidence/41.pdf" }]];
    await expect(archiveEvidenceFile(41, 7)).resolves.toEqual({ success: true, alreadyApplied: false });
    expect(state.updates).toContainEqual(expect.objectContaining({ table: evidenceFiles, values: expect.objectContaining({ archivedAt: expect.any(Date) }) }));
    expect(state.inserts).toContainEqual(expect.objectContaining({ table: auditEvents, values: expect.objectContaining({ entityType: "evidence_file", entityId: 41, action: "archived", actorId: 7 }) }));
  });
});
