-- Create call_signals table for WebRTC signaling
CREATE TABLE IF NOT EXISTS public.call_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Policies for call_signals
CREATE POLICY "Users can insert their own signals"
ON public.call_signals FOR INSERT
TO public
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view signals for their calls"
ON public.call_signals FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id::text = call_signals.call_id
    AND (chats.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_id = chats.id
      AND chat_participants.user_id = auth.uid()
    ))
  )
);

-- Add index for better performance
CREATE INDEX idx_call_signals_call_id ON public.call_signals(call_id);
CREATE INDEX idx_call_signals_created_at ON public.call_signals(created_at DESC);

-- Enable realtime for call_signals
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;