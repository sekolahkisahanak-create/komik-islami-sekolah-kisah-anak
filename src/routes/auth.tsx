import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk / Daftar — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Masuk atau daftar akun gratis untuk membaca semua episode komik Islami." },
      { property: "og:title", content: "Masuk / Daftar — Komik Islami" },
      { property: "og:description", content: "Daftar gratis untuk membaca dan menyimpan progres membaca keluarga." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/", replace: true });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message === "Invalid login credentials" ? "Email atau kata sandi salah" : error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
      });
      if (error) toast.error(error.message);
      else if (!data.session) setSent(true);
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl bg-card p-6 shadow-card sm:p-8">
        <BrandMark className="mx-auto h-14 w-14" />
        <h1 className="mt-3 text-center text-2xl font-bold">{mode === "login" ? "Masuk" : "Daftar Akun Keluarga"}</h1>
        {sent ? (
          <p className="mt-4 rounded-2xl bg-accent p-4 text-center text-sm">
            Hampir selesai! Cek email <b>{email}</b> dan klik tautan konfirmasi untuk mengaktifkan akun.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Nama</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="pw">Kata sandi</Label>
              <Input id="pw" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {mode === "login" ? "Masuk" : "Daftar"}
            </Button>
          </form>
        )}
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setSent(false); }} className="mt-4 w-full text-center text-sm text-muted-foreground underline">
          {mode === "login" ? "Belum punya akun? Daftar gratis" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </main>
  );
}
