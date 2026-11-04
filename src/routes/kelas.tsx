import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/layout";

export const Route = createFileRoute("/kelas")({
  head: () => ({
    meta: [
      { title: "Kelas Madrasah — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Fitur kelas sedang disiapkan." },
      { property: "og:title", content: "Kelas Madrasah — Komik Islami" },
      { property: "og:description", content: "Fitur kelas sedang disiapkan." },
    ],
  }),
  component: () => (
    <Page>
      <h1 className="text-3xl font-extrabold">Kelas Madrasah</h1>
      <p className="mt-4 max-w-2xl leading-relaxed">Fitur kelas sedang disiapkan.</p>
    </Page>
  ),
});
