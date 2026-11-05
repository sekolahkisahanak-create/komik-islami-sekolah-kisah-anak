import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Award, Flame, Star, Volume2, VolumeX, X, Sparkles, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { fiftyFifty, pointsFor, starsFor, type QuizMode } from "@/lib/quiz-scoring";
import { getMuted, QuizSound, saveMuted } from "@/lib/quiz-sound";

export type QuizQ = { id: string; question: string; options: string[]; correct_index: number; explanation: string; time_limit_sec: number };

const OPTION_STYLES = ["bg-quiz-1", "bg-quiz-2", "bg-quiz-3", "bg-quiz-4"];
const ENCOURAGE = ["Tidak apa-apa, ayo coba lagi di soal berikutnya!", "Hampir! Kamu pasti bisa!", "Semangat! Belajar itu hebat!"];
const CHEER = ["Masya Allah, benar!", "Hebat sekali!", "Barakallah, tepat!"];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function QuizGame({ episodeId, episodeTitle, questions, nextEpisodeId, onClose }: { episodeId: string; episodeTitle: string; questions: QuizQ[]; nextEpisodeId?: string | undefined; onClose: () => void }) {
  const { user, activeChildId } = useAuth();
  const qc = useQueryClient();
  const sound = useRef<QuizSound | null>(null);
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<"intro" | "play" | "end">("intro");
  const [mode, setMode] = useState<QuizMode>("santai");
  const [round, setRound] = useState(0);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [hidden, setHidden] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | "timeout" | null>(null);
  const [gained, setGained] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [saved, setSaved] = useState<"idle" | "ok" | "guest">("idle");

  useEffect(() => setMuted(getMuted()), []);
  useEffect(() => () => sound.current?.dispose(), []);

  // Shuffle options each game so the correct answer moves around
  const qs = useMemo(
    () =>
      questions.map((q) => {
        const order = shuffle(q.options.map((_, k) => k));
        return { ...q, options: order.map((k) => q.options[k]), correct_index: order.indexOf(q.correct_index) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, round],
  );
  const q = qs[i];
  const limit = q?.time_limit_sec || 20;

  useEffect(() => {
    if (phase !== "play" || mode !== "tantangan" || picked !== null) return;
    const started = Date.now();
    const startLeft = limit;
    setTimeLeft(startLeft);
    const t = window.setInterval(() => {
      const left = Math.max(0, startLeft - (Date.now() - started) / 1000);
      setTimeLeft(left);
      if (left <= 0) {
        window.clearInterval(t);
        answer("timeout");
      }
    }, 100);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, i, round, picked === null]);

  function toggleMute() {
    const m = !muted;
    setMuted(m);
    saveMuted(m);
    sound.current?.setMuted(m);
  }

  function begin(m: QuizMode) {
    if (!sound.current) sound.current = new QuizSound();
    sound.current.start(muted);
    setMode(m);
    setI(0); setScore(0); setCorrectCount(0); setStreak(0); setLifelineUsed(false); setHidden([]); setPicked(null); setSaved("idle");
    setPhase("play");
  }

  function answer(k: number | "timeout") {
    if (picked !== null || !q) return;
    setPicked(k);
    const ok = k === q.correct_index;
    const ns = ok ? streak + 1 : 0;
    const pts = pointsFor({ correct: ok, mode, secondsLeft: timeLeft, limit, streak: ns });
    setStreak(ns);
    setGained(pts);
    if (ok) {
      setScore((s) => s + pts);
      setCorrectCount((c) => c + 1);
      sound.current?.correct();
      if (ns >= 2) sound.current?.streak();
    } else sound.current?.wrong();
  }

  async function next() {
    if (i + 1 < qs.length) {
      setI(i + 1); setPicked(null); setHidden([]);
      return;
    }
    setPhase("end");
    sound.current?.stopMusic();
    sound.current?.fanfare();
    if (!user) { setSaved("guest"); return; }
    const { error } = await supabase.rpc("submit_quiz_attempt", {
      _episode_id: episodeId, _child_id: activeChildId, _mode: mode, _score: score, _correct: correctCount, _total: qs.length, _stars: starsFor(correctCount, qs.length),
    });
    if (!error) {
      setSaved("ok");
      qc.invalidateQueries({ queryKey: ["achievements"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    }
  }

  function applyFifty() {
    if (lifelineUsed || picked !== null || !q) return;
    setLifelineUsed(true);
    setHidden(fiftyFifty(q.options.length, q.correct_index));
  }

  const stars = starsFor(correctCount, qs.length);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-navy text-navy-foreground" role="dialog" aria-label="Kuis Seru">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <p className="truncate font-display font-bold text-gold">Kuis Seru · {episodeTitle}</p>
        <div className="flex items-center gap-2">
          <Button variant="onNavy" size="lg" onClick={toggleMute} aria-label={muted ? "Nyalakan suara" : "Matikan suara"}>
            {muted ? <VolumeX /> : <Volume2 />} {muted ? "Suara mati" : "Suara nyala"}
          </Button>
          <Button variant="onNavy" size="icon" onClick={onClose} aria-label="Tutup kuis"><X /></Button>
        </div>
      </div>

      {phase === "intro" && (
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <Sparkles className="h-14 w-14 text-gold" />
          <h2 className="text-4xl font-extrabold">Siap Main?</h2>
          <p className="opacity-90">{qs.length} soal seru tentang kisah ini. Pilih mode permainanmu!</p>
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <button onClick={() => begin("santai")} className="rounded-3xl bg-quiz-4 p-6 text-left text-quiz-ink shadow-card transition-transform hover:scale-105">
              <p className="text-2xl font-extrabold">Santai</p>
              <p className="mt-1 text-sm">Tanpa waktu. Poin untuk setiap jawaban benar.</p>
              <p className="mt-3 font-bold">Mulai ▶</p>
            </button>
            <button onClick={() => begin("tantangan")} className="rounded-3xl bg-quiz-1 p-6 text-left text-quiz-ink shadow-card transition-transform hover:scale-105">
              <p className="text-2xl font-extrabold">Tantangan</p>
              <p className="mt-1 text-sm">Ada hitungan waktu. Makin cepat, makin banyak bonus!</p>
              <p className="mt-3 font-bold">Mulai ▶</p>
            </button>
          </div>
          {!user && <p className="text-sm opacity-80">Masuk agar skormu tersimpan di Papan Skor.</p>}
        </div>
      )}

      {phase === "play" && q && (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>Soal {i + 1} / {qs.length}</span>
            <span className={`flex items-center gap-1 ${streak >= 2 ? "text-gold" : "opacity-60"}`}><Flame className={streak >= 2 ? "animate-quiz-pop" : ""} key={streak} /> {streak}x beruntun</span>
            <span className="text-gold">{score} poin</span>
          </div>
          {mode === "tantangan" && (
            <div className="h-3 overflow-hidden rounded-full bg-navy-soft" role="progressbar" aria-label="Sisa waktu" aria-valuenow={Math.ceil(timeLeft)} aria-valuemax={limit}>
              <div className={`h-full rounded-full transition-[width] duration-100 ${timeLeft / limit < 0.3 ? "bg-quiz-1" : "bg-gold"}`} style={{ width: `${(timeLeft / limit) * 100}%` }} />
            </div>
          )}
          <h2 className="py-4 text-center text-2xl font-extrabold sm:text-3xl">{q.question}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {q.options.map((o, k) => {
              const gone = hidden.includes(k);
              const reveal = picked !== null;
              const isRight = k === q.correct_index;
              const dim = reveal && !isRight && picked !== k;
              return (
                <button
                  key={k}
                  disabled={gone || reveal}
                  onClick={() => answer(k)}
                  className={`min-h-20 rounded-3xl p-4 text-lg font-bold text-quiz-ink shadow-card transition-all ${OPTION_STYLES[k % 4]} ${gone ? "invisible" : ""} ${dim ? "opacity-30" : ""} ${reveal && isRight ? "ring-4 ring-gold" : ""} ${!reveal ? "hover:scale-[1.03] active:scale-95" : ""}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked === null && (
            <Button variant="onNavy" className="self-center" disabled={lifelineUsed} onClick={applyFifty}>
              50:50 {lifelineUsed ? "(sudah dipakai)" : "— hapus 2 jawaban salah"}
            </Button>
          )}
          {picked !== null && (
            <div className={`relative overflow-hidden rounded-3xl p-5 text-center animate-quiz-pop ${picked === q.correct_index ? "bg-success/20" : "bg-gold-soft text-navy"}`}>
              {picked === q.correct_index ? (
                <>
                  {Array.from({ length: 14 }).map((_, c) => (
                    <span key={c} className={`pointer-events-none absolute top-0 h-3 w-2 rounded-sm animate-quiz-confetti ${OPTION_STYLES[c % 4]}`} style={{ left: `${(c * 7 + 3) % 100}%`, animationDelay: `${(c % 5) * 0.08}s` }} />
                  ))}
                  <p className="text-2xl font-extrabold">{CHEER[i % CHEER.length]} +{gained}</p>
                  {streak >= 2 && <p className="mt-1 font-bold text-gold">🔥 {streak} benar beruntun! Bonus poin!</p>}
                </>
              ) : (
                <>
                  <p className="flex items-center justify-center gap-2 text-xl font-extrabold"><Heart className="h-5 w-5" /> {picked === "timeout" ? "Waktu habis! " : ""}{ENCOURAGE[i % ENCOURAGE.length]}</p>
                  <p className="mt-1 text-sm">Jawaban benar: <b>{q.options[q.correct_index]}</b></p>
                </>
              )}
              {q.explanation && <p className="mt-2">💡 {q.explanation}</p>}
              <Button variant="hero" size="lg" className="mt-4" onClick={next}>{i + 1 < qs.length ? "Soal Berikutnya" : "Lihat Hasil"}</Button>
            </div>
          )}
        </div>
      )}

      {phase === "end" && (
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 p-6 text-center animate-quiz-pop">
          <h2 className="text-4xl font-extrabold">Selesai!</h2>
          <div className="flex gap-2" aria-label={`${stars} dari 3 bintang`}>
            {[1, 2, 3].map((s) => <Star key={s} className={`h-14 w-14 ${s <= stars ? "fill-gold text-gold" : "opacity-30"}`} />)}
          </div>
          <p className="text-5xl font-extrabold text-gold">{score} <span className="text-2xl">poin</span></p>
          <p>{correctCount} dari {qs.length} jawaban benar · Mode {mode === "santai" ? "Santai" : "Tantangan"}</p>
          <div className="flex items-center gap-2 rounded-2xl bg-gold-soft px-4 py-3 font-bold text-navy">
            <Award className="h-6 w-6 text-gold" /> Lencana: Juara Kuis {episodeTitle}
          </div>
          {saved === "ok" && <p className="text-sm opacity-80">Skor tersimpan. Skor terbaikmu dihitung di <Link to="/papan-skor" className="underline">Papan Skor</Link>.</p>}
          {saved === "guest" && <p className="text-sm opacity-80"><Link to="/auth" className="underline">Masuk</Link> agar skor dan lencana tersimpan.</p>}
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="onNavy" size="lg" onClick={() => { setRound((r) => r + 1); setPhase("intro"); }}>Main Lagi</Button>
            {nextEpisodeId ? (
              <Button variant="hero" size="lg" asChild><Link to="/baca/$episodeId" params={{ episodeId: nextEpisodeId }} onClick={onClose}>Lanjut Episode Berikutnya</Link></Button>
            ) : (
              <Button variant="hero" size="lg" onClick={onClose}>Selesai</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
