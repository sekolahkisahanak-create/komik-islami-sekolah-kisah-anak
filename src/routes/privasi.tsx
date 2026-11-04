import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/layout";

export const Route = createFileRoute("/privasi")({
  head: () => ({
    meta: [
      { title: "Kebijakan Privasi — Komik Islami Sekolah Kisah Anak" },
      { name: "description", content: "Kami hanya menyimpan data yang diperlukan untuk akun, progres membaca, dan profil keluarga. Data tidak dijual kepada pihak lain." },
      { property: "og:title", content: "Kebijakan Privasi — Komik Islami" },
      { property: "og:description", content: "Kami hanya menyimpan data yang diperlukan untuk akun, progres membaca, dan profil keluarga. Data tidak dijual kepada pihak lain." },
    ],
  }),
  component: () => (
    <Page>
      <h1 className="text-3xl font-extrabold">Kebijakan Privasi</h1>
      <p className="mt-4 max-w-2xl leading-relaxed">Kami hanya menyimpan data yang diperlukan untuk akun, progres membaca, dan profil keluarga. Data tidak dijual kepada pihak lain.</p>
    </Page>
  ),
});
