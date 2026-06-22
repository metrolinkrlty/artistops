"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes

export default function InactivityTimeout() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function logout() {
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch {
        // ignore
      }
      router.push("/login");
      router.refresh();
    }

    function reset() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(logout, IDLE_MS);
    }

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [router]);

  return null;
}
