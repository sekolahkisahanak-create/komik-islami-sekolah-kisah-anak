CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL UNIQUE REFERENCES public.episodes(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Kuis Seru',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quizzes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes readable" ON public.quizzes FOR SELECT TO anon, authenticated USING (public.can_read_episode(episode_id));
CREATE POLICY "admin quizzes" ON public.quizzes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.quiz_questions ADD COLUMN quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_questions ADD COLUMN explanation text NOT NULL DEFAULT '';
ALTER TABLE public.quiz_questions ADD COLUMN time_limit_sec integer NOT NULL DEFAULT 20;
INSERT INTO public.quizzes(episode_id) SELECT DISTINCT episode_id FROM public.quiz_questions ON CONFLICT DO NOTHING;
UPDATE public.quiz_questions q SET quiz_id = z.id FROM public.quizzes z WHERE z.episode_id = q.episode_id;

ALTER TABLE public.quiz_results ADD COLUMN mode text NOT NULL DEFAULT 'santai';
ALTER TABLE public.quiz_results ADD COLUMN correct integer;
ALTER TABLE public.quiz_results ADD COLUMN stars integer;
ALTER TABLE public.child_profiles ADD COLUMN lembaga text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN lembaga text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(_episode_id uuid, _child_id uuid, _mode text, _score int, _correct int, _total int, _stars int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF _child_id <> '00000000-0000-0000-0000-000000000000'::uuid AND NOT EXISTS (SELECT 1 FROM child_profiles WHERE id = _child_id AND parent_id = auth.uid()) THEN
    RAISE EXCEPTION 'invalid profile';
  END IF;
  IF _total < 1 OR _correct < 0 OR _correct > _total THEN RAISE EXCEPTION 'invalid result'; END IF;
  INSERT INTO quiz_results(user_id, child_id, episode_id, score, total, mode, correct, stars)
  VALUES (auth.uid(), _child_id, _episode_id, GREATEST(0, LEAST(_score, _total * 200)), _total,
    CASE WHEN _mode = 'tantangan' THEN 'tantangan' ELSE 'santai' END, _correct, GREATEST(1, LEAST(_stars, 3)));
  SELECT title INTO _title FROM episodes WHERE id = _episode_id;
  INSERT INTO badges(user_id, child_id, code, label)
  VALUES (auth.uid(), _child_id, 'quiz_' || _episode_id::text, 'Juara Kuis: ' || coalesce(_title, 'Episode'))
  ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.quiz_leaderboard(_scope text, _child_id uuid)
RETURNS TABLE(player_name text, total_points bigint, quizzes bigint, is_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH best AS (
    SELECT user_id, child_id, episode_id, max(score) AS s FROM quiz_results GROUP BY 1,2,3
  ), players AS (
    SELECT b.user_id, b.child_id, sum(b.s)::bigint AS pts, count(*)::bigint AS n,
      CASE WHEN b.child_id = '00000000-0000-0000-0000-000000000000'::uuid THEN coalesce(p.lembaga, '') ELSE coalesce(c.lembaga, '') END AS lembaga,
      CASE WHEN b.child_id = '00000000-0000-0000-0000-000000000000'::uuid THEN split_part(coalesce(p.display_name, 'Pembaca'), '@', 1) ELSE coalesce(c.name, 'Pembaca') END AS nm
    FROM best b
    LEFT JOIN profiles p ON p.id = b.user_id
    LEFT JOIN child_profiles c ON c.id = b.child_id
    GROUP BY b.user_id, b.child_id, p.lembaga, c.lembaga, p.display_name, c.name
  ), me AS (
    SELECT lower(trim(CASE WHEN _child_id = '00000000-0000-0000-0000-000000000000'::uuid
      THEN (SELECT lembaga FROM profiles WHERE id = auth.uid())
      ELSE (SELECT lembaga FROM child_profiles WHERE id = _child_id AND parent_id = auth.uid()) END)) AS l
  )
  SELECT nm, pts, n, (user_id = auth.uid() AND child_id = _child_id)
  FROM players, me
  WHERE _scope <> 'sekolah' OR (coalesce(me.l, '') <> '' AND lower(trim(players.lembaga)) = me.l)
  ORDER BY pts DESC, n DESC
  LIMIT 100
$$;

CREATE OR REPLACE FUNCTION public.parent_quiz_report(_pin text)
RETURNS TABLE(child_id uuid, name text, episode_title text, best_score int, attempts bigint, last_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.verify_parent_pin(_pin) THEN RAISE EXCEPTION 'PIN salah'; END IF;
  RETURN QUERY
  SELECT q.child_id,
    CASE WHEN q.child_id = '00000000-0000-0000-0000-000000000000'::uuid THEN 'Orang tua' ELSE coalesce(c.name, 'Anak') END,
    e.title, max(q.score)::int, count(*)::bigint, max(q.created_at)
  FROM quiz_results q JOIN episodes e ON e.id = q.episode_id
  LEFT JOIN child_profiles c ON c.id = q.child_id
  WHERE q.user_id = auth.uid()
  GROUP BY q.child_id, c.name, e.title
  ORDER BY max(q.created_at) DESC;
END $$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, uuid, text, int, int, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quiz_leaderboard(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.parent_quiz_report(text) TO authenticated;