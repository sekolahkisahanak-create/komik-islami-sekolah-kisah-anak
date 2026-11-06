import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Lightbulb, MessagesSquare, BookMarked, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QuizGame, type QuizQ } from "@/components/quiz-game";

export function LearningSection({ episodeId, episodeTitle, nextEpisodeId, ibrah, discussion, sources }: { episodeId: string; episodeTitle: string; nextEpisodeId?: string | undefined; ibrah: string[]; discussion: string; sources: string }) {
  const [playing, setPlaying] = useState(false);
  const { data: qs = [] } = useQuery({
    queryKey: ["quiz", episodeId],
    queryFn: async () =>
      ((await supabase.from("quiz_questions").select("id, question, options, correct_index, explanation, time_limit_sec").eq("episode_id", episodeId).order("position")).data ?? []) as QuizQ[],
  });

  return (
    <section className="mt-10 space-y-8 px-2">
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

      {qs.length > 0 && (
        <div className="text-center">
          <Button variant="hero" size="lg" className="h-16 rounded-full px-10 text-xl font-extrabold shadow-glow" onClick={() => setPlaying(true)}>
            <Gamepad2 className="size-7" /> Main Kuis Seru!
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">{qs.length} soal · kumpulkan poin & lencana</p>
        </div>
      )}
      {playing && <QuizGame episodeId={episodeId} episodeTitle={episodeTitle} questions={qs} nextEpisodeId={nextEpisodeId} onClose={() => setPlaying(false)} />}

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
