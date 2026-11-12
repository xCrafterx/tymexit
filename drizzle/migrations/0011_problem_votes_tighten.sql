DROP POLICY IF EXISTS "Anyone can read votes" ON public.problem_votes;
DROP POLICY IF EXISTS "Anyone can vote" ON public.problem_votes;
REVOKE SELECT ON public.problem_votes FROM anon, authenticated;
CREATE POLICY "Anyone can cast a valid vote" ON public.problem_votes FOR INSERT TO anon, authenticated
WITH CHECK (vote IN ('up','down') AND char_length(problem_key) BETWEEN 1 AND 100 AND char_length(voter_id) BETWEEN 8 AND 64);

CREATE OR REPLACE FUNCTION public.get_problem_vote_counts(_voter_id text)
RETURNS TABLE(problem_key text, up bigint, down bigint, mine text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.problem_key,
         count(*) FILTER (WHERE v.vote = 'up'),
         count(*) FILTER (WHERE v.vote = 'down'),
         max(v.vote) FILTER (WHERE v.voter_id = _voter_id)
  FROM public.problem_votes v GROUP BY v.problem_key
$$;
GRANT EXECUTE ON FUNCTION public.get_problem_vote_counts(text) TO anon, authenticated;