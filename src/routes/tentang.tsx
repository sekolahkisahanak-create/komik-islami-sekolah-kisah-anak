import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/layout";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang & Kontak — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Sekolah Kisah Anak menghadirkan komik Islami orisinal untuk anak dan keluarga. Hubungi kami di Instagram @sekolah_kisah_anak." },
      { property: "og:title", content: "Tentang & Kontak — Komik Islami" },
      { property: "og:description", content: "Sekolah Kisah Anak menghadirkan komik Islami orisinal untuk anak dan keluarga. Hubungi kami di Instagram @sekolah_kisah_anak." },
    ],
  }),
  component: () => (
    <Page>
      <h1 className="text-3xl font-extrabold">Tentang & Kontak</h1>
      <p className="mt-4 max-w-2xl leading-relaxed">Sekolah Kisah Anak menghadirkan komik Islami orisinal untuk anak dan keluarga. Hubungi kami di Instagram @sekolah_kisah_anak.</p>
    </Page>
  ),
});
