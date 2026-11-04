import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";

export function useProgressList() {
  const { user, activeChildId } = useAuth();
  return useQuery({
    queryKey: ["progress", user?.id, activeChildId],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("reading_progress")
          .select("episode_id, progress, finished, updated_at, episode:episode_id(number, title), series:series_id(slug, title)")
          .eq("child_id", activeChildId)
          .order("updated_at", { ascending: false })
      ).data ?? [],
  });
}

export function ContinueReading() {
  const { data } = useProgressList();
  const items = (data ?? []).filter((x) => !x.finished).slice(0, 4);
  if (!items.length) return null;
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold">Lanjutkan Membaca</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((p) => {
          const ep = p.episode as unknown as { number: number; title: string };
          const s = p.series as unknown as { title: string };
          return (
            <Link key={p.episode_id} to="/baca/$episodeId" params={{ episodeId: p.episode_id }} className="min-w-0 rounded-2xl bg-card p-4 shadow-card hover:bg-accent">
              <p className="truncate text-xs text-muted-foreground">{s?.title}</p>
              <p className="truncate font-semibold">{ep?.title}</p>
              <Progress value={Number(p.progress) * 100} className="mt-2 h-2" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
