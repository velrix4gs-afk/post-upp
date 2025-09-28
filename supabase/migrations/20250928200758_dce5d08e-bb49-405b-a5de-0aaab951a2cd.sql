-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_attendees table
CREATE TABLE public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Users can view all events" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own events" 
ON public.events 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own events" 
ON public.events 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own events" 
ON public.events 
FOR DELETE 
USING (created_by = auth.uid());

-- Enable RLS on event_attendees table
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_attendees
CREATE POLICY "Users can view event attendees" 
ON public.event_attendees 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join events" 
ON public.event_attendees 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave events they joined" 
ON public.event_attendees 
FOR DELETE 
USING (user_id = auth.uid());

-- Add trigger for updated_at on events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();