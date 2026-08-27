import { describe, expect, it, vi } from "vitest";
import { isRetryableTransactionError, withTransactionRetry } from "./db";

describe("retry transacional", () => {
  it("reconhece conflitos reexecutáveis do TiDB", () => {
    expect(isRetryableTransactionError(new Error("Write conflict, txnStartTS=123"))).toBe(true);
    expect(isRetryableTransactionError(new Error("Deadlock found when trying to get lock"))).toBe(true);
    expect(isRetryableTransactionError(new Error("Pessimistic lock not found"))).toBe(true);
    expect(isRetryableTransactionError(new Error("Duplicate entry '1' for key"))).toBe(false);
  });

  it("reexecuta apenas conflitos transitórios e preserva o resultado da operação", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("Write conflict"))
      .mockRejectedValueOnce(new Error("Pessimistic lock not found"))
      .mockResolvedValueOnce({ projectId: 42 });

    await expect(withTransactionRetry(operation)).resolves.toEqual({ projectId: 42 });
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("não repete erro de integridade que exige intervenção", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("Duplicate entry 'opportunity:7-2' for key proposals_series_version_unique"));

    await expect(withTransactionRetry(operation)).rejects.toThrow("Duplicate entry");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
