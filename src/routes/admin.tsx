import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NeedLogin, Page } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContentManager } from "@/components/content-manager";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dasbor Admin — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Kelola konten komik dan soal Kuis Seru per episode." },
      { property: "og:title", content: "Dasbor Admin — Komik Islami" },
      { property: "og:description", content: "Kelola konten komik dan soal Kuis Seru per episode." },
    ],
  }),
  component: AdminPage,
});

type Q = { id?: string; question: string; options: string[]; correct_index: number; explanation: string; time_limit_sec: number; position: number };

function AdminPage() {
  const { user, ready, isAdmin } = useAuth();
  if (ready && !user) return <Page><NeedLogin /></Page>;
  if (ready && !isAdmin) return <Page><p className="text-center text-muted-foreground">Halaman ini khusus admin.</p></Page>;
  if (!ready) return <Page><p className="text-center text-muted-foreground">Memuat…</p></Page>;
  return (
    <Page className="space-y-6">
      <h1 className="text-3xl font-extrabold">Dasbor Admin</h1>
      <ContentManager />
      <QuizManager />
    </Page>
  );
}

/* ============================== SOAL KUIS SERU ============================== */

function QuizManager() {
  const qc = useQueryClient();
  const [episodeId, setEpisodeId] = useState("");
  const [draft, setDraft] = useState<Q[]>([]);

  const { data: episodes = [] } = useQuery({
    queryKey: ["admin-episodes"],
    queryFn: async () => (await supabase.from("episodes").select("id, number, title, series:series_id(title)").order("series_id").order("number")).data ?? [],
  });
  const { data: questions } = useQuery({
    queryKey: ["admin-quiz", episodeId],
    enabled: !!episodeId,
    queryFn: async () => ((await supabase.from("quiz_questions").select("id, question, options, correct_index, explanation, time_limit_sec, position").eq("episode_id", episodeId).order("position")).data ?? []) as Q[],
  });
  useEffect(() => { if (questions) setDraft(questions.map((q) => ({ ...q, options: [0, 1, 2, 3].map((k) => q.options[k] ?? "") }))); }, [questions]);

  const update = (i: number, patch: Partial<Q>) => setDraft((d) => d.map((q, k) => (k === i ? { ...q, ...patch } : q)));

  async function ensureQuiz() {
    const ep = episodes.find((e) => e.id === episodeId);
    const { data, error } = await supabase.from("quizzes").upsert({ episode_id: episodeId, title: `Kuis Seru: ${ep?.title ?? ""}` }, { onConflict: "episode_id" }).select("id").single();
    if (error) throw error;
    return data.id;
  }

  async function saveQ(i: number) {
    const q = draft[i];
    if (!q) return;
    if (!q.question.trim() || q.options.some((o) => !o.trim())) { toast.error("Isi pertanyaan dan keempat pilihan."); return; }
    try {
      const quiz_id = await ensureQuiz();
      const row = { episode_id: episodeId, quiz_id, question: q.question.trim(), options: q.options.map((o) => o.trim()), correct_index: q.correct_index, explanation: q.explanation.trim(), time_limit_sec: q.time_limit_sec || 20, position: q.position };
      const { error } = q.id ? await supabase.from("quiz_questions").update(row).eq("id", q.id) : await supabase.from("quiz_questions").insert(row);
      if (error) throw error;
      toast.success("Soal tersimpan");
      qc.invalidateQueries({ queryKey: ["admin-quiz", episodeId] });
      qc.invalidateQueries({ queryKey: ["quiz", episodeId] });
    } catch (e) { toast.error((e as Error).message); }
  }

  async function removeQ(i: number) {
    const q = draft[i];
    if (!q) return;
    if (q.id) {
      const { error } = await supabase.from("quiz_questions").delete().eq("id", q.id);
      if (error) { toast.error(error.message); return; }
      qc.invalidateQueries({ queryKey: ["admin-quiz", episodeId] });
    } else setDraft((d) => d.filter((_, k) => k !== i));
  }

  return (
    <>
      <section className="rounded-3xl bg-card p-5 shadow-card">
        <h2 className="text-xl font-bold">Soal Kuis Seru</h2>
        <label className="mt-3 block text-sm font-semibold" htmlFor="ep">Pilih episode</label>
        <select id="ep" value={episodeId} onChange={(e) => setEpisodeId(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-card px-3 text-sm">
          <option value="">— pilih —</option>
          {episodes.map((e) => (
            <option key={e.id} value={e.id}>{(e.series as unknown as { title: string } | null)?.title} · Ep {e.number}: {e.title}</option>
          ))}
        </select>
      </section>

      {episodeId && (
        <section className="space-y-4">
          {draft.map((q, i) => (
            <div key={q.id ?? `new-${i}`} className="rounded-3xl bg-card p-5 shadow-card">
              <div className="flex items-center gap-2">
                <span className="font-bold">Soal</span>
                <Input type="number" className="w-20" value={q.position} onChange={(e) => update(i, { position: Number(e.target.value) })} aria-label="Urutan" />
                <span className="ml-auto text-sm">Waktu (detik)</span>
                <Input type="number" className="w-20" value={q.time_limit_sec} onChange={(e) => update(i, { time_limit_sec: Number(e.target.value) })} aria-label="Batas waktu" />
              </div>
              <Input className="mt-3" placeholder="Pertanyaan" value={q.question} onChange={(e) => update(i, { question: e.target.value })} />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, k) => (
                  <label key={k} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${i}`} checked={q.correct_index === k} onChange={() => update(i, { correct_index: k })} aria-label={`Pilihan ${k + 1} benar`} />
                    <Input placeholder={`Pilihan ${k + 1}`} value={o} onChange={(e) => update(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} />
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Tandai bulatan di pilihan yang benar.</p>
              <Input className="mt-3" placeholder="Penjelasan satu kalimat" value={q.explanation} onChange={(e) => update(i, { explanation: e.target.value })} />
              <div className="mt-3 flex gap-2">
                <Button variant="navy" onClick={() => saveQ(i)}><Save /> Simpan</Button>
                <Button variant="outline" onClick={() => removeQ(i)}><Trash2 /> Hapus</Button>
              </div>
            </div>
          ))}
          <Button variant="hero" onClick={() => setDraft((d) => [...d, { question: "", options: ["", "", "", ""], correct_index: 0, explanation: "", time_limit_sec: 20, position: d.length + 1 }])}>
            <Plus /> Tambah Soal
          </Button>
        </section>
      )}
    </>
  );
}
