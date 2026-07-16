"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { CHECKLIST_TASKS } from "./tasks";

export type ChecklistState = { key: string; done: boolean };

// Returns each task's key + done flag. Queried defensively so that a DB not yet
// carrying the ChecklistItem table still renders the app (everything reads as
// not-done until the table exists).
export async function getChecklist(): Promise<ChecklistState[]> {
  const userId = await requireUserId();
  let doneKeys = new Set<string>();
  try {
    const rows = await prisma.checklistItem.findMany({
      where: { userId, done: true },
      select: { key: true },
    });
    doneKeys = new Set(rows.map((r) => r.key));
  } catch {
    // Table not migrated yet — treat all as incomplete.
  }
  return CHECKLIST_TASKS.map((t) => ({ key: t.key, done: doneKeys.has(t.key) }));
}

export async function toggleChecklistItem(
  key: string,
  done: boolean
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  if (!CHECKLIST_TASKS.some((t) => t.key === key)) return { ok: false, error: "Unknown task." };
  try {
    await prisma.checklistItem.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, done },
      update: { done },
    });
  } catch {
    return { ok: false, error: "Couldn't save — the checklist isn't set up yet." };
  }
  return { ok: true };
}
