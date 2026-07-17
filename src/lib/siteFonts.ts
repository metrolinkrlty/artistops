// Curated heading fonts an artist can pick for their website. The key is stored
// on ArtistSite.fontFamily; the public site (lukecorliss.com) maps the key to a
// real loaded font. Keep this list in sync with the website's font loader.
export const SITE_FONTS = [
  { key: "oswald", label: "Oswald", note: "Bold & condensed (default)", css: "'Oswald', sans-serif" },
  { key: "bebas", label: "Bebas Neue", note: "Big & punchy", css: "'Bebas Neue', sans-serif" },
  { key: "playfair", label: "Playfair Display", note: "Elegant serif", css: "'Playfair Display', serif" },
  { key: "montserrat", label: "Montserrat", note: "Clean & modern", css: "'Montserrat', sans-serif" },
  { key: "lora", label: "Lora", note: "Warm serif", css: "'Lora', serif" },
] as const;

export const DEFAULT_FONT = "oswald";

export const FONT_KEYS = SITE_FONTS.map((f) => f.key) as readonly string[];
