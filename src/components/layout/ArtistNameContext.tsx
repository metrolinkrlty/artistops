"use client";

import { createContext, useContext } from "react";

// The current artist's display name (or the impersonated artist's, when an admin
// is viewing as someone). Provided by RootLayoutClient so the page Header can
// always show whose workspace this is, with no per-page prop drilling.
const ArtistNameContext = createContext<string>("");

export function ArtistNameProvider({ value, children }: { value: string; children: React.ReactNode }) {
  return <ArtistNameContext.Provider value={value}>{children}</ArtistNameContext.Provider>;
}

export function useArtistName(): string {
  return useContext(ArtistNameContext);
}
