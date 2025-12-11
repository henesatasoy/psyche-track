-- Create experiments table
CREATE TABLE public.experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create results table
CREATE TABLE public.results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiments: Researchers can only see/manage their own experiments
CREATE POLICY "Users can view own experiments" 
ON public.experiments 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own experiments" 
ON public.experiments 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own experiments" 
ON public.experiments 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own experiments" 
ON public.experiments 
FOR DELETE 
USING (auth.uid() = owner_id);

-- RLS Policies for results: Anyone can INSERT (participants), only owner can SELECT
CREATE POLICY "Anyone can submit results" 
ON public.results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only experiment owner can view results" 
ON public.results 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.experiments 
    WHERE experiments.id = results.experiment_id 
    AND experiments.owner_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_experiments_updated_at
BEFORE UPDATE ON public.experiments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for stimuli images
INSERT INTO storage.buckets (id, name, public) VALUES ('stimuli', 'stimuli', true);

-- Storage policies for stimuli bucket
CREATE POLICY "Anyone can view stimuli" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'stimuli');

CREATE POLICY "Authenticated users can upload stimuli" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'stimuli' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own stimuli" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'stimuli' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own stimuli" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'stimuli' AND auth.uid()::text = (storage.foldername(name))[1]);