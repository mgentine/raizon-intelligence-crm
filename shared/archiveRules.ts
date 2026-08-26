export type Archivable = { archivedAt: Date | null };

export function onlyActive<T extends Archivable>(rows: T[]): T[] {
  return rows.filter((row) => !row.archivedAt);
}

export function isActive(row: Archivable): boolean {
  return !row.archivedAt;
}

export function archiveTimestamp(now = new Date()): Date {
  return now;
}

export function isProfileAllowed(profile: string, allowed: readonly string[]): boolean {
  return allowed.includes(profile);
}

export function filterOperationalRows<T extends Archivable>(rows: T[]): T[] {
  return onlyActive(rows);
}

export function onlyActiveBy<T, K extends keyof T>(rows: T[], key: K): T[] {
  return rows.filter((row) => {
    const nested = row[key] as unknown as Archivable | null | undefined;
    return !nested?.archivedAt;
  });
}
