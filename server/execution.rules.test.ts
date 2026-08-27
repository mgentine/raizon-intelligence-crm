import { describe, expect, it } from "vitest";
import { calculateExecutionProgress, canCloseExecution, canTransitionExecution, hasOpenRequiredChecklist, canUploadProjectEvidence, MAX_PROJECT_EVIDENCE_BYTES } from "../shared/executionRules";

describe("Execution rules", () => {
  it("permite o avanço operacional na ordem correta", () => {
    expect(canTransitionExecution("planning", "in_progress")).toBe(true);
    expect(canTransitionExecution("in_progress", "delivered")).toBe(true);
    expect(canTransitionExecution("delivered", "accepted")).toBe(true);
    expect(canTransitionExecution("accepted", "closed")).toBe(true);
    expect(canTransitionExecution("planning", "accepted")).toBe(false);
  });

  it("identifica checklist obrigatório ainda aberto", () => {
    expect(hasOpenRequiredChecklist([{ required: 1, status: "pending" }, { required: 0, status: "pending" }])).toBe(true);
    expect(hasOpenRequiredChecklist([{ required: 1, status: "approved" }, { required: 1, status: "waived" }])).toBe(false);
  });

  it("só permite encerrar após aceite e checklist resolvido", () => {
    expect(canCloseExecution("in_progress", [])).toBe(false);
    expect(canCloseExecution("accepted", [{ required: 1, status: "pending" }])).toBe(false);
    expect(canCloseExecution("accepted", [{ required: 1, status: "approved" }])).toBe(true);
  });

  it("valida anexos técnicos antes do upload", () => {
    expect(canUploadProjectEvidence({ title: "Relatório de campo", sizeBytes: 1024 })).toBe(true);
    expect(canUploadProjectEvidence({ title: " ", sizeBytes: 1024 })).toBe(false);
    expect(canUploadProjectEvidence({ title: "Arquivo vazio", sizeBytes: 0 })).toBe(false);
    expect(canUploadProjectEvidence({ title: "Arquivo grande", sizeBytes: MAX_PROJECT_EVIDENCE_BYTES + 1 })).toBe(false);
  });

  it("calcula progresso de tarefas, checklist e visão geral", () => {
    expect(calculateExecutionProgress([{ status: "done" }, { status: "in_progress" }, { status: "cancelled" }], [{ required: 1, status: "approved" }, { required: 1, status: "pending" }, { required: 0, status: "pending" }])).toEqual({ taskProgress: 50, checklistProgress: 50, overallProgress: 50, completedTasks: 1, totalTasks: 2, resolvedChecklist: 1, totalChecklist: 2 });
    expect(calculateExecutionProgress([], [])).toEqual({ taskProgress: null, checklistProgress: null, overallProgress: 0, completedTasks: 0, totalTasks: 0, resolvedChecklist: 0, totalChecklist: 0 });
  });
});
