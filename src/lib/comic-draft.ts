import type { Database } from "@/integrations/supabase/types";

export type ComicDraft = {
  title: string;
  synopsis: string;
  sources: string;
  genre: string;
  age_group: string;
  status: string;
  published: boolean;
  is_premium: boolean;
};

export function comicInsert(draft: ComicDraft, suffix: string): Database["public"]["Tables"]["series"]["Insert"] {
  const title = draft.title.trim();
  if (!title) throw new Error("Isi judul komik terlebih dahulu.");
  const slug = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "komik";
  return { ...draft, title, synopsis: draft.synopsis.trim(), sources: draft.sources.trim(), slug: `${slug}-${suffix}` };
}