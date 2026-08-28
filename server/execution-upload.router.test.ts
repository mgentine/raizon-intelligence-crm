import { beforeEach, describe, expect, it, vi } from "vitest";

const storagePutMock = vi.hoisted(() => vi.fn());
const createProjectEvidenceMock = vi.hoisted(() => vi.fn());

vi.mock("./storage", () => ({ storagePut: storagePutMock }));
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, createProjectEvidence: createProjectEvidenceMock };
});

import { appRouter } from "./routers";

describe("execution.uploadEvidence", () => {
  const caller = () => appRouter.createCaller({ user: { id: 7, role: "user", profile: "technical" } } as any);

  beforeEach(() => {
    storagePutMock.mockReset();
    createProjectEvidenceMock.mockReset();
  });

  it("rejeita arquivo acima do limite antes do armazenamento e da persistência", async () => {
    const base64 = Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64");
    await expect(caller().execution.uploadEvidence({ projectId: 1, title: "Relatório técnico", filename: "relatorio.pdf", mimeType: "application/pdf", base64 })).rejects.toThrow("no máximo 5 MB");
    expect(storagePutMock).not.toHaveBeenCalled();
    expect(createProjectEvidenceMock).not.toHaveBeenCalled();
  });

  it("propaga falha de armazenamento sem criar metadados de evidência", async () => {
    storagePutMock.mockRejectedValueOnce(new Error("S3 indisponível"));
    await expect(caller().execution.uploadEvidence({ projectId: 1, title: "Relatório técnico", filename: "relatório técnico.pdf", mimeType: "application/pdf", base64: Buffer.from("conteúdo").toString("base64") })).rejects.toThrow("S3 indisponível");
    expect(createProjectEvidenceMock).not.toHaveBeenCalled();
  });

  it("propaga projeto inexistente após armazenamento sem declarar sucesso", async () => {
    storagePutMock.mockResolvedValueOnce({ key: "execution/7/999/documento.pdf", url: "https://storage.test/documento.pdf" });
    createProjectEvidenceMock.mockRejectedValueOnce(new Error("Projeto de execução não encontrado."));
    await expect(caller().execution.uploadEvidence({ projectId: 999, title: "Relatório técnico", filename: "documento.pdf", mimeType: "application/pdf", base64: Buffer.from("conteúdo").toString("base64") })).rejects.toThrow("Projeto de execução não encontrado");
    expect(createProjectEvidenceMock).toHaveBeenCalledTimes(1);
  });
});
