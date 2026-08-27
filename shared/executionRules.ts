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

export const MAX_PROJECT_EVIDENCE_BYTES = 5 * 1024 * 1024;

export function canUploadProjectEvidence(input: { title: string; sizeBytes: number }) {
  return input.title.trim().length >= 2 && input.title.trim().length <= 255 && input.sizeBytes > 0 && input.sizeBytes <= MAX_PROJECT_EVIDENCE_BYTES;
}

export function calculateExecutionProgress(
  tasks: Array<{ status: string }>,
  checklist: Array<{ required: number; status: string }>,
) {
  const activeTasks = tasks.filter((item) => item.status !== "cancelled");
  const completedTasks = activeTasks.filter((item) => item.status === "done").length;
  const taskProgress = activeTasks.length ? Math.round((completedTasks / activeTasks.length) * 100) : null;
  const requiredChecklist = checklist.filter((item) => Boolean(item.required));
  const resolvedChecklist = requiredChecklist.filter((item) => ["approved", "waived"].includes(item.status)).length;
  const checklistProgress = requiredChecklist.length ? Math.round((resolvedChecklist / requiredChecklist.length) * 100) : null;
  const availableProgress = [taskProgress, checklistProgress].filter((value): value is number => value !== null);
  const overallProgress = availableProgress.length ? Math.round(availableProgress.reduce((sum, value) => sum + value, 0) / availableProgress.length) : 0;
  return { taskProgress, checklistProgress, overallProgress, completedTasks, totalTasks: activeTasks.length, resolvedChecklist, totalChecklist: requiredChecklist.length };
}

export function canCloseExecution(status: ExecutionStatus, checklist: Array<{ required: number; status: string }>) {
  return status === "accepted" && !hasOpenRequiredChecklist(checklist);
}
