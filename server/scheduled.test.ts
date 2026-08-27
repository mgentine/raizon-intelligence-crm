import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateRequestMock = vi.hoisted(() => vi.fn());
const getDbMock = vi.hoisted(() => vi.fn());
const getUserByOpenIdMock = vi.hoisted(() => vi.fn());
const refreshUserNotificationsMock = vi.hoisted(() => vi.fn());
const recordBlockedSourceAttemptMock = vi.hoisted(() => vi.fn(async (source: string) => source === "cetesb" ? 101 : 102));
const sendOperationalDigestEmailMock = vi.hoisted(() => vi.fn(async () => ({ sent: true, skipped: false, messageId: "test-message" })));
const runProposalFollowUpsMock = vi.hoisted(() => vi.fn(async () => ({ scanned: 4, created: 2, skipped: 2 })));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: authenticateRequestMock } }));
vi.mock("./email", () => ({ sendOperationalDigestEmail: sendOperationalDigestEmailMock }));

vi.mock("./db", () => ({
  getDb: getDbMock,
  getUserByOpenId: getUserByOpenIdMock,
  refreshUserNotifications: refreshUserNotificationsMock,
  recordBlockedSourceAttempt: recordBlockedSourceAttemptMock,
  runProposalFollowUps: runProposalFollowUpsMock,
}));

import { refreshCommercialFollowUps, refreshRegulatoryPriorities } from "./scheduled";

function responseDouble() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as any;
  response.status.mockReturnValue(response);
  return response;
}

function requestDouble() {
  return { originalUrl: "/api/scheduled/refresh-regulatory-priorities" } as any;
}

describe("callback periódico regulatório", () => {
  it("bloqueia chamadas que não são de cron antes de acessar o banco", async () => {
    authenticateRequestMock.mockResolvedValueOnce({ isCron: false, taskUid: undefined });
    const res = responseDouble();

    await refreshRegulatoryPriorities(requestDouble(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "cron-only" });
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("retorna erro JSON estruturado quando a autenticação falha", async () => {
    authenticateRequestMock.mockRejectedValueOnce(new Error("sessão inválida"));
    const res = responseDouble();

    await refreshRegulatoryPriorities(requestDouble(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: "sessão inválida",
      context: expect.objectContaining({ url: "/api/scheduled/refresh-regulatory-priorities" }),
      timestamp: expect.any(String),
    }));
  });

  it("mantém a rotina inerte para identidade cron até autorização operacional", async () => {
    authenticateRequestMock.mockResolvedValueOnce({ isCron: true, taskUid: "task-123" });
    const res = responseDouble();

    await refreshRegulatoryPriorities(requestDouble(), res);

    expect(getDbMock).not.toHaveBeenCalled();
    expect(refreshUserNotificationsMock).not.toHaveBeenCalled();
    expect(sendOperationalDigestEmailMock).not.toHaveBeenCalled();
    expect(recordBlockedSourceAttemptMock).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      taskUid: "task-123",
      skipped: "disabled_pending_authorization",
      startedAt: expect.any(String),
      finishedAt: expect.any(String),
    }));
  });
});


describe("callback periódico de follow-up comercial", () => {
  beforeEach(() => runProposalFollowUpsMock.mockClear());
  it("bloqueia chamadas que não são de cron", async () => {
    authenticateRequestMock.mockResolvedValueOnce({ isCron: false, taskUid: undefined });
    const res = responseDouble();
    await refreshCommercialFollowUps(requestDouble(), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(runProposalFollowUpsMock).not.toHaveBeenCalled();
  });

  it("mantém follow-ups inertes para identidade cron até autorização operacional", async () => {
    authenticateRequestMock.mockResolvedValueOnce({ isCron: true, taskUid: "task-followup" });
    const res = responseDouble();
    await refreshCommercialFollowUps(requestDouble(), res);
    expect(runProposalFollowUpsMock).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, taskUid: "task-followup", skipped: "disabled_pending_authorization" }));
  });
});
