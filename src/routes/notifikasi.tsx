import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NeedLogin, Page } from "@/components/layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/notifikasi")({
  head: () => ({
    meta: [
      { title: "Notifikasi — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Pemberitahuan episode baru dari seri favorit Anda." },
      { property: "og:title", content: "Notifikasi — Komik Islami" },
      { property: "og:description", content: "Episode baru dan kabar akun Anda." },
    ],
  }),
  component: Notifs,
});

function Notifs() {
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  if (ready && !user) return <Page><NeedLogin /></Page>;
  async function readAll() {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["unread"] });
  }
  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-extrabold">Notifikasi</h1>
        <Button variant="outline" className="rounded-full" onClick={readAll}>Tandai semua dibaca</Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Atur preferensi di <Link to="/profil" className="underline">Keluarga & Lencana</Link>. Notifikasi WhatsApp/email akan hadir kemudian.
      </p>
      <div className="mt-6 space-y-2">
        {data.map((n) => (
          <a key={n.id} href={n.link ?? "#"} className={`block rounded-2xl p-4 shadow-card ${n.read ? "bg-card" : "border-l-4 border-gold bg-gold-soft"}`}>
            <p className="font-semibold">{n.title}</p>
            <p className="text-sm">{n.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("id-ID")}</p>
          </a>
        ))}
        {!data.length && <p className="py-8 text-center text-muted-foreground">Belum ada notifikasi.</p>}
      </div>
    </Page>
  );
}
