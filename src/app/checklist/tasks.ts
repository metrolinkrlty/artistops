// The artist setup/release checklist. Defined in code (not the DB) so it's easy
// to evolve; the DB only records which keys an artist has completed.

export type ChecklistTask = {
  key: string;
  category: ChecklistCategory;
  label: string;
  description: string;
  href: string;
};

export const CHECKLIST_CATEGORIES = [
  "Foundation",
  "Catalog",
  "Rights & Publishing",
  "Distribution",
  "Marketing",
] as const;

export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];

export const CHECKLIST_TASKS: ChecklistTask[] = [
  // Foundation
  { key: "profile", category: "Foundation", label: "Set your artist name & profile", description: "Your public identity across ArtistOps.", href: "/settings" },
  { key: "website", category: "Foundation", label: "Build your artist website", description: "A live site fans can visit and join your list.", href: "/website" },

  // Catalog
  { key: "add-songs", category: "Catalog", label: "Add your songs", description: "Get your catalog into ArtistOps.", href: "/songs" },
  { key: "upload-audio", category: "Catalog", label: "Upload your audio", description: "Attach audio files to each song.", href: "/songs" },
  { key: "metadata", category: "Catalog", label: "Complete metadata (ISRC, UPC, credits)", description: "Clean metadata before you distribute — avoids rejections.", href: "/songs" },

  // Rights & Publishing
  { key: "copyrights", category: "Rights & Publishing", label: "Register your copyrights", description: "Track PA/SR registrations per work.", href: "/copyrights" },
  { key: "splits", category: "Rights & Publishing", label: "Confirm songwriter splits", description: "Lock in who owns what before money moves.", href: "/rights" },
  { key: "pro", category: "Rights & Publishing", label: "Set up your PRO (ASCAP/BMI/SESAC)", description: "Register works to collect performance royalties.", href: "/rights" },
  { key: "mechanical", category: "Rights & Publishing", label: "Set up mechanical royalties (The MLC)", description: "Claim your mechanical royalties in the US.", href: "/rights" },

  // Distribution
  { key: "distributor", category: "Distribution", label: "Connect a distributor", description: "DistroKid, CD Baby, or another distributor.", href: "/distributors" },
  { key: "release", category: "Distribution", label: "Create a release", description: "Bundle songs into a single/EP/album.", href: "/releases" },
  { key: "release-date", category: "Distribution", label: "Set your release date", description: "Give yourself lead time for pitching & pre-saves.", href: "/releases" },

  // Marketing
  { key: "smart-links", category: "Marketing", label: "Create a smart link", description: "One link to every platform.", href: "/smart-links" },
  { key: "pixel", category: "Marketing", label: "Set up website pixel tracking", description: "Measure visits & conversions on your site.", href: "/pixel-tracking" },
  { key: "social", category: "Marketing", label: "Connect your social media", description: "Centralize your channels and links.", href: "/social" },
  { key: "presave", category: "Marketing", label: "Set up a pre-save campaign", description: "Build momentum before release day.", href: "/smart-links" },
];
