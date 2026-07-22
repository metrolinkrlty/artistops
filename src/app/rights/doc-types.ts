// The document kinds the Rights page files and filters by. Kept in its own
// module because a "use server" file may only export async functions.
export const RIGHTS_DOC_TYPES = [
  "split_sheet",
  "license",
  "sync_license",
  "recording_contract",
  "distribution_agreement",
] as const;
