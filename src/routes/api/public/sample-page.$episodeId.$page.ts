import { createFileRoute } from "@tanstack/react-router";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function wrap(text: string, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      lines.push(cur.trim());
      cur = w;
    } else cur += " " + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

export const Route = createFileRoute("/api/public/sample-page/$episodeId/$page")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.episodeId.replace(/[^0-9a-f-]/gi, "");
        const page = Math.max(1, Math.min(9, Number(params.page) || 1));
        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        let title = "Episode";
        let synopsis = "";
        let seriesTitle = "Komik Islami";
        if (url && key) {
          const r = await fetch(`${url}/rest/v1/episodes?id=eq.${id}&select=title,synopsis,series:series_id(title)`, { headers: { apikey: key } });
          const rows = (await r.json().catch(() => [])) as Array<{ title: string; synopsis: string; series: { title: string } | null }>;
          if (Array.isArray(rows) && rows[0]) {
            title = rows[0].title;
            synopsis = rows[0].synopsis;
            seriesTitle = rows[0].series?.title ?? seriesTitle;
          }
        }
        const hues = ["#00254C", "#1B3F6E", "#2D5A8A"];
        const bg = hues[(page - 1) % 3];
        const lines = wrap(page === 1 ? synopsis : page === 2 ? "Panel cerita akan diganti dengan halaman komik asli yang diunggah admin." : "Terima kasih telah membaca. Lanjutkan ke kuis dan ibrah di bawah!", 34).slice(0, 6);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="800" height="1130">
<rect width="800" height="1130" fill="#FAF5EA"/>
<rect x="30" y="30" width="740" height="420" rx="24" fill="${bg}"/>
<circle cx="600" cy="200" r="120" fill="#D29229" opacity="0.35"/>
<path d="M120 450V250c0-90 70-150 150-150s150 60 150 150v200" fill="none" stroke="#D29229" stroke-width="10"/>
<rect x="30" y="480" width="360" height="300" rx="24" fill="#D29229" opacity="0.85"/>
<rect x="410" y="480" width="360" height="300" rx="24" fill="${bg}" opacity="0.8"/>
<rect x="30" y="810" width="740" height="290" rx="24" fill="#FFFFFF" stroke="#D29229" stroke-width="4"/>
<text x="60" y="90" font-family="Georgia, serif" font-size="26" fill="#D29229">${esc(seriesTitle)}</text>
<text x="60" y="140" font-family="Georgia, serif" font-size="40" font-weight="bold" fill="#FFFFFF">${esc(title)}</text>
<text x="60" y="420" font-family="sans-serif" font-size="22" fill="#FFFFFF" opacity="0.8">Halaman ${page}</text>
<text x="210" y="640" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="bold" fill="#00254C">Panel ${page}A</text>
<text x="590" y="640" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="bold" fill="#FFFFFF">Panel ${page}B</text>
${lines.map((l, i) => `<text x="70" y="${880 + i * 36}" font-family="sans-serif" font-size="26" fill="#00254C">${esc(l)}</text>`).join("")}
<rect x="540" y="1050" width="210" height="36" rx="18" fill="#D29229"/>
<text x="645" y="1075" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#00254C">HALAMAN CONTOH</text>
</svg>`;
        return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" } });
      },
    },
  },
});
