# Komik Islami Sekolah Kisah Anak

Build a public Islamic comic reading web app in Bahasa Indonesia for 'Sekolah Kisah Anak', modeled on manhwa/manga reading sites but with 100% original Islamic comics for children and families. App name: 'Komik Islami — Sekolah Kisah Anak'.

BRANDING (from the official logo): deep navy #00254C, gold #D29229, white, warm cream background (#FAF5EA). Logo concept: a mihrab arch containing an open glowing book; tagline 'Berkisah • Beriman • Berakhlak Mulia'. Use a simple SVG arch+book brand mark in brand colors as a placeholder logo (the owner will replace it with the official logo file later). Rounded corners, soft gold glow accents on hero, navy header/footer with white text, gold primary buttons with navy text. Fully mobile responsive, no horizontal overflow on mobile.

CATALOG (seed this real catalog; covers as attractive generated/styled placeholder cover cards in brand colors with series title — owner will upload real cover art later via admin):
1) Siroh Nabawiyah V2 — genre Siroh, ages 8-12, status Ongoing — episodes: 'Tahun Gajah', 'Kelahiran Sang Nabi', 'Perjalanan ke Madinah', 'Perjalanan ke Syam', 'Al-Amin'.
2) Siroh Nabawiyah Seri Pertama — genre Siroh, ages 8-12, status Completed — 21 episodes numbered 'Episode 1' to 'Episode 21' (admin can rename them later).
3) Komik Para Ulama — genre Ulama & Sahabat, ages 8-12, status Completed — books as episodes: 'Imam Ahmad & Penjual Roti', "Imam Syafi'i: Segera Pulang Saat Ibu Memanggil", 'Imam Malik: Enam Belas Sengatan', 'Imam Abu Hanifah: Tetangga Tukang Sepatu'.
4) Abu Bakar Ash-Shiddiq: Memberi Semua Hartanya — genre Ulama & Sahabat, ages 8-12, status Ongoing — 1 episode 'Memberi Semua Hartanya'.
5) Nafs Leveling: The Gate of Fitnah — genre Remaja 13+, ages 13+, status Ongoing, clearly separated from children's comics — episodes: 'Chapter 0: Prolog', 'Chapter 1: Riyadhah Pertama', 'Chapter 2: Yang Tertinggal di Dalam'.
Each series: synopsis (write a short warm synopsis in Indonesian), genre, age group, status, and a 'Sumber Kisah' (sources) text field shown on the series detail page. Each episode: number, title, synopsis, free/premium flag, draft/published status, release date, and an ordered list of page image URLs (seed each episode with 2-3 styled sample pages made of colored panels + episode title/synopsis text, clearly labeled 'Halaman Contoh' — the owner uploads the real comic pages via admin).

CORE FEATURES:
- Home: hero, featured series, latest updates, full catalog with search and filters (genre, age group 5-7/8-12/13+, status Completed/Ongoing), all filtering server-side where practical.
- Auth: real email registration & login using the app database/auth. User roles: reader and admin (first registered user or a seeded admin flag editable in DB). Registration required to read beyond free previews.
- Series detail page: cover, synopsis, Sumber Kisah, episode list, favorite button, star rating (saved per user, average displayed), 'Seri Serupa' similar series section, WhatsApp share button.
- Free preview: episode 1 of every series readable without login; other episodes require login.
- Reader: vertical scroll reading, sticky progress bar, sticky previous/next episode navigation, reading position/progress saved per user ('Lanjutkan Membaca' on home/library), mark-as-finished, subtle semi-transparent watermark with the active account/child profile name overlaid on reader pages.
- Library ('Perpustakaanku'): bookmarked series, reading progress (in progress/finished), favorites.
- End-of-episode learning section (after finishing an episode): a 3-question comprehension quiz based on the episode synopsis (quiz data stored in DB, admin-editable, results saved per user), exactly 3 'ibrah' lesson cards derived from the episode synopsis, 1 parent-child discussion question. Do NOT invent Qur'an/hadith quotations; dalil/source content only from the series' Sumber Kisah field.
- Family profiles: a parent account can create child profiles (name + age group); progress, library, favorites and quiz results are recorded per active child profile; a 4-digit parent PIN protects the Parent Report page showing a weekly per-child summary (episodes read/finished, quizzes done).
- Badges & challenge: automatic badges (first episode finished, completing a whole series) and a 'Tantangan Baca 7 Hari' 7-day reading challenge whose reading days are recorded from reading activity.
- In-app notifications: when admin publishes a new episode of a series a user has favorited, that user gets an in-app notification; include a notification center and preference toggle. (No WhatsApp/email notifications — note in UI they come later.)
- Premium & subscriptions: admin can mark series/episodes Premium; premium episodes are locked server-side for non-subscribers/non-buyers. Subscription page: admin-managed plans (name, duration days, price in IDR), user creates an order with status 'Menunggu Persetujuan'; admin approves/rejects orders in the admin dashboard; approval activates the subscription with an expiry date (or a permanent per-series purchase). State honestly in the UI that automatic QRIS/e-wallet payment will be connected later — do not fake a payment gateway.
- School/madrasah classes: a user can create a Class (system generates a join code); students join with the code; the teacher creates reading assignments (a series episode, optionally including its quiz) and sees a per-student completion report.
- Admin dashboard (admin role only): manage series & episodes (create/edit, draft vs published, free/premium flag, scheduled release date, page image URLs, synopsis, Sumber Kisah, genre, age group, status), manage subscription plans & per-series prices, approve/reject orders, and view simple statistics (reads, bookmarks, finishes per series/episode).
- Trust pages: Tentang & Kontak (mention Instagram @sekolah_kisah_anak), Kebijakan Privasi, Syarat Layanan.

Keep the build in Bahasa Indonesia UI. Prioritize a working end-to-end core: catalog, auth, reader with progress, library, admin, premium locking with manual order approval, classes, family profiles, quiz/ibrah, badges, notifications.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://komik-islami-sekolah-kisah-anak.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/418ebac6-1e2b-447a-b7a3-57efbdd7e482).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
