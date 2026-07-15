// Shared, non-server constants/types for the website config. Kept out of
// actions.ts because a "use server" file may only export async functions.

export const SECTION_KEYS = ["gallery", "shows"] as const;

export type Show = {
  date: string;
  venue: string;
  city: string;
  ticketUrl: string;
};
