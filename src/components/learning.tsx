import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Lightbulb, MessagesSquare, BookMarked } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function LearningSection({ episodeId, ibrah, discussion, sources }: { episodeId: string; ibrah: string[]; discussion: string; sources: string }) {
  const { user, activeChildId } = useAuth();
  const { data: qs = [] } = useQuery({
    queryKey: ["quiz", episodeId],
    queryFn: async () => (await supabase.from("quiz_questions").select("id, question, options, correct_index").eq("episode_id", episodeId).order("position").limit(3)).data ?? [],
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);

  async function submit() {
    const s = qs.filter((q) => answers[q.id] === q.correct_index).length;
    setScore(s);
    if (user) {
      await supabase.from("quiz_results").insert({ user_id: user.id, child_id: activeChildId, episode_id: episodeId, score: s, total: qs.length });
      toast.success("Hasil kuis tersimpan");
    }
  }

  return (
    <section className="mt-10 space-y-8 px-2">
      <div className="rounded-3xl bg-card p-5 shadow-card">
        <h2 className="text-xl font-bold">Kuis Pemahaman</h2>
        <div className="mt-4 space-y-5">
          {qs.map((q, i) => (
            <div key={q.id}>
              <p className="font-semibold">{i + 1}. {q.question}</p>
              <div className="mt-2 grid gap-2">
                {q.options.map((o, oi) => {
                  const picked = answers[q.id] === oi;
                  const show = score !== null;
                  const cls = show ? (oi === q.correct_index ? "border-success bg-success/10" : picked ? "border-destructive bg-destructive/10" : "") : picked ? "border-navy bg-accent" : "";
                  return (
                    <button key={oi} disabled={show} onClick={() => setAnswers({ ...answers, [q.id]: oi })} className={`rounded-xl border p-2.5 text-left text-sm ${cls}`}>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {score === null ? (
          <Button variant="hero" className="mt-4" disabled={Object.keys(answers).length < qs.length} onClick={submit}>Kirim Jawaban</Button>
        ) : (
          <p className="mt-4 font-bold">Skor kamu: {score} / {qs.length} {score === qs.length ? "— Masya Allah, hebat!" : ""}</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold">Ibrah dari Kisah Ini</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {ibrah.slice(0, 3).map((t, i) => (
            <div key={i} className="rounded-2xl bg-navy p-4 text-navy-foreground shadow-card">
              <Lightbulb className="h-5 w-5 text-gold" />
              <p className="mt-2 text-sm">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border-2 border-gold bg-gold-soft p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold"><MessagesSquare className="h-5 w-5" /> Diskusi Orang Tua & Anak</h2>
        <p className="mt-2">{discussion}</p>
      </div>

      {sources && (
        <div className="rounded-2xl bg-accent p-4 text-sm">
          <p className="flex items-center gap-2 font-bold"><BookMarked className="h-4 w-4" /> Sumber Kisah</p>
          <p className="mt-1 whitespace-pre-line">{sources}</p>
        </div>
      )}
    </section>
  );
}
