CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  attached_file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shared_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage their own chat sessions" ON public.chat_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage their own chat messages" ON public.chat_messages
  FOR ALL TO authenticated USING (session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid())) WITH CHECK (session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can read shared queries" ON public.shared_queries;
CREATE POLICY "Anyone can read shared queries" ON public.shared_queries
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anon can read shared queries" ON public.shared_queries;
CREATE POLICY "Anon can read shared queries" ON public.shared_queries
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Users can create shared queries" ON public.shared_queries;
CREATE POLICY "Users can create shared queries" ON public.shared_queries
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
