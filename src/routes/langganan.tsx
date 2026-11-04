import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/layout";

export const Route = createFileRoute("/langganan")({
  head: () => ({
    meta: [
      { title: "Langganan Premium — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Paket langganan dikelola admin. Pembayaran otomatis QRIS/e-wallet akan dihubungkan kemudian." },
      { property: "og:title", content: "Langganan Premium — Komik Islami" },
      { property: "og:description", content: "Paket langganan dikelola admin. Pembayaran otomatis QRIS/e-wallet akan dihubungkan kemudian." },
    ],
  }),
  component: () => (
    <Page>
      <h1 className="text-3xl font-extrabold">Langganan Premium</h1>
      <p className="mt-4 max-w-2xl leading-relaxed">Paket langganan dikelola admin. Pembayaran otomatis QRIS/e-wallet akan dihubungkan kemudian.</p>
    </Page>
  ),
});
