CREATE TABLE public.problem_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_key text NOT NULL CHECK (char_length(problem_key) <= 200),
  vote text NOT NULL CHECK (vote IN ('up','down')),
  voter_id text NOT NULL CHECK (char_length(voter_id) BETWEEN 8 AND 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (problem_key, voter_id)
);
GRANT SELECT, INSERT ON public.problem_votes TO anon, authenticated;
GRANT ALL ON public.problem_votes TO service_role;
ALTER TABLE public.problem_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON public.problem_votes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can vote" ON public.problem_votes FOR INSERT TO anon, authenticated WITH CHECK (true);