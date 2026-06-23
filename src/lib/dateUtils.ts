// Parse a date string as local noon to avoid timezone-shift display issues.
// Dates stored as ISO strings (e.g. "2024-03-15T00:00:00.000Z") display one
// day behind in negative-UTC-offset timezones. Parsing at noon local time fixes this.
export function localDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  // Take just the date portion and anchor to local noon
  return new Date(value.slice(0, 10) + "T12:00:00");
}

export function formatDate(value: string | null | undefined): string {
  const d = localDate(value);
  return d ? d.toLocaleDateString() : "—";
}

export function formatMonthYear(value: string | null | undefined): string {
  const d = localDate(value);
  return d ? d.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
}
