import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/layout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dasbor Admin — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Dasbor admin sedang disiapkan." },
      { property: "og:title", content: "Dasbor Admin — Komik Islami" },
      { property: "og:description", content: "Dasbor admin sedang disiapkan." },
    ],
  }),
  component: () => (
    <Page>
      <h1 className="text-3xl font-extrabold">Dasbor Admin</h1>
      <p className="mt-4 max-w-2xl leading-relaxed">Dasbor admin sedang disiapkan.</p>
    </Page>
  ),
});
