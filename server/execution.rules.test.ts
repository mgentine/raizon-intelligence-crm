import { describe, expect, it } from "vitest";
import { canCloseExecution, canTransitionExecution, hasOpenRequiredChecklist } from "../shared/executionRules";

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
});
