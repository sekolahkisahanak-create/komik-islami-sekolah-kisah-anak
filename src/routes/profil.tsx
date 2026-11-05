import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Award, Flame, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NIL, useAuth } from "@/lib/auth";
import { NeedLogin, Page } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AGE_GROUPS } from "@/lib/catalog";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Keluarga & Lencana — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Kelola profil anak, PIN orang tua, lencana, dan Tantangan Baca 7 Hari." },
      { property: "og:title", content: "Keluarga & Lencana — Komik Islami" },
      { property: "og:description", content: "Profil keluarga dan pencapaian membaca." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, ready, children, activeChildId, setActiveChild, profile, refresh, activeName } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [age, setAge] = useState("8-12");
  const [pin, setPin] = useState("");
  const [lembaga, setLembaga] = useState("");

  const { data } = useQuery({
    queryKey: ["achievements", user?.id, activeChildId],
    enabled: !!user,
    queryFn: async () => {
      const [b, d, hp] = await Promise.all([
        supabase.from("badges").select("code, label, earned_at").eq("child_id", activeChildId).order("earned_at"),
        supabase.from("reading_days").select("day").eq("child_id", activeChildId).order("day", { ascending: false }).limit(14),
        supabase.rpc("has_parent_pin"),
      ]);
      return { badges: b.data ?? [], days: (d.data ?? []).map((x) => x.day), hasPin: !!hp.data };
    },
  });

  if (ready && !user) return <Page><NeedLogin /></Page>;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const doneDays = last7.filter((d) => data?.days.includes(d)).length;

  async function addChild(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("child_profiles").insert({ parent_id: user.id, name: name.trim(), age_group: age, lembaga: lembaga.trim() });
    if (error) { toast.error(error.message); return; }
    setName("");
    setLembaga("");
    await refresh();
    toast.success("Profil anak ditambahkan");
  }
  async function removeChild(id: string) {
    await supabase.from("child_profiles").delete().eq("id", id);
    if (activeChildId === id) setActiveChild(NIL);
    await refresh();
  }
  async function savePin() {
    const { error } = await supabase.rpc("set_parent_pin", { _pin: pin });
    if (error) { toast.error(error.message); return; }
    setPin("");
    toast.success("PIN orang tua tersimpan");
    qc.invalidateQueries({ queryKey: ["achievements"] });
  }
  async function saveLembaga(id: string, value: string) {
    const v = value.trim();
    const { error } = id === NIL
      ? await supabase.from("profiles").update({ lembaga: v }).eq("id", user!.id)
      : await supabase.from("child_profiles").update({ lembaga: v }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await refresh();
    toast.success("Sekolah/Lembaga tersimpan");
  }
  async function toggleNotif(v: boolean) {
    await supabase.from("profiles").update({ notify_new_episode: v }).eq("id", user!.id);
    await refresh();
  }

  return (
    <Page className="space-y-8">
      <h1 className="text-3xl font-extrabold">Keluarga & Lencana</h1>

      <section className="rounded-3xl bg-card p-5 shadow-card">
        <h2 className="text-xl font-bold">Profil Keluarga</h2>
        <p className="text-sm text-muted-foreground">Progres, perpustakaan, favorit, dan kuis dicatat per profil aktif.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={activeChildId === NIL ? "navy" : "outline"} className="rounded-full" onClick={() => setActiveChild(NIL)}>
            {profile?.display_name} (orang tua)
          </Button>
          {children.map((c) => (
            <div key={c.id} className="flex items-center">
              <Button variant={activeChildId === c.id ? "navy" : "outline"} className="rounded-l-full" onClick={() => setActiveChild(c.id)}>
                {c.name} · {c.age_group}
              </Button>
              <Button variant="outline" size="icon" className="rounded-r-full" onClick={() => removeChild(c.id)} aria-label={`Hapus ${c.name}`}>
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
        <form onSubmit={addChild} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Nama anak" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Sekolah/Lembaga (opsional)" value={lembaga} onChange={(e) => setLembaga(e.target.value)} />
          <select value={age} onChange={(e) => setAge(e.target.value)} className="h-9 rounded-md border bg-card px-3 text-sm">
            {AGE_GROUPS.map((a) => <option key={a} value={a}>Usia {a}</option>)}
          </select>
          <Button type="submit" variant="hero">Tambah Anak</Button>
        </form>
        <div className="mt-5 border-t pt-4">
          <h3 className="font-bold">Sekolah/Lembaga</h3>
          <p className="text-sm text-muted-foreground">Dipakai untuk tab "Sekolahku" di Papan Skor. Tulis nama yang sama dengan teman sekolahmu.</p>
          <div className="mt-3 space-y-2">
            {[{ id: NIL, name: `${profile?.display_name ?? "Saya"} (orang tua)`, lembaga: profile?.lembaga ?? "" }, ...children].map((c) => (
              <form key={c.id} className="flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={(e) => { e.preventDefault(); saveLembaga(c.id, String(new FormData(e.currentTarget).get("lembaga") ?? "")); }}>
                <span className="w-48 shrink-0 text-sm font-semibold">{c.name}</span>
                <Input name="lembaga" defaultValue={c.lembaga} placeholder="mis. SDIT Al-Fikri" aria-label={`Sekolah/Lembaga ${c.name}`} />
                <Button type="submit" variant="outline">Simpan</Button>
              </form>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-navy p-5 text-navy-foreground shadow-card">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Flame className="text-gold" /> Tantangan Baca 7 Hari — {activeName}</h2>
        <p className="text-sm opacity-80">Baca minimal satu episode setiap hari selama 7 hari berturut-turut.</p>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {last7.map((d) => (
            <div key={d} className={`rounded-xl py-2 text-center text-xs font-bold ${data?.days.includes(d) ? "bg-gold text-navy" : "bg-navy-soft"}`}>
              {new Date(d).toLocaleDateString("id-ID", { weekday: "short" })}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm">{doneDays}/7 hari tercapai</p>
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-card">
        <h2 className="text-xl font-bold">Lencana</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {data?.badges.map((b) => (
            <div key={b.code} className="flex items-center gap-2 rounded-2xl bg-gold-soft px-3 py-2 text-sm font-semibold">
              <Award className="h-5 w-5 text-gold" /> {b.label}
            </div>
          ))}
          {!data?.badges.length && <p className="text-sm text-muted-foreground">Selesaikan episode pertamamu untuk mendapat lencana!</p>}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <h2 className="text-xl font-bold">PIN Orang Tua</h2>
          <p className="text-sm text-muted-foreground">{data?.hasPin ? "PIN sudah dibuat. Masukkan PIN baru untuk mengganti." : "Buat PIN 4 digit untuk melindungi Laporan Orang Tua."}</p>
          <div className="mt-3 flex gap-2">
            <Input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="w-28 tracking-widest" />
            <Button variant="navy" onClick={savePin} disabled={pin.length !== 4}>Simpan PIN</Button>
          </div>
        </div>
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <h2 className="text-xl font-bold">Notifikasi</h2>
          <div className="mt-3 flex items-center gap-3">
            <Switch id="notif" checked={profile?.notify_new_episode ?? true} onCheckedChange={toggleNotif} />
            <Label htmlFor="notif">Beri tahu saya saat seri favorit punya episode baru</Label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Notifikasi WhatsApp & email akan hadir kemudian.</p>
        </div>
      </section>
    </Page>
  );
}
