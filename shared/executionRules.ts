export const executionStatuses = ["planning", "in_progress", "blocked", "delivered", "accepted", "closed", "cancelled"] as const;
export type ExecutionStatus = (typeof executionStatuses)[number];

const transitions: Record<ExecutionStatus, readonly ExecutionStatus[]> = {
  planning: ["in_progress", "cancelled"],
  in_progress: ["blocked", "delivered", "cancelled"],
  blocked: ["in_progress", "cancelled"],
  delivered: ["accepted", "in_progress"],
  accepted: ["closed"],
  closed: [],
  cancelled: [],
};

export function canTransitionExecution(current: ExecutionStatus, next: ExecutionStatus) {
  return transitions[current]?.includes(next) ?? false;
}

export function hasOpenRequiredChecklist(items: Array<{ required: number; status: string }>) {
  return items.some((item) => Boolean(item.required) && !["approved", "waived"].includes(item.status));
}

export function canCloseExecution(status: ExecutionStatus, checklist: Array<{ required: number; status: string }>) {
  return status === "accepted" && !hasOpenRequiredChecklist(checklist);
}
