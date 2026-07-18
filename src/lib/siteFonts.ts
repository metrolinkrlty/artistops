// Curated heading fonts an artist can pick for their website. The key is stored
// on ArtistSite.fontFamily; the public site maps the key to a
// real loaded font. Keep this list — and the website's font loader — in sync.
export type SiteFont = {
  key: string;
  label: string;
  note: string;
  category: string;
  css: string;
  gf: string; // Google Fonts family query, e.g. "Playfair+Display:wght@700"
};

export const SITE_FONTS: SiteFont[] = [
  // Clean & modern
  { key: "oswald", label: "Oswald", note: "Bold & condensed (default)", category: "Clean & modern", css: "'Oswald', sans-serif", gf: "Oswald:wght@600" },
  { key: "bebas", label: "Bebas Neue", note: "Big & punchy", category: "Clean & modern", css: "'Bebas Neue', sans-serif", gf: "Bebas+Neue" },
  { key: "montserrat", label: "Montserrat", note: "Clean & geometric", category: "Clean & modern", css: "'Montserrat', sans-serif", gf: "Montserrat:wght@700" },
  { key: "anton", label: "Anton", note: "Heavy impact", category: "Clean & modern", css: "'Anton', sans-serif", gf: "Anton" },
  { key: "teko", label: "Teko", note: "Tall & narrow", category: "Clean & modern", css: "'Teko', sans-serif", gf: "Teko:wght@600" },
  { key: "righteous", label: "Righteous", note: "Rounded retro", category: "Clean & modern", css: "'Righteous', sans-serif", gf: "Righteous" },
  // Classic serif
  { key: "playfair", label: "Playfair Display", note: "Elegant serif", category: "Classic serif", css: "'Playfair Display', serif", gf: "Playfair+Display:wght@700" },
  { key: "lora", label: "Lora", note: "Warm serif", category: "Classic serif", css: "'Lora', serif", gf: "Lora:wght@700" },
  { key: "abril", label: "Abril Fatface", note: "Bold magazine serif", category: "Classic serif", css: "'Abril Fatface', serif", gf: "Abril+Fatface" },
  { key: "cormorant", label: "Cormorant Garamond", note: "Refined & literary", category: "Classic serif", css: "'Cormorant Garamond', serif", gf: "Cormorant+Garamond:wght@700" },
  // Western & country
  { key: "rye", label: "Rye", note: "Old-West wood type", category: "Western & country", css: "'Rye', serif", gf: "Rye" },
  { key: "ewert", label: "Ewert", note: "Bold saloon slab", category: "Western & country", css: "'Ewert', serif", gf: "Ewert" },
  { key: "specialelite", label: "Special Elite", note: "Vintage typewriter", category: "Western & country", css: "'Special Elite', monospace", gf: "Special+Elite" },
  { key: "alfaslab", label: "Alfa Slab One", note: "Heavy rodeo slab", category: "Western & country", css: "'Alfa Slab One', serif", gf: "Alfa+Slab+One" },
  { key: "sancreek", label: "Sancreek", note: "Wanted-poster western", category: "Western & country", css: "'Sancreek', serif", gf: "Sancreek" },
  { key: "bevan", label: "Bevan", note: "Saloon signage", category: "Western & country", css: "'Bevan', serif", gf: "Bevan" },
  // Script & cursive
  { key: "pacifico", label: "Pacifico", note: "Casual cursive", category: "Script & cursive", css: "'Pacifico', cursive", gf: "Pacifico" },
  { key: "dancing", label: "Dancing Script", note: "Flowing script", category: "Script & cursive", css: "'Dancing Script', cursive", gf: "Dancing+Script:wght@700" },
  { key: "greatvibes", label: "Great Vibes", note: "Fancy formal script", category: "Script & cursive", css: "'Great Vibes', cursive", gf: "Great+Vibes" },
  { key: "lobster", label: "Lobster", note: "Bold retro script", category: "Script & cursive", css: "'Lobster', cursive", gf: "Lobster" },
  { key: "sacramento", label: "Sacramento", note: "Thin elegant script", category: "Script & cursive", css: "'Sacramento', cursive", gf: "Sacramento" },
  { key: "caveat", label: "Caveat", note: "Natural handwriting", category: "Script & cursive", css: "'Caveat', cursive", gf: "Caveat:wght@700" },
  // Vintage & decorative
  { key: "monoton", label: "Monoton", note: "Art-deco neon lines", category: "Vintage & decorative", css: "'Monoton', cursive", gf: "Monoton" },
  { key: "limelight", label: "Limelight", note: "1930s Hollywood deco", category: "Vintage & decorative", css: "'Limelight', serif", gf: "Limelight" },
  { key: "poiret", label: "Poiret One", note: "Deco geometric", category: "Vintage & decorative", css: "'Poiret One', sans-serif", gf: "Poiret+One" },
  { key: "cinzel", label: "Cinzel", note: "Roman inscription", category: "Vintage & decorative", css: "'Cinzel', serif", gf: "Cinzel:wght@700" },
  { key: "cinzeldeco", label: "Cinzel Decorative", note: "Ornate Roman", category: "Vintage & decorative", css: "'Cinzel Decorative', serif", gf: "Cinzel+Decorative:wght@700" },
  { key: "yeseva", label: "Yeseva One", note: "Elegant vintage serif", category: "Vintage & decorative", css: "'Yeseva One', serif", gf: "Yeseva+One" },
  { key: "vastshadow", label: "Vast Shadow", note: "Old shadowed signage", category: "Vintage & decorative", css: "'Vast Shadow', serif", gf: "Vast+Shadow" },
  { key: "imfell", label: "IM Fell English", note: "17th-century press", category: "Vintage & decorative", css: "'IM Fell English', serif", gf: "IM+Fell+English" },
  { key: "ultra", label: "Ultra", note: "Heavy antique slab", category: "Vintage & decorative", css: "'Ultra', serif", gf: "Ultra" },
  { key: "unifraktur", label: "UnifrakturMaguntia", note: "Blackletter gothic", category: "Vintage & decorative", css: "'UnifrakturMaguntia', serif", gf: "UnifrakturMaguntia" },
  { key: "pirata", label: "Pirata One", note: "Tavern blackletter", category: "Vintage & decorative", css: "'Pirata One', serif", gf: "Pirata+One" },
  { key: "fredericka", label: "Fredericka the Great", note: "Sketched vintage", category: "Vintage & decorative", css: "'Fredericka the Great', serif", gf: "Fredericka+the+Great" },
  // Bold & display
  { key: "bungee", label: "Bungee", note: "Urban signage", category: "Bold & display", css: "'Bungee', sans-serif", gf: "Bungee" },
  { key: "titanone", label: "Titan One", note: "Chunky & rounded", category: "Bold & display", css: "'Titan One', sans-serif", gf: "Titan+One" },
  { key: "bangers", label: "Bangers", note: "Comic-book impact", category: "Bold & display", css: "'Bangers', cursive", gf: "Bangers" },
  { key: "staatliches", label: "Staatliches", note: "Tall poster caps", category: "Bold & display", css: "'Staatliches', sans-serif", gf: "Staatliches" },
  { key: "shrikhand", label: "Shrikhand", note: "Juicy display", category: "Bold & display", css: "'Shrikhand', serif", gf: "Shrikhand" },
  { key: "fredoka", label: "Fredoka", note: "Friendly & round", category: "Bold & display", css: "'Fredoka', sans-serif", gf: "Fredoka:wght@600" },
  { key: "syne", label: "Syne", note: "Modern art-house", category: "Bold & display", css: "'Syne', sans-serif", gf: "Syne:wght@700" },
];

// Resolve a stored fontFamily key to its CSS + a Google Fonts <link> href that
// loads just that one font (used by the public /sites renderer).
export function fontFor(key: string | null | undefined): { css: string; href: string } {
  const f = SITE_FONTS.find((x) => x.key === key) ?? SITE_FONTS[0];
  return {
    css: f.css,
    href: `https://fonts.googleapis.com/css2?family=${f.gf}&display=swap`,
  };
}

export const DEFAULT_FONT = "oswald";

export const FONT_KEYS = SITE_FONTS.map((f) => f.key) as readonly string[];

// Category order for grouping in the picker dropdown.
export const FONT_CATEGORIES = ["Clean & modern", "Classic serif", "Vintage & decorative", "Bold & display", "Western & country", "Script & cursive"];

// The Google Fonts stylesheet that loads every option (for the picker preview).
export const FONT_PREVIEW_HREF =
  "https://fonts.googleapis.com/css2?family=Oswald:wght@600&family=Bebas+Neue&family=Montserrat:wght@700&family=Anton&family=Teko:wght@600&family=Righteous&family=Playfair+Display:wght@700&family=Lora:wght@700&family=Abril+Fatface&family=Cormorant+Garamond:wght@700&family=Rye&family=Ewert&family=Special+Elite&family=Alfa+Slab+One&family=Sancreek&family=Bevan&family=Pacifico&family=Dancing+Script:wght@700&family=Great+Vibes&family=Lobster&family=Sacramento&family=Caveat:wght@700&family=Monoton&family=Limelight&family=Poiret+One&family=Cinzel:wght@700&family=Cinzel+Decorative:wght@700&family=Yeseva+One&family=Vast+Shadow&family=IM+Fell+English&family=Ultra&family=UnifrakturMaguntia&family=Pirata+One&family=Fredericka+the+Great&family=Bungee&family=Titan+One&family=Bangers&family=Staatliches&family=Shrikhand&family=Fredoka:wght@600&family=Syne:wght@700&display=swap";
