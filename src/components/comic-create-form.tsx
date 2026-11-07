import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AGE_GROUPS, GENRES, STATUSES, statusLabel } from "@/lib/catalog";
import { comicInsert, type ComicDraft } from "@/lib/comic-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialDraft: ComicDraft = { title: "", synopsis: "", sources: "", genre: "Siroh", age_group: "8-12", status: "Ongoing", published: false, is_premium: false };

export function ComicCreateForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ComicDraft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const update = (patch: Partial<ComicDraft>) => setDraft((previous) => ({ ...previous, ...patch }));

  async function createComic(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const row = comicInsert(draft, crypto.randomUUID().slice(0, 8));
      const { data, error } = await supabase.from("series").insert(row).select("id").single();
      if (error) throw error;
      onCreated(data.id);
      toast.success(draft.published ? "Komik ditambahkan ke katalog." : "Komik disimpan sebagai draf.");
      setDraft(initialDraft);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Komik belum tersimpan. Silakan coba lagi.");
    } finally { setSaving(false); }
  }

  if (!open) return <Button variant="hero" onClick={() => setOpen(true)}><Plus /> Tambah Komik</Button>;

  return (
    <form onSubmit={createComic} className="space-y-4 border-y py-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">Komik Baru</h3>
        <Button type="button" variant="ghost" size="icon" aria-label="Tutup formulir komik" disabled={saving} onClick={() => setOpen(false)}><X /></Button>
      </div>
      <div>
        <label htmlFor="comic-title" className="text-sm font-semibold">Judul komik</label>
        <Input id="comic-title" value={draft.title} required disabled={saving} onChange={(event) => update({ title: event.target.value })} />
      </div>
      <div>
        <label htmlFor="comic-synopsis" className="text-sm font-semibold">Sinopsis komik</label>
        <Textarea id="comic-synopsis" rows={3} value={draft.synopsis} disabled={saving} onChange={(event) => update({ synopsis: event.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="comic-genre" className="text-sm font-semibold">Genre</label>
          <select id="comic-genre" className="mt-1 h-10 w-full rounded-md border bg-card px-3 text-sm" value={draft.genre} disabled={saving} onChange={(event) => update({ genre: event.target.value })}>{GENRES.map((genre) => <option key={genre}>{genre}</option>)}</select>
        </div>
        <div>
          <label htmlFor="comic-age" className="text-sm font-semibold">Kelompok usia</label>
          <select id="comic-age" className="mt-1 h-10 w-full rounded-md border bg-card px-3 text-sm" value={draft.age_group} disabled={saving} onChange={(event) => update({ age_group: event.target.value })}>{AGE_GROUPS.map((age) => <option key={age} value={age}>{age} tahun</option>)}</select>
        </div>
        <div>
          <label htmlFor="comic-status" className="text-sm font-semibold">Status cerita</label>
          <select id="comic-status" className="mt-1 h-10 w-full rounded-md border bg-card px-3 text-sm" value={draft.status} disabled={saving} onChange={(event) => update({ status: event.target.value })}>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
        </div>
      </div>
      <div>
        <label htmlFor="comic-sources" className="text-sm font-semibold">Sumber Kisah</label>
        <Textarea id="comic-sources" rows={2} value={draft.sources} disabled={saving} onChange={(event) => update({ sources: event.target.value })} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={draft.is_premium} disabled={saving} onChange={(event) => update({ is_premium: event.target.checked })} />Komik premium</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={draft.published} disabled={saving} onChange={(event) => update({ published: event.target.checked })} />Tampilkan di katalog</label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="navy" disabled={saving}><Save />{saving ? "Menyimpan…" : "Simpan Komik"}</Button>
        <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Batal</Button>
      </div>
    </form>
  );
}