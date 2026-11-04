import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/layout";

export const Route = createFileRoute("/syarat")({
  head: () => ({
    meta: [
      { title: "Syarat Layanan — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Seluruh komik adalah karya orisinal Sekolah Kisah Anak dan dilindungi hak cipta. Dilarang menyebarluaskan halaman komik tanpa izin." },
      { property: "og:title", content: "Syarat Layanan — Komik Islami" },
      { property: "og:description", content: "Seluruh komik adalah karya orisinal Sekolah Kisah Anak dan dilindungi hak cipta. Dilarang menyebarluaskan halaman komik tanpa izin." },
    ],
  }),
  component: () => (
    <Page>
      <h1 className="text-3xl font-extrabold">Syarat Layanan</h1>
      <p className="mt-4 max-w-2xl leading-relaxed">Seluruh komik adalah karya orisinal Sekolah Kisah Anak dan dilindungi hak cipta. Dilarang menyebarluaskan halaman komik tanpa izin.</p>
    </Page>
  ),
});
