import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Shield, LogOut, User, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BrandMark, Cover, StatusPill } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NIL, useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { SeriesRow } from "@/lib/catalog";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/perpustakaan", label: "Perpustakaanku" },
  { to: "/kelas", label: "Kelas" },
  { to: "/langganan", label: "Langganan" },
  { to: "/tentang", label: "Tentang" },
] as const;

export function SiteHeader() {
  const { user, isAdmin, children, activeChildId, activeName, setActiveChild, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useQuery({
    queryKey: ["unread", user?.id],
    enabled: !!user,
    refetchInterval: 60000,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
      return count ?? 0;
    },
  });

  return (
    <header className="sticky top-0 z-40 bg-navy text-navy-foreground shadow-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <BrandMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-base font-bold">Komik Islami</p>
            <p className="truncate text-[10px] tracking-wide text-gold">Sekolah Kisah Anak</p>
          </div>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-full px-3 py-1.5 text-sm opacity-85 hover:opacity-100" activeProps={{ className: "bg-navy-soft opacity-100" }} activeOptions={{ exact: n.to === "/" }}>
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="rounded-full px-3 py-1.5 text-sm text-gold">
              Admin
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <>
              <Link to="/notifikasi" className="relative rounded-full p-2 hover:bg-navy-soft" aria-label="Notifikasi">
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute top-0.5 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">{unread}</span>}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex max-w-36 items-center gap-1.5 rounded-full bg-navy-soft px-3 py-1.5 text-sm">
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">{activeName || "Akun"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Profil aktif</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActiveChild(NIL)}>
                    {activeChildId === NIL ? "✓ " : ""}
                    {profile?.display_name ?? "Saya"} (orang tua)
                  </DropdownMenuItem>
                  {children.map((c) => (
                    <DropdownMenuItem key={c.id} onClick={() => setActiveChild(c.id)}>
                      {activeChildId === c.id ? "✓ " : ""}
                      {c.name} ({c.age_group})
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/profil" })}>
                    <Users /> Keluarga & Lencana
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/laporan-orang-tua" })}>
                    <Shield /> Laporan Orang Tua
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/", replace: true });
                    }}
                  >
                    <LogOut /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth">Masuk</Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="rounded-full p-2 hover:bg-navy-soft md:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-navy text-navy-foreground">
              <SheetTitle className="text-navy-foreground">Menu</SheetTitle>
              <nav className="mt-4 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 hover:bg-navy-soft">
                    {n.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-gold hover:bg-navy-soft">
                    Admin
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <BrandMark className="h-12 w-12 shrink-0" />
          <div>
            <p className="font-display text-lg font-bold">Sekolah Kisah Anak</p>
            <p className="text-sm text-gold">Berkisah • Beriman • Berakhlak Mulia</p>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-sm opacity-90">
          <Link to="/tentang">Tentang & Kontak</Link>
          <Link to="/privasi">Kebijakan Privasi</Link>
          <Link to="/syarat">Syarat Layanan</Link>
        </div>
        <p className="text-sm opacity-80">
          Komik Islami orisinal untuk anak & keluarga. Instagram{" "}
          <a href="https://instagram.com/sekolah_kisah_anak" target="_blank" rel="noreferrer" className="text-gold">
            @sekolah_kisah_anak
          </a>
        </p>
      </div>
      <p className="pb-6 text-center text-xs opacity-60">© {new Date().getFullYear()} Sekolah Kisah Anak</p>
    </footer>
  );
}

export function SeriesCard({ s }: { s: SeriesRow }) {
  return (
    <Link to="/seri/$slug" params={{ slug: s.slug }} className="group block min-w-0">
      <div className="relative transition-transform group-hover:-translate-y-1">
        <Cover series={s} className="shadow-card" />
        {s.is_premium && <span className="absolute top-2 right-2 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-gold">Premium</span>}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-bold">{s.title}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>Usia {s.age_group}</span>
        <StatusPill status={s.status} />
      </div>
    </Link>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-6xl px-4 py-8 ${className ?? ""}`}>{children}</main>;
}

export function NeedLogin({ text = "Silakan masuk untuk melanjutkan." }: { text?: string }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-card p-8 text-center shadow-card">
      <BrandMark className="mx-auto h-14 w-14" />
      <p className="mt-4 font-semibold">{text}</p>
      <Button variant="hero" className="mt-4" asChild>
        <Link to="/auth">Masuk / Daftar</Link>
      </Button>
    </div>
  );
}
