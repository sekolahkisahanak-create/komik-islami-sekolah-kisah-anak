import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NeedLogin, Page, SeriesCard } from "@/components/layout";
import { useProgressList } from "@/components/continue-reading";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERIES_COLS, type SeriesRow } from "@/lib/catalog";

export const Route = createFileRoute("/perpustakaan")({
  head: () => ({
    meta: [
      { title: "Perpustakaanku — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Seri tersimpan, favorit, dan progres membaca keluarga Anda." },
      { property: "og:title", content: "Perpustakaanku — Komik Islami" },
      { property: "og:description", content: "Lanjutkan membaca komik Islami favorit keluarga." },
    ],
  }),
  component: Library,
});

function useSaved(table: "favorites" | "bookmarks") {
  const { user, activeChildId } = useAuth();
  return useQuery({
    queryKey: [table, user?.id, activeChildId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from(table).select(`series:series_id(${SERIES_COLS})`).eq("child_id", activeChildId);
      return (data ?? []).map((r) => r.series as unknown as SeriesRow).filter(Boolean);
    },
  });
}

function Grid({ items }: { items?: SeriesRow[] }) {
  if (!items?.length) return <p className="py-8 text-center text-muted-foreground">Belum ada.</p>;
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{items.map((s) => <SeriesCard key={s.id} s={s} />)}</div>;
}

function Library() {
  const { user, ready, activeName } = useAuth();
  const fav = useSaved("favorites");
  const bm = useSaved("bookmarks");
  const prog = useProgressList();
  if (ready && !user) return <Page><NeedLogin text="Masuk untuk melihat perpustakaanmu." /></Page>;
  const list = prog.data ?? [];
  const Row = ({ p }: { p: (typeof list)[number] }) => {
    const ep = p.episode as unknown as { title: string; number: number };
    const s = p.series as unknown as { title: string };
    return (
      <Link to="/baca/$episodeId" params={{ episodeId: p.episode_id }} className="block min-w-0 rounded-2xl bg-card p-3 shadow-card hover:bg-accent">
        <p className="truncate text-xs text-muted-foreground">{s?.title}</p>
        <p className="truncate font-semibold">{ep?.title}</p>
        <Progress value={Number(p.progress) * 100} className="mt-2 h-2" />
      </Link>
    );
  };
  return (
    <Page>
      <h1 className="text-3xl font-extrabold">Perpustakaanku</h1>
      <p className="text-muted-foreground">Profil aktif: <b>{activeName}</b></p>
      <Tabs defaultValue="progress" className="mt-6">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="progress">Sedang Dibaca</TabsTrigger>
          <TabsTrigger value="done">Selesai</TabsTrigger>
          <TabsTrigger value="bm">Tersimpan</TabsTrigger>
          <TabsTrigger value="fav">Favorit</TabsTrigger>
        </TabsList>
        <TabsContent value="progress" className="mt-4 grid gap-3 sm:grid-cols-2">
          {list.filter((p) => !p.finished).map((p) => <Row key={p.episode_id} p={p} />)}
          {!list.some((p) => !p.finished) && <p className="text-muted-foreground">Belum ada bacaan berjalan.</p>}
        </TabsContent>
        <TabsContent value="done" className="mt-4 grid gap-3 sm:grid-cols-2">
          {list.filter((p) => p.finished).map((p) => <Row key={p.episode_id} p={p} />)}
          {!list.some((p) => p.finished) && <p className="text-muted-foreground">Belum ada episode selesai.</p>}
        </TabsContent>
        <TabsContent value="bm" className="mt-4"><Grid items={bm.data} /></TabsContent>
        <TabsContent value="fav" className="mt-4"><Grid items={fav.data} /></TabsContent>
      </Tabs>
    </Page>
  );
}
