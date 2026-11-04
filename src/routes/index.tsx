import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Sparkles, BookOpen } from "lucide-react";
import heroImg from "@/assets/hero-reading.jpg";
import { supabase } from "@/integrations/supabase/client";
import { AGE_GROUPS, GENRES, SERIES_COLS, STATUSES, statusLabel, type SeriesRow } from "@/lib/catalog";
import { Page, SeriesCard } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { ContinueReading } from "@/components/continue-reading";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Komik Islami — Sekolah Kisah Anak" },
      { name: "description", content: "Baca komik Islami orisinal untuk anak & keluarga: Siroh Nabawiyah, kisah para ulama dan sahabat, serta komik remaja." },
      { property: "og:title", content: "Komik Islami — Sekolah Kisah Anak" },
      { property: "og:description", content: "Berkisah • Beriman • Berakhlak Mulia. Komik Islami orisinal untuk anak dan keluarga." },
    ],
  }),
  component: Home,
});

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${active ? "border-navy bg-navy text-navy-foreground" : "bg-card hover:bg-accent"}`}>
      {children}
    </button>
  );
}

function Home() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [age, setAge] = useState("");
  const [status, setStatus] = useState("");

  const featured = useQuery({
    queryKey: ["featured"],
    queryFn: async () => (await supabase.from("series").select(SERIES_COLS).eq("featured", true).order("created_at", { ascending: false })).data as SeriesRow[],
  });
  const latest = useQuery({
    queryKey: ["latest-episodes"],
    queryFn: async () =>
      (
        await supabase
          .from("episodes")
          .select("id, number, title, release_at, series:series_id(slug, title)")
          .order("release_at", { ascending: false })
          .limit(8)
      ).data ?? [],
  });
  const catalog = useQuery({
    queryKey: ["catalog", q, genre, age, status],
    queryFn: async () => {
      let qb = supabase.from("series").select(SERIES_COLS).order("created_at");
      if (q.trim()) qb = qb.ilike("title", `%${q.trim()}%`);
      if (genre) qb = qb.eq("genre", genre);
      if (age) qb = qb.eq("age_group", age);
      if (status) qb = qb.eq("status", status);
      return ((await qb).data ?? []) as SeriesRow[];
    },
  });

  return (
    <>
      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-navy-soft px-3 py-1 text-xs font-semibold text-gold">
              <Sparkles className="h-3.5 w-3.5" /> Berkisah • Beriman • Berakhlak Mulia
            </p>
            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
              Komik Islami untuk <span className="text-gold">hati kecil</span> yang besar
            </h1>
            <p className="mt-4 max-w-md opacity-85">
              Kisah Nabi ﷺ, para sahabat, dan ulama dalam komik orisinal yang hangat — dibaca bersama keluarga, lengkap dengan kuis dan ibrah di akhir episode.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <a href="#katalog">
                  <BookOpen /> Mulai Membaca
                </a>
              </Button>
              {!user && (
                <Button variant="onNavy" size="lg" asChild>
                  <Link to="/auth">Daftar Gratis</Link>
                </Button>
              )}
            </div>
          </div>
          <img src={heroImg} alt="Anak-anak membaca komik bercahaya di dalam mihrab" className="w-full rounded-3xl shadow-glow" />
        </div>
      </section>

      <Page>
        {user && <ContinueReading />}

        <section>
          <h2 className="text-2xl font-bold">Seri Pilihan</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {featured.data?.map((s) => <SeriesCard key={s.id} s={s} />)}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Update Terbaru</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {latest.data?.map((e) => {
              const s = e.series as unknown as { slug: string; title: string };
              return (
                <Link key={e.id} to="/baca/$episodeId" params={{ episodeId: e.id }} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-card p-3 shadow-card hover:bg-accent">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{s?.title}</p>
                    <p className="truncate font-semibold">{e.title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{new Date(e.release_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="katalog" className="mt-12 scroll-mt-20">
          <h2 className="text-2xl font-bold">Katalog Lengkap</h2>
          <div className="relative mt-4">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul komik…" className="rounded-full bg-card pl-9" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip active={!genre} onClick={() => setGenre("")}>Semua genre</Chip>
            {GENRES.map((g) => <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>{g}</Chip>)}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip active={!age} onClick={() => setAge("")}>Semua usia</Chip>
            {AGE_GROUPS.map((a) => <Chip key={a} active={age === a} onClick={() => setAge(a)}>Usia {a}</Chip>)}
            <span className="mx-1 hidden w-px bg-border sm:block" />
            <Chip active={!status} onClick={() => setStatus("")}>Semua status</Chip>
            {STATUSES.map((s) => <Chip key={s} active={status === s} onClick={() => setStatus(s)}>{statusLabel(s)}</Chip>)}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {catalog.data?.map((s) => <SeriesCard key={s.id} s={s} />)}
          </div>
          {catalog.data?.length === 0 && <p className="mt-6 text-center text-muted-foreground">Tidak ada komik yang cocok.</p>}
        </section>
      </Page>
    </>
  );
}
