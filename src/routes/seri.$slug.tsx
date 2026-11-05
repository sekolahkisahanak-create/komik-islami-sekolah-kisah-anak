import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, Lock, Share2, Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Cover, StatusPill } from "@/components/brand";
import { Page, SeriesCard } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { SERIES_COLS, waShareUrl, type SeriesRow } from "@/lib/catalog";

export const Route = createFileRoute("/seri/$slug")({
  head: () => ({
    meta: [
      { title: "Detail Seri — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Sinopsis, sumber kisah, dan daftar episode komik Islami." },
      { property: "og:title", content: "Detail Seri — Komik Islami" },
      { property: "og:description", content: "Baca komik Islami orisinal dari Sekolah Kisah Anak." },
    ],
  }),
  component: SeriesPage,
});

function SeriesPage() {
  const { slug } = Route.useParams();
  const { user, activeChildId } = useAuth();
  const qc = useQueryClient();

  const { data: s } = useQuery({
    queryKey: ["series", slug],
    queryFn: async () => (await supabase.from("series").select(`${SERIES_COLS}, sources`).eq("slug", slug).maybeSingle()).data as (SeriesRow & { sources: string }) | null,
  });
  const { data: episodes = [] } = useQuery({
    queryKey: ["episodes", s?.id],
    enabled: !!s,
    queryFn: async () => (await supabase.from("episodes").select("id, number, title, synopsis, is_premium, release_at").eq("series_id", s!.id).order("number")).data ?? [],
  });
  const { data: rating } = useQuery({
    queryKey: ["rating", s?.id, user?.id],
    enabled: !!s,
    queryFn: async () => {
      const [avg, mine] = await Promise.all([
        supabase.rpc("series_rating", { _series_id: s!.id }),
        user ? supabase.from("ratings").select("stars").eq("series_id", s!.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return { avg: avg.data?.[0]?.avg ?? null, count: avg.data?.[0]?.count ?? 0, mine: mine.data?.stars ?? 0 };
    },
  });
  const { data: mine } = useQuery({
    queryKey: ["series-mine", s?.id, user?.id, activeChildId],
    enabled: !!s && !!user,
    queryFn: async () => {
      const [f, b, p, acc] = await Promise.all([
        supabase.from("favorites").select("series_id").eq("series_id", s!.id).eq("child_id", activeChildId).maybeSingle(),
        supabase.from("bookmarks").select("series_id").eq("series_id", s!.id).eq("child_id", activeChildId).maybeSingle(),
        supabase.from("reading_progress").select("episode_id, finished").eq("series_id", s!.id).eq("child_id", activeChildId),
        supabase.rpc("has_premium_access", { _series_id: s!.id }),
      ]);
      return { fav: !!f.data, bm: !!b.data, progress: p.data ?? [], premium: !!acc.data };
    },
  });
  const { data: similar = [] } = useQuery({
    queryKey: ["similar", s?.id],
    enabled: !!s,
    queryFn: async () => ((await supabase.from("series").select(SERIES_COLS).eq("genre", s!.genre).neq("id", s!.id).limit(5)).data ?? []) as SeriesRow[],
  });
  const { data: others = [] } = useQuery({
    queryKey: ["similar-fallback", s?.id],
    enabled: !!s && similar.length === 0,
    queryFn: async () => ((await supabase.from("series").select(SERIES_COLS).neq("id", s!.id).eq("age_group", s!.age_group).limit(5)).data ?? []) as SeriesRow[],
  });

  if (!s) return <Page><p className="text-muted-foreground">Memuat…</p></Page>;
  const firstNum = episodes[0]?.number;
  const refresh = () => qc.invalidateQueries({ queryKey: ["series-mine", s.id] });

  async function toggle(table: "favorites" | "bookmarks", on: boolean) {
    if (!user) return toast("Masuk dulu untuk menyimpan.");
    if (on) await supabase.from(table).delete().eq("series_id", s!.id).eq("child_id", activeChildId);
    else await supabase.from(table).insert({ user_id: user.id, child_id: activeChildId, series_id: s!.id });
    refresh();
  }
  async function rate(stars: number) {
    if (!user) return toast("Masuk dulu untuk memberi rating.");
    await supabase.from("ratings").upsert({ user_id: user.id, series_id: s!.id, stars });
    qc.invalidateQueries({ queryKey: ["rating", s.id] });
  }
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <Page>
      {s.genre === "Remaja 13+" && (
        <div className="mb-4 rounded-2xl border border-gold bg-gold-soft p-3 text-sm font-semibold">Komik ini khusus pembaca remaja usia 13 tahun ke atas.</div>
      )}
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <Cover series={s} className="mx-auto max-w-[260px] shadow-glow" />
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold">{s.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-navy-foreground">{s.genre}</span>
            <span>Usia {s.age_group}</span>
            <StatusPill status={s.status} />
            {s.is_premium && <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-navy">Premium</span>}
          </div>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => rate(n)} aria-label={`Beri ${n} bintang`}>
                <Star className={`h-6 w-6 ${n <= (rating?.mine ?? 0) ? "fill-gold text-gold" : "text-muted-foreground"}`} />
              </button>
            ))}
            {rating?.avg && Number(rating.count) > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">{rating.avg} ({rating.count} penilaian)</span>
            )}
          </div>
          <p className="mt-4 leading-relaxed">{s.synopsis}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {episodes[0] && (
              <Button variant="hero" asChild>
                <Link to="/baca/$episodeId" params={{ episodeId: episodes[0].id }}>Baca Episode Pertama</Link>
              </Button>
            )}
            <Button variant="outline" className="rounded-full" onClick={() => toggle("favorites", !!mine?.fav)}>
              <Heart className={mine?.fav ? "fill-destructive text-destructive" : ""} /> {mine?.fav ? "Favorit" : "Favoritkan"}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => toggle("bookmarks", !!mine?.bm)}>
              <Bookmark className={mine?.bm ? "fill-navy" : ""} /> {mine?.bm ? "Tersimpan" : "Simpan"}
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href={waShareUrl(`Yuk baca komik "${s.title}" di Komik Islami Sekolah Kisah Anak:`, url)} target="_blank" rel="noreferrer">
                <Share2 /> WhatsApp
              </a>
            </Button>
          </div>
          <div className="mt-6 rounded-2xl bg-accent p-4">
            <h2 className="text-lg font-bold">Sumber Kisah</h2>
            <p className="mt-1 text-sm whitespace-pre-line">{s.sources || "Belum diisi."}</p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Daftar Episode</h2>
        <div className="mt-4 space-y-2">
          {episodes.map((e) => {
            const free = e.number === firstNum && !e.is_premium;
            const premium = e.is_premium || (s.is_premium && e.number !== firstNum);
            const locked = premium ? !mine?.premium : !free && !user;
            const pr = mine?.progress.find((p) => p.episode_id === e.id);
            return (
              <Link key={e.id} to="/baca/$episodeId" params={{ episodeId: e.id }} className="flex min-w-0 items-center gap-3 rounded-2xl bg-card p-3 shadow-card hover:bg-accent">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy font-bold text-navy-foreground">{e.number}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.synopsis}</p>
                </div>
                {pr?.finished && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />}
                {free && <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">Gratis</span>}
                {premium && <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-navy">Premium</span>}
                {locked && <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Seri Serupa</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(similar.length ? similar : others).map((x) => <SeriesCard key={x.id} s={x} />)}
        </div>
      </section>
    </Page>
  );
}
