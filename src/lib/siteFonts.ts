// Curated heading fonts an artist can pick for their website. The key is stored
// on ArtistSite.fontFamily; the public site (lukecorliss.com) maps the key to a
// real loaded font. Keep this list — and the website's font loader — in sync.
export type SiteFont = {
  key: string;
  label: string;
  note: string;
  category: string;
  css: string;
};

export const SITE_FONTS: SiteFont[] = [
  // Clean & modern
  { key: "oswald", label: "Oswald", note: "Bold & condensed (default)", category: "Clean & modern", css: "'Oswald', sans-serif" },
  { key: "bebas", label: "Bebas Neue", note: "Big & punchy", category: "Clean & modern", css: "'Bebas Neue', sans-serif" },
  { key: "montserrat", label: "Montserrat", note: "Clean & geometric", category: "Clean & modern", css: "'Montserrat', sans-serif" },
  { key: "anton", label: "Anton", note: "Heavy impact", category: "Clean & modern", css: "'Anton', sans-serif" },
  { key: "teko", label: "Teko", note: "Tall & narrow", category: "Clean & modern", css: "'Teko', sans-serif" },
  { key: "righteous", label: "Righteous", note: "Rounded retro", category: "Clean & modern", css: "'Righteous', sans-serif" },
  // Classic serif
  { key: "playfair", label: "Playfair Display", note: "Elegant serif", category: "Classic serif", css: "'Playfair Display', serif" },
  { key: "lora", label: "Lora", note: "Warm serif", category: "Classic serif", css: "'Lora', serif" },
  { key: "abril", label: "Abril Fatface", note: "Bold magazine serif", category: "Classic serif", css: "'Abril Fatface', serif" },
  { key: "cormorant", label: "Cormorant Garamond", note: "Refined & literary", category: "Classic serif", css: "'Cormorant Garamond', serif" },
  // Western & country
  { key: "rye", label: "Rye", note: "Old-West wood type", category: "Western & country", css: "'Rye', serif" },
  { key: "ewert", label: "Ewert", note: "Bold saloon slab", category: "Western & country", css: "'Ewert', serif" },
  { key: "specialelite", label: "Special Elite", note: "Vintage typewriter", category: "Western & country", css: "'Special Elite', monospace" },
  { key: "alfaslab", label: "Alfa Slab One", note: "Heavy rodeo slab", category: "Western & country", css: "'Alfa Slab One', serif" },
  { key: "sancreek", label: "Sancreek", note: "Wanted-poster western", category: "Western & country", css: "'Sancreek', serif" },
  { key: "bevan", label: "Bevan", note: "Saloon signage", category: "Western & country", css: "'Bevan', serif" },
  // Script & cursive
  { key: "pacifico", label: "Pacifico", note: "Casual cursive", category: "Script & cursive", css: "'Pacifico', cursive" },
  { key: "dancing", label: "Dancing Script", note: "Flowing script", category: "Script & cursive", css: "'Dancing Script', cursive" },
  { key: "greatvibes", label: "Great Vibes", note: "Fancy formal script", category: "Script & cursive", css: "'Great Vibes', cursive" },
  { key: "lobster", label: "Lobster", note: "Bold retro script", category: "Script & cursive", css: "'Lobster', cursive" },
  { key: "sacramento", label: "Sacramento", note: "Thin elegant script", category: "Script & cursive", css: "'Sacramento', cursive" },
];

export const DEFAULT_FONT = "oswald";

export const FONT_KEYS = SITE_FONTS.map((f) => f.key) as readonly string[];

// Category order for grouping in the picker dropdown.
export const FONT_CATEGORIES = ["Clean & modern", "Classic serif", "Western & country", "Script & cursive"];

// The Google Fonts stylesheet that loads every option (for the picker preview).
export const FONT_PREVIEW_HREF =
  "https://fonts.googleapis.com/css2?family=Oswald:wght@600&family=Bebas+Neue&family=Montserrat:wght@700&family=Anton&family=Teko:wght@600&family=Righteous&family=Playfair+Display:wght@700&family=Lora:wght@700&family=Abril+Fatface&family=Cormorant+Garamond:wght@700&family=Rye&family=Ewert&family=Special+Elite&family=Alfa+Slab+One&family=Sancreek&family=Bevan&family=Pacifico&family=Dancing+Script:wght@700&family=Great+Vibes&family=Lobster&family=Sacramento&display=swap";
