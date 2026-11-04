export const GENRES = ["Siroh", "Ulama & Sahabat", "Remaja 13+"] as const;
export const AGE_GROUPS = ["5-7", "8-12", "13+"] as const;
export const STATUSES = ["Ongoing", "Completed"] as const;

export const statusLabel = (s: string) => (s === "Completed" ? "Tamat" : "Berlanjut");

export const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export type SeriesRow = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  genre: string;
  age_group: string;
  status: string;
  cover_url: string | null;
  cover_hue: number;
  is_premium: boolean;
  featured: boolean;
  updated_at?: string;
};

export const SERIES_COLS =
  "id, slug, title, synopsis, genre, age_group, status, cover_url, cover_hue, is_premium, featured, updated_at";

export function waShareUrl(text: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

/** Shared rule: the first published episode of a series is the free preview. */
export function isFreePreview(episodeNumber: number, firstNumber: number) {
  return episodeNumber === firstNumber;
}
