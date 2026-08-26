export type SourceUpdateState = "updated" | "blocked_no_authorized_endpoint";

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
