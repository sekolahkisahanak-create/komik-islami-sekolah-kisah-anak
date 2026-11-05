import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NIL, useAuth } from "@/lib/auth";
import { NeedLogin, Page } from "@/components/layout";

export const Route = createFileRoute("/papan-skor")({
  head: () => ({
    meta: [
      { title: "Papan Skor Kuis Seru — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Peringkat poin Kuis Seru seumur hidup untuk semua anggota dan teman sekolahmu." },
      { property: "og:title", content: "Papan Skor Kuis Seru — Komik Islami" },
      { property: "og:description", content: "Siapa juara Kuis Seru? Lihat peringkat semua anggota dan sekolahmu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Leaderboard,
});

type Row = { player_name: string; total_points: number; quizzes: number; is_me: boolean };

function Leaderboard() {
  const { user, ready, activeChildId, children, profile } = useAuth();
  const [tab, setTab] = useState<"semua" | "sekolah">("semua");
  const myLembaga = activeChildId === NIL ? profile?.lembaga : children.find((c) => c.id === activeChildId)?.lembaga;
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["leaderboard", tab, user?.id, activeChildId],
    enabled: !!user,
    queryFn: async () => ((await supabase.rpc("quiz_leaderboard", { _scope: tab, _child_id: activeChildId })).data ?? []) as Row[],
  });

  if (ready && !user) return <Page><NeedLogin text="Masuk untuk melihat Papan Skor." /></Page>;

  return (
    <Page>
      <h1 className="flex items-center gap-2 text-3xl font-extrabold"><Trophy className="text-gold" /> Papan Skor</h1>
      <p className="mt-1 text-muted-foreground">Total poin = jumlah skor terbaik dari setiap kuis episode. Selesaikan lebih banyak kuis untuk naik peringkat!</p>
      <div className="mt-5 inline-flex rounded-full bg-card p-1 shadow-card" role="tablist">
        {(["semua", "sekolah"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full px-5 py-2 text-sm font-bold ${tab === t ? "bg-navy text-navy-foreground" : ""}`}>
            {t === "semua" ? "Semua Anggota" : "Sekolahku"}
          </button>
        ))}
      </div>
      {tab === "sekolah" && !myLembaga?.trim() ? (
        <p className="mt-6 rounded-2xl bg-accent p-4">Isi Sekolah/Lembaga untuk profil aktif di <Link to="/profil" className="font-bold underline">Keluarga & Lencana</Link> agar bisa melihat peringkat sekolahmu.</p>
      ) : (
        <ol className="mt-6 space-y-2">
          {tab === "sekolah" && <p className="text-sm text-muted-foreground">Sekolah: <b>{myLembaga}</b></p>}
          {isLoading && <p className="text-muted-foreground">Memuat…</p>}
          {!isLoading && rows.length === 0 && <p className="text-muted-foreground">Belum ada skor. Jadilah yang pertama bermain Kuis Seru!</p>}
          {rows.map((r, i) => (
            <li key={i} className={`flex items-center gap-3 rounded-2xl p-3 shadow-card ${r.is_me ? "bg-gold-soft ring-2 ring-gold" : "bg-card"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-extrabold ${i < 3 ? "bg-gold text-navy" : "bg-muted"}`}>{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{r.player_name}{r.is_me && " (kamu)"}</span>
              <span className="text-xs text-muted-foreground">{r.quizzes} kuis</span>
              <span className="w-20 text-right font-extrabold">{r.total_points}</span>
            </li>
          ))}
        </ol>
      )}
    </Page>
  );
}
