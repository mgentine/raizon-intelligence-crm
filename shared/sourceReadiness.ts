export type SourceUpdateState = "updated" | "blocked_no_authorized_endpoint";
export type OperationalAutomationState = "disabled_pending_authorization";

export type SourceUpdateReadiness = {
  cetesb: SourceUpdateState;
  spAguas: SourceUpdateState;
};

export function getSourceUpdateReadiness(input: { cetesbAuthorizedEndpoint?: boolean; spAguasAuthorizedEndpoint?: boolean } = {}): SourceUpdateReadiness {
  return {
    cetesb: input.cetesbAuthorizedEndpoint ? "updated" : "blocked_no_authorized_endpoint",
    spAguas: input.spAguasAuthorizedEndpoint ? "updated" : "blocked_no_authorized_endpoint",
  };
}

export function getOperationalAutomationState(): OperationalAutomationState {
  return "disabled_pending_authorization";
}

export function buildBlockedSourceAttempt(source: "cetesb" | "sp_aguas", message: string) {
  return {
    source,
    filename: "scheduled-source-update",
    status: "failed" as const,
    receivedCount: 0,
    insertedCount: 0,
    updatedCount: 0,
    conflictCount: 0,
    rejectedCount: 0,
    errorMessage: message,
  };
}
