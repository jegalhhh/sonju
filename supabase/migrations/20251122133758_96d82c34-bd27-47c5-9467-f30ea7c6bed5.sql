-- Create food logs table
CREATE TABLE public.food_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  calories TEXT,
  risk_level TEXT,
  risk_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for now, until we add auth)
CREATE POLICY "Anyone can insert food logs" 
ON public.food_logs 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow anyone to view food logs (for now, until we add auth)
CREATE POLICY "Anyone can view food logs" 
ON public.food_logs 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to delete food logs (for now, until we add auth)
CREATE POLICY "Anyone can delete food logs" 
ON public.food_logs 
FOR DELETE 
USING (true);