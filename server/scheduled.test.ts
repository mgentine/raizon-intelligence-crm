import { describe, expect, it, vi } from "vitest";

const authenticateRequestMock = vi.hoisted(() => vi.fn());
const getDbMock = vi.hoisted(() => vi.fn());
const getUserByOpenIdMock = vi.hoisted(() => vi.fn());
const refreshUserNotificationsMock = vi.hoisted(() => vi.fn());
const recordBlockedSourceAttemptMock = vi.hoisted(() => vi.fn(async (source: string) => source === "cetesb" ? 101 : 102));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: authenticateRequestMock } }));
vi.mock("./db", () => ({
  getDb: getDbMock,
  getUserByOpenId: getUserByOpenIdMock,
  refreshUserNotifications: refreshUserNotificationsMock,
  recordBlockedSourceAttempt: recordBlockedSourceAttemptMock,
}));

import { refreshRegulatoryPriorities } from "./scheduled";

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

  it("executa a rotina para identidade cron e retorna métricas da execução", async () => {
    authenticateRequestMock.mockResolvedValueOnce({ isCron: true, taskUid: "task-123" });
    const where = vi.fn().mockResolvedValue([{ affectedRows: 3 }]);
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });
    getDbMock.mockResolvedValueOnce({ update });
    getUserByOpenIdMock.mockResolvedValueOnce({ id: 7 });
    refreshUserNotificationsMock.mockResolvedValueOnce({ created: 2 });
    const res = responseDouble();

    await refreshRegulatoryPriorities(requestDouble(), res);

    expect(update).toHaveBeenCalled();
    expect(refreshUserNotificationsMock).toHaveBeenCalledWith(7);
    expect(recordBlockedSourceAttemptMock).toHaveBeenCalledTimes(2);
    expect(recordBlockedSourceAttemptMock).toHaveBeenCalledWith("cetesb", expect.stringContaining("última versão válida preservada"));
    expect(recordBlockedSourceAttemptMock).toHaveBeenCalledWith("sp_aguas", expect.stringContaining("endpoint/exportação autorizada"));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      taskUid: "task-123",
      refreshed: 3,
      notificationsCreated: 2,
      blockedAttemptIds: [101, 102],
      startedAt: expect.any(String),
      finishedAt: expect.any(String),
    }));
  });
});
