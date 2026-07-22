"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Site-wide help tooltips.
//
// Two sources, one readable help box (15px, generous line-height):
//  1. `title` attributes — the browser renders these in a tiny, unstyleable font.
//     We suppress the native tooltip on hover and restore the attribute on leave
//     so screen readers and the DOM keep it.
//  2. Small always-visible caption text (the hint lines under form fields). We
//     detect these by computed font-size rather than class names, so it works for
//     `text-xs`, `text-[11px]`, and the raw-dark pages alike, and echo the same
//     copy back at a readable size.

type Tip = { text: string; x: number; y: number; place: "top" | "bottom" };
type Target = { el: HTMLElement; text: string; kind: "title" | "caption" };

const MAX_W = 384; // matches max-w-sm
const CAPTION_MAX_FONT = 12.5; // px — anything this small is a caption, not body copy
const CAPTION_MIN_CHARS = 40; // long enough to be an explanation, not a badge/count
const CAPTION_MAX_CHARS = 600;

export default function HelpTooltip() {
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let current: HTMLElement | null = null;
    let stashed: string | null = null; // only set for kind === "title"

    const restore = () => {
      if (current && stashed !== null) current.setAttribute("title", stashed);
      current = null;
      stashed = null;
    };
    const hide = () => { restore(); setTip(null); };

    function findTarget(from: HTMLElement | null): Target | null {
      if (!from || from.closest?.('[role="tooltip"]')) return null;

      const titled = from.closest?.("[title]") as HTMLElement | null;
      if (titled) {
        const text = (titled.getAttribute("title") || "").trim();
        if (text) return { el: titled, text, kind: "title" };
      }

      const cap = from.closest?.("p, span, label, li") as HTMLElement | null;
      if (cap) {
        const size = parseFloat(getComputedStyle(cap).fontSize || "16");
        const text = (cap.textContent || "").trim();
        if (size <= CAPTION_MAX_FONT && text.length >= CAPTION_MIN_CHARS && text.length <= CAPTION_MAX_CHARS) {
          return { el: cap, text, kind: "caption" };
        }
      }
      return null;
    }

    function show(t: Target) {
      if (t.kind === "title") {
        stashed = t.el.getAttribute("title");
        t.el.removeAttribute("title"); // suppress the native tooltip
      }
      current = t.el;

      const r = t.el.getBoundingClientRect();
      const place: "top" | "bottom" = r.bottom + 160 > window.innerHeight ? "top" : "bottom";
      const half = MAX_W / 2;
      const x = Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8);
      setTip({ text: t.text, x, y: place === "bottom" ? r.bottom + 8 : r.top - 8, place });
    }

    function onOver(e: Event) {
      const t = findTarget(e.target as HTMLElement | null);
      if (!t) return;
      if (t.el === current) return;
      if (current) hide();
      show(t);
    }

    function onOut(e: MouseEvent) {
      if (!current) return;
      const to = e.relatedTarget as Node | null;
      if (to && current.contains(to)) return;
      hide();
    }

    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseout", onOut as EventListener, true);
    document.addEventListener("focusin", onOver, true);
    document.addEventListener("focusout", hide, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut as EventListener, true);
      document.removeEventListener("focusin", onOver, true);
      document.removeEventListener("focusout", hide, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      restore();
    };
  }, []);

  if (!tip) return null;

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[200] max-w-sm -translate-x-1/2 rounded-lg border border-[#3f4356] bg-[#141824] px-4 py-3 text-[15px] leading-relaxed text-[#e8e9f2] shadow-2xl"
      style={
        tip.place === "bottom"
          ? { left: tip.x, top: tip.y }
          : { left: tip.x, bottom: window.innerHeight - tip.y }
      }
    >
      {tip.text}
    </div>,
    document.body
  );
}
