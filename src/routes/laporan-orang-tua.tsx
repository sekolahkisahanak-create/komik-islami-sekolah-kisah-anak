import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NeedLogin, Page } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/laporan-orang-tua")({
  head: () => ({
    meta: [
      { title: "Laporan Orang Tua — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Ringkasan mingguan aktivitas membaca setiap anak, dilindungi PIN." },
      { property: "og:title", content: "Laporan Orang Tua — Komik Islami" },
      { property: "og:description", content: "Pantau aktivitas membaca anak setiap minggu." },
    ],
  }),
  component: ParentReport,
});

type Row = { child_id: string; name: string; episodes_read: number; episodes_finished: number; quizzes_done: number; reading_days: number };

function ParentReport() {
  const { user, ready } = useAuth();
  const [pin, setPin] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  if (ready && !user) return <Page><NeedLogin /></Page>;

  async function open() {
    const { data, error } = await supabase.rpc("parent_weekly_report", { _pin: pin });
    if (error) { toast.error(error.message.includes("PIN") ? "PIN salah atau belum dibuat" : error.message); return; }
    setRows(data as Row[]);
  }

  return (
    <Page>
      <h1 className="text-3xl font-extrabold">Laporan Orang Tua</h1>
      {!rows ? (
        <div className="mt-6 max-w-sm rounded-3xl bg-card p-6 shadow-card">
          <ShieldCheck className="h-8 w-8 text-gold" />
          <p className="mt-2 font-semibold">Masukkan PIN orang tua</p>
          <div className="mt-3 flex gap-2">
            <Input inputMode="numeric" maxLength={4} type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="w-28 tracking-widest" />
            <Button variant="navy" onClick={open} disabled={pin.length !== 4}>Buka</Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Belum punya PIN? Buat di <Link to="/profil" className="underline">Keluarga & Lencana</Link>.</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-muted-foreground">Ringkasan 7 hari terakhir</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.child_id} className="rounded-3xl bg-card p-5 shadow-card">
                <h2 className="text-xl font-bold">{r.name}</h2>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Episode dibaca", r.episodes_read],
                    ["Episode selesai", r.episodes_finished],
                    ["Kuis dikerjakan", r.quizzes_done],
                    ["Hari membaca", r.reading_days],
                  ].map(([k, v]) => (
                    <div key={k as string} className="rounded-2xl bg-accent p-3">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-2xl font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
