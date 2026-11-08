import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, FileText, Image as ImageIcon, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const BUCKET = "comic-pages";

function storagePathFromUrl(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

async function uploadImage(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/* PDF.js dimuat dari CDN hanya saat admin mengunggah PDF (tidak membebani situs). */
type PdfViewport = { width: number; height: number };
type PdfPage = { getViewport: (o: { scale: number }) => PdfViewport; render: (o: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => { promise: Promise<void> } };
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfJs = { getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PdfDoc> }; GlobalWorkerOptions: { workerSrc: string } };

async function loadPdfJs(): Promise<PdfJs> {
  const base = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build";
  const mod = (await import(/* @vite-ignore */ `${base}/pdf.min.mjs`)) as PdfJs;
  mod.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`;
  return mod;
}

/* ============================== KELOLA KONTEN ============================== */

type Sr = { id: string; title: string; slug: string; cover_url: string | null };
type Ep = { id: string; series_id: string; number: number; title: string; synopsis: string | null; is_premium: boolean; published: boolean; ibrah: string[] | null; discussion_question: string | null };
type Pg = { id: string; episode_id: string; position: number; image_url: string };

export function ContentManager() {
  const qc = useQueryClient();
  const [seriesId, setSeriesId] = useState("");
  const [episodeId, setEpisodeId] = useState("");
  const [form, setForm] = useState<Partial<Ep>>({});
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<Pg | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const { data: seriesList = [] } = useQuery({
    queryKey: ["cm-series"],
    queryFn: async () => ((await supabase.from("series").select("id, title, slug, cover_url").order("title")).data ?? []) as Sr[],
  });
  const { data: episodes = [] } = useQuery({
    queryKey: ["cm-episodes", seriesId],
    enabled: !!seriesId,
    queryFn: async () => ((await supabase.from("episodes").select("id, series_id, number, title, synopsis, is_premium, published, ibrah, discussion_question").eq("series_id", seriesId).order("number")).data ?? []) as Ep[],
  });
  const { data: pages = [] } = useQuery({
    queryKey: ["cm-pages", episodeId],
    enabled: !!episodeId,
    queryFn: async () => ((await supabase.from("episode_pages").select("id, episode_id, position, image_url").eq("episode_id", episodeId).order("position")).data ?? []) as Pg[],
  });

  const series = seriesList.find((s) => s.id === seriesId) ?? null;
  const episode = episodes.find((e) => e.id === episodeId) ?? null;
  useEffect(() => { if (episode) setForm({ ...episode }); }, [episodeId, episodes]);

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["cm-episodes", seriesId] });
    qc.invalidateQueries({ queryKey: ["cm-pages", episodeId] });
    qc.invalidateQueries({ queryKey: ["cm-series"] });
  };

  async function createEpisode() {
    if (!seriesId || !newTitle.trim()) { toast.error("Pilih seri dan isi judul episode."); return; }
    const number = (episodes.reduce((m, e) => Math.max(m, e.number), 0) || 0) + 1;
    const { data, error } = await supabase.from("episodes").insert({ series_id: seriesId, number, title: newTitle.trim(), published: false, is_premium: false }).select("id").single();
    if (error) { toast.error(error.message); return; }
    setNewTitle("");
    toast.success(`Episode ${number} dibuat (masih draf).`);
    inv();
    if (data) setEpisodeId(data.id);
  }

  async function saveEpisode() {
    if (!episode) return;
    const row = {
      number: Number(form.number ?? episode.number),
      title: (form.title ?? "").trim(),
      synopsis: form.synopsis ?? "",
      ibrah: form.ibrah ?? [],
      discussion_question: form.discussion_question ?? "",
      is_premium: !!form.is_premium,
      published: !!form.published,
    };
    if (!row.title) { toast.error("Judul tidak boleh kosong."); return; }
    const { error } = await supabase.from("episodes").update(row).eq("id", episode.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Episode tersimpan");
    inv();
  }

  async function deleteEpisode() {
    if (!episode) return;
    if (!window.confirm(`Hapus episode "${episode.title}" beserta semua halamannya?`)) return;
    for (const p of pages) {
      const path = storagePathFromUrl(p.image_url);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    const { error } = await supabase.from("episodes").delete().eq("id", episode.id);
    if (error) { toast.error(error.message); return; }
    setEpisodeId("");
    toast.success("Episode dihapus");
    inv();
  }

  async function uploadPages(files: FileList | null) {
    if (!files || !episode) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (!list.length) { toast.error("Tidak ada berkas gambar."); return; }
    await uploadPageFiles(list);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadPdf(files: FileList | null) {
    if (!files || !files[0] || !episode) return;
    const file = files[0];
    try {
      setBusy("Memuat pembaca PDF…");
      const pdfjs = await loadPdfJs();
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const made: File[] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        setBusy(`Mengubah PDF: halaman ${n} dari ${pdf.numPages}…`);
        const page = await pdf.getPage(n);
        const baseVp = page.getViewport({ scale: 1 });
        const scale = Math.min(3, Math.max(1, 1000 / baseVp.width));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Browser ini tidak bisa membuka kanvas gambar.");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.85));
        if (!blob) throw new Error(`Halaman ${n} gagal diubah menjadi gambar.`);
        made.push(new File([blob], `halaman-${String(n).padStart(3, "0")}.webp`, { type: "image/webp" }));
      }
      await uploadPageFiles(made);
    } catch (e) {
      toast.error(`PDF gagal diproses: ${(e as Error).message}`);
      setBusy("");
    }
    if (pdfRef.current) pdfRef.current.value = "";
  }

  async function uploadPageFiles(list: File[]) {
    if (!episode) return;
    let pos = pages.reduce((m, p) => Math.max(m, p.position), 0);
    let ok = 0;
    for (const [i, f] of list.entries()) {
      setBusy(`Mengunggah ${i + 1} dari ${list.length}: ${f.name}`);
      try {
        pos += 1;
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const url = await uploadImage(f, `${episode.id}/${String(pos).padStart(3, "0")}-${Date.now()}.${ext}`);
        const { error } = await supabase.from("episode_pages").insert({ episode_id: episode.id, position: pos, image_url: url });
        if (error) throw error;
        ok += 1;
      } catch (e) { toast.error(`${f.name}: ${(e as Error).message}`); pos -= 1; }
    }
    setBusy("");
    toast.success(`${ok} halaman terunggah.`);
    inv();
  }

  async function movePage(p: Pg, dir: 1 | -1) {
    const idx = pages.findIndex((x) => x.id === p.id);
    const other = pages[idx + dir];
    if (!other) return;
    await supabase.from("episode_pages").update({ position: other.position }).eq("id", p.id);
    await supabase.from("episode_pages").update({ position: p.position }).eq("id", other.id);
    inv();
  }

  async function deletePage(p: Pg) {
    if (!window.confirm(`Hapus halaman ${p.position}?`)) return;
    const path = storagePathFromUrl(p.image_url);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    const { error } = await supabase.from("episode_pages").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Halaman dihapus");
    inv();
  }

  async function replacePage(files: FileList | null) {
    const p = replaceTarget.current;
    if (!files || !files[0] || !p) return;
    setBusy("Mengganti halaman…");
    try {
      const f = files[0];
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const url = await uploadImage(f, `${p.episode_id}/${String(p.position).padStart(3, "0")}-ganti-${Date.now()}.${ext}`);
      const { error } = await supabase.from("episode_pages").update({ image_url: url }).eq("id", p.id);
      if (error) throw error;
      const old = storagePathFromUrl(p.image_url);
      if (old) await supabase.storage.from(BUCKET).remove([old]);
      toast.success("Halaman diganti");
      inv();
    } catch (e) { toast.error((e as Error).message); }
    setBusy("");
    if (replaceRef.current) replaceRef.current.value = "";
  }

  async function uploadCover(files: FileList | null) {
    if (!files || !files[0] || !series) return;
    setBusy("Mengunggah cover…");
    try {
      const f = files[0];
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const url = await uploadImage(f, `covers/${series.id}-${Date.now()}.${ext}`);
      const { error } = await supabase.from("series").update({ cover_url: url }).eq("id", series.id);
      if (error) throw error;
      toast.success("Cover seri diperbarui");
      inv();
    } catch (e) { toast.error((e as Error).message); }
    setBusy("");
    if (coverRef.current) coverRef.current.value = "";
  }

  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
      <h2 className="text-xl font-bold">Kelola Konten Komik</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold" htmlFor="cm-series">Pilih seri</label>
          <select id="cm-series" value={seriesId} onChange={(e) => { setSeriesId(e.target.value); setEpisodeId(""); }} className="mt-1 h-10 w-full rounded-md border bg-card px-3 text-sm">
            <option value="">— pilih —</option>
            {seriesList.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold" htmlFor="cm-episode">Pilih episode</label>
          <select id="cm-episode" value={episodeId} onChange={(e) => setEpisodeId(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-card px-3 text-sm" disabled={!seriesId}>
            <option value="">— pilih —</option>
            {episodes.map((e) => <option key={e.id} value={e.id}>Ep {e.number}: {e.title}{e.published ? "" : " (draf)"}</option>)}
          </select>
        </div>
      </div>

      {series && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-3">
          {series.cover_url ? <img src={series.cover_url} alt={`Cover ${series.title}`} className="h-16 w-12 rounded object-cover" /> : <div className="flex h-16 w-12 items-center justify-center rounded bg-muted text-xs">Cover</div>}
          <div className="text-sm">
            <p className="font-semibold">{series.title}</p>
            <p className="text-muted-foreground">Cover seri</p>
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadCover(e.target.files)} />
          <Button variant="outline" onClick={() => coverRef.current?.click()}><ImageIcon /> Ganti Cover</Button>
        </div>
      )}

      {seriesId && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1">
            <label className="block text-sm font-semibold" htmlFor="cm-new">Episode baru</label>
            <Input id="cm-new" placeholder="Judul episode baru" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </div>
          <Button variant="navy" onClick={createEpisode}><Plus /> Buat Episode (Draf)</Button>
        </div>
      )}

      {episode && (
        <div className="space-y-3 rounded-2xl border p-4">
          <h3 className="font-bold">Data Episode</h3>
          <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
            <div>
              <label className="block text-sm font-semibold" htmlFor="f-number">Nomor</label>
              <Input id="f-number" type="number" value={form.number ?? episode.number} onChange={(e) => setForm((f) => ({ ...f, number: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold" htmlFor="f-title">Judul</label>
              <Input id="f-title" value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="f-synopsis">Sinopsis</label>
            <Textarea id="f-synopsis" rows={2} value={form.synopsis ?? ""} onChange={(e) => setForm((f) => ({ ...f, synopsis: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="f-ibrah">Ibrah (satu per baris, maksimal 3)</label>
            <Textarea id="f-ibrah" rows={3} value={(form.ibrah ?? []).join("\n")} onChange={(e) => setForm((f) => ({ ...f, ibrah: e.target.value.split("\n") }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="f-discussion">Pertanyaan diskusi orang tua–anak</label>
            <Input id="f-discussion" value={form.discussion_question ?? ""} onChange={(e) => setForm((f) => ({ ...f, discussion_question: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_premium} onChange={(e) => setForm((f) => ({ ...f, is_premium: e.target.checked }))} /> Premium (berbayar)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} /> Terbitkan (published)</label>
          </div>
          <div className="flex gap-2">
            <Button variant="navy" onClick={saveEpisode}><Save /> Simpan Episode</Button>
            <Button variant="outline" onClick={deleteEpisode}><Trash2 /> Hapus Episode</Button>
          </div>

          <h3 className="pt-2 font-bold">Halaman Komik — {pages.length} halaman</h3>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPages(e.target.files)} />
          <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => uploadPdf(e.target.files)} />
          <div className="flex flex-wrap gap-2">
            <Button variant="hero" onClick={() => fileRef.current?.click()}><Upload /> Unggah Banyak Halaman</Button>
            <Button variant="outline" onClick={() => pdfRef.current?.click()}><FileText /> Unggah PDF Episode</Button>
          </div>
          <p className="text-xs text-muted-foreground">PDF akan dipecah otomatis menjadi gambar per halaman di browser ini. Format paling ringan untuk pembaca: gambar per halaman (JPG/WebP, lebar ±1.000px).</p>
          {busy && <p className="text-sm text-muted-foreground">{busy}</p>}
          <input ref={replaceRef} type="file" accept="image/*" className="hidden" onChange={(e) => replacePage(e.target.files)} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pages.map((p, i) => (
              <div key={p.id} className="rounded-2xl border p-2">
                <img src={p.image_url} alt={`Halaman ${p.position}`} className="aspect-[3/4] w-full rounded object-cover" loading="lazy" />
                <p className="mt-1 text-center text-sm font-semibold">Halaman {p.position}</p>
                <div className="mt-1 flex justify-center gap-1">
                  <Button size="sm" variant="outline" disabled={i === 0} onClick={() => movePage(p, -1)} aria-label="Naik"><ArrowUp /></Button>
                  <Button size="sm" variant="outline" disabled={i === pages.length - 1} onClick={() => movePage(p, 1)} aria-label="Turun"><ArrowDown /></Button>
                  <Button size="sm" variant="outline" onClick={() => { replaceTarget.current = p; replaceRef.current?.click(); }}>Ganti</Button>
                  <Button size="sm" variant="outline" onClick={() => deletePage(p)} aria-label="Hapus"><Trash2 /></Button>
                </div>
              </div>
            ))}
          </div>
          {!pages.length && <p className="text-sm text-muted-foreground">Belum ada halaman. Unggah gambar per halaman — urutan mengikuti nama berkas (mis. Halaman-01, Halaman-02, …) — atau unggah PDF episode-nya langsung, biar dipecah otomatis.</p>}
        </div>
      )}
    </section>
  );
}
