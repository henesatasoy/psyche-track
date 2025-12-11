-- Drop the existing unrestricted INSERT policy
DROP POLICY IF EXISTS "Anyone can submit results" ON public.results;

-- Create a new policy that validates the experiment is active
CREATE POLICY "Submit results to active experiments" 
ON public.results 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.experiments 
    WHERE experiments.id = experiment_id 
    AND experiments.status = 'active'
  )
);