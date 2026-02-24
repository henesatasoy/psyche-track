
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active experiments" ON public.experiments;
DROP POLICY IF EXISTS "Users can view own experiments" ON public.experiments;
DROP POLICY IF EXISTS "Users can create own experiments" ON public.experiments;
DROP POLICY IF EXISTS "Users can delete own experiments" ON public.experiments;
DROP POLICY IF EXISTS "Users can update own experiments" ON public.experiments;

-- Recreate as PERMISSIVE (default) policies
CREATE POLICY "Anyone can view active experiments"
ON public.experiments FOR SELECT
USING (status = 'active'::text);

CREATE POLICY "Users can view own experiments"
ON public.experiments FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own experiments"
ON public.experiments FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own experiments"
ON public.experiments FOR DELETE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can update own experiments"
ON public.experiments FOR UPDATE
USING (auth.uid() = owner_id);

-- Also fix results policies
DROP POLICY IF EXISTS "Only experiment owner can view results" ON public.results;
DROP POLICY IF EXISTS "Submit results to active experiments" ON public.results;

CREATE POLICY "Only experiment owner can view results"
ON public.results FOR SELECT
USING (EXISTS (
  SELECT 1 FROM experiments
  WHERE experiments.id = results.experiment_id
  AND experiments.owner_id = auth.uid()
));

CREATE POLICY "Submit results to active experiments"
ON public.results FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM experiments
  WHERE experiments.id = results.experiment_id
  AND experiments.status = 'active'::text
));
