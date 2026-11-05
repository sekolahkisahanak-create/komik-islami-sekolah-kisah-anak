import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, CheckCircle2, List } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LearningSection } from "@/components/learning";

export const Route = createFileRoute("/baca/$episodeId")({
  head: () => ({
    meta: [
      { title: "Baca Komik — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Baca episode komik Islami secara vertikal, lengkap dengan kuis dan ibrah." },
      { property: "og:title", content: "Baca Komik — Komik Islami" },
      { property: "og:description", content: "Membaca komik Islami orisinal bersama keluarga." },
    ],
  }),
  component: Reader,
});

function Reader() {
  const { episodeId } = Route.useParams();
  const { user, ready, activeChildId, activeName } = useAuth();
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const restored = useRef(false);
  const lastSaved = useRef(0);

  const { data: ep } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: async () =>
      (await supabase.from("episodes").select("id, number, title, synopsis, series_id, ibrah, discussion_question, is_premium, series:series_id(slug, title, sources, is_premium)").eq("id", episodeId).maybeSingle()).data,
  });
  const { data: access, isLoading: accessLoading } = useQuery({
    queryKey: ["access", episodeId, user?.id],
    enabled: ready,
    queryFn: async () => {
      const [can, pages] = await Promise.all([
        supabase.rpc("can_read_episode", { _episode_id: episodeId }),
        supabase.from("episode_pages").select("id, image_url, position").eq("episode_id", episodeId).order("position"),
      ]);
      return { can: !!can.data, pages: pages.data ?? [] };
    },
  });
  const { data: siblings = [] } = useQuery({
    queryKey: ["episodes-nav", ep?.series_id],
    enabled: !!ep,
    queryFn: async () => (await supabase.from("episodes").select("id, number, title").eq("series_id", ep!.series_id).order("number")).data ?? [],
  });
  const { data: saved } = useQuery({
    queryKey: ["ep-progress", episodeId, user?.id, activeChildId],
    enabled: !!user,
    queryFn: async () => (await supabase.from("reading_progress").select("progress, finished").eq("episode_id", episodeId).eq("child_id", activeChildId).maybeSingle()).data,
  });

  useEffect(() => {
    restored.current = false;
    setFinished(false);
    setProgress(0);
  }, [episodeId, activeChildId]);

  useEffect(() => {
    if (saved) setFinished(saved.finished);
    if (saved && access?.can && !restored.current && Number(saved.progress) > 0.02 && !saved.finished) {
      restored.current = true;
      requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: h * Number(saved.progress) });
      });
    }
  }, [saved, access?.can]);

  const save = async (p: number, fin: boolean) => {
    if (!user || !ep || !access?.can) return;
    await supabase.from("reading_progress").upsert({
      user_id: user.id,
      child_id: activeChildId,
      episode_id: ep.id,
      series_id: ep.series_id,
      progress: Math.min(1, Math.round(p * 1000) / 1000),
      finished: fin,
      updated_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      setProgress(p);
      const now = Date.now();
      if (now - lastSaved.current > 4000) {
        lastSaved.current = now;
        save(p, finished);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id, user?.id, activeChildId, access?.can, finished]);

  if (!ep) return <p className="p-8 text-center text-muted-foreground">Memuat…</p>;
  const series = ep.series as unknown as { slug: string; title: string; sources: string; is_premium: boolean };
  const idx = siblings.findIndex((x) => x.id === ep.id);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];

  async function markFinished() {
    if (!user) { toast("Masuk dulu untuk menyimpan progres."); return; }
    setFinished(true);
    await save(1, true);
    qc.invalidateQueries({ queryKey: ["progress"] });
    qc.invalidateQueries({ queryKey: ["ep-progress", episodeId] });
    toast.success("Alhamdulillah, episode selesai! Lanjutkan ke kuis di bawah.");
  }

  return (
    <div className="relative">
      <div className="sticky top-16 z-30 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {access?.can && access.pages.length > 0 && (
            <span className="shrink-0 text-xs font-semibold">
              Halaman {Math.min(access.pages.length, Math.max(1, Math.ceil(progress * access.pages.length)))} dari {access.pages.length}
            </span>
          )}
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{Math.round(progress * 100)}%</span>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-2 py-6 sm:px-4">
        <div className="px-2">
          <Link to="/seri/$slug" params={{ slug: series.slug }} className="text-sm text-muted-foreground hover:underline">
            ← {series.title}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{ep.title}</h1>
        </div>

        {accessLoading ? (
          <p className="mt-8 text-center text-muted-foreground">Memuat halaman…</p>
        ) : !access?.can ? (
          <div className="mx-auto mt-8 max-w-md rounded-3xl bg-card p-8 text-center shadow-card">
            <Lock className="mx-auto h-10 w-10 text-gold" />
            {!user ? (
              <>
                <p className="mt-3 font-semibold">Episode ini khusus anggota. Daftar gratis untuk melanjutkan membaca.</p>
                <Button variant="hero" className="mt-4" asChild><Link to="/auth">Masuk / Daftar</Link></Button>
              </>
            ) : (
              <>
                <p className="mt-3 font-semibold">Episode Premium. Berlangganan atau beli seri ini untuk membaca.</p>
                <Button variant="hero" className="mt-4" asChild><Link to="/langganan">Lihat Paket</Link></Button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 select-none" onContextMenu={(e) => e.preventDefault()}>
            {access.pages.map((p) => (
              <div key={p.id} className="relative">
                <img src={p.image_url} alt={`Halaman ${p.position}`} className="block w-full" loading="lazy" draggable={false} />
                <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
                  <span className="-rotate-30 font-display text-2xl font-bold whitespace-nowrap text-navy opacity-10 sm:text-4xl">
                    {activeName || "Tamu"} • Sekolah Kisah Anak
                  </span>
                </div>
              </div>
            ))}
            {access.pages.length === 0 && <p className="py-12 text-center text-muted-foreground">Halaman belum diunggah.</p>}

            <div className="mt-6 text-center">
              {finished ? (
                <p className="inline-flex items-center gap-2 font-semibold text-success"><CheckCircle2 /> Episode selesai dibaca</p>
              ) : (
                <Button variant="hero" size="lg" onClick={markFinished}>Tandai Selesai</Button>
              )}
            </div>
            {finished && (
              <LearningSection episodeId={ep.id} ibrah={ep.ibrah} discussion={ep.discussion_question} sources={series.sources} />
            )}
          </div>
        )}
      </div>

      <nav className="sticky bottom-0 z-30 border-t bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2">
          {prev ? (
            <Button variant="onNavy" size="sm" asChild><Link to="/baca/$episodeId" params={{ episodeId: prev.id }}><ChevronLeft /> Sebelumnya</Link></Button>
          ) : <span />}
          <Link to="/seri/$slug" params={{ slug: series.slug }} className="flex items-center gap-1 text-xs opacity-80"><List className="h-4 w-4" /> Ep {ep.number}</Link>
          {next ? (
            <Button variant="hero" size="sm" asChild><Link to="/baca/$episodeId" params={{ episodeId: next.id }}>Berikutnya <ChevronRight /></Link></Button>
          ) : <span />}
        </div>
      </nav>
    </div>
  );
}
