-- Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text NOT NULL,
    description text,
    requirements jsonb,
    payment_algo numeric,
    score_threshold numeric,
    wallet_address text NOT NULL,
    github_url text,
    evaluation_result jsonb,
    status text DEFAULT 'OPEN'::text
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for demo purposes)
CREATE POLICY "Allow public read access to projects"
ON public.projects FOR SELECT
USING (true);

-- Optional: If they have authenticated users in Supabase Auth, they can restrict inserts
-- For now, the Edge Function acts as a Service Role to bypass RLS for inserts/updates.
