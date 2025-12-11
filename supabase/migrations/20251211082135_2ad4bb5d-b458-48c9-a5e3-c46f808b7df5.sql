-- Add policy allowing anyone to view active experiments (for participants in the Runner)
CREATE POLICY "Anyone can view active experiments" 
ON public.experiments 
FOR SELECT 
USING (status = 'active');