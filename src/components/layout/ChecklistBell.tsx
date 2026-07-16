"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { CHECKLIST_TASKS, CHECKLIST_CATEGORIES } from "@/app/checklist/tasks";
import { getChecklist, toggleChecklistItem } from "@/app/checklist/actions";

export default function ChecklistBell() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getChecklist()
      .then((rows) => {
        const map: Record<string, boolean> = {};
        for (const r of rows) map[r.key] = r.done;
        setDone(map);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const total = CHECKLIST_TASKS.length;
  const completed = CHECKLIST_TASKS.filter((t) => done[t.key]).length;
  const remaining = total - completed;

  function toggle(key: string) {
    const next = !done[key];
    setDone((d) => ({ ...d, [key]: next })); // optimistic
    toggleChecklistItem(key, next).then((res) => {
      if (!res.ok) setDone((d) => ({ ...d, [key]: !next })); // revert on failure
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Setup checklist"
        className="relative p-2 rounded-lg bg-[#1a1d27] border border-[#2a2d3a] text-[#8b8fa8] hover:text-white"
      >
        <Bell className="w-4 h-4" />
        {loaded && remaining > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-indigo-600 text-white rounded-full">
            {remaining}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto z-50 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-2xl">
            <div className="p-4 border-b border-[#2a2d3a]">
              <p className="text-white font-semibold text-sm">Setup checklist</p>
              <p className="text-[#8b8fa8] text-xs mt-0.5">{completed} of {total} complete</p>
              <div className="mt-2 h-1.5 rounded-full bg-[#2a2d3a] overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="p-2">
              {CHECKLIST_CATEGORIES.map((cat) => {
                const tasks = CHECKLIST_TASKS.filter((t) => t.category === cat);
                if (!tasks.length) return null;
                return (
                  <div key={cat} className="mb-1">
                    <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#8b8fa8]">
                      {cat}
                    </p>
                    {tasks.map((t) => {
                      const isDone = !!done[t.key];
                      return (
                        <div key={t.key} className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#2a2d3a]/50">
                          <button
                            onClick={() => toggle(t.key)}
                            title={isDone ? "Mark as not done" : "Mark as done"}
                            className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                              isDone ? "bg-indigo-600 border-indigo-600" : "border-[#3a3d4a] hover:border-indigo-500"
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={t.href}
                              onClick={() => setOpen(false)}
                              className={`text-sm ${isDone ? "text-[#8b8fa8] line-through" : "text-white hover:text-indigo-400"}`}
                            >
                              {t.label}
                            </Link>
                            <p className="text-[#8b8fa8] text-xs leading-snug">{t.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
