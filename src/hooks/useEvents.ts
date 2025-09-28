import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  attendees_count: number;
  is_attending?: boolean;
  creator: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

export const useEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          location,
          image_url,
          created_by,
          created_at,
          updated_at,
          profiles!events_created_by_fkey (
            display_name,
            username,
            avatar_url
          )
        `)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Get attendance for each event
      const eventsWithAttending = await Promise.all(
        (data || []).map(async (event) => {
          const { data: attendees, error: attendeesError } = await supabase
            .from('event_attendees')
            .select('user_id')
            .eq('event_id', event.id);

          if (attendeesError) {
            console.error('Error fetching attendees:', attendeesError);
            return {
              ...event,
              creator: event.profiles,
              attendees_count: 0,
              is_attending: false
            };
          }

          return {
            ...event,
            creator: event.profiles,
            attendees_count: attendees?.length || 0,
            is_attending: attendees?.some((a: any) => a.user_id === user?.id) || false
          };
        })
      );

      setEvents(eventsWithAttending);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: {
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    location?: string;
    image?: File;
  }) => {
    if (!user) return;

    try {
      let image_url = null;

      if (eventData.image) {
        const fileExt = eventData.image.name.split('.').pop();
        const fileName = `events/${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, eventData.image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        image_url = publicUrl;
      }

      const { error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          location: eventData.location,
          image_url,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event created successfully!',
      });
      
      await fetchEvents();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive'
      });
    }
  };

  const toggleAttendance = async (eventId: string) => {
    if (!user) return;

    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      if (event.is_attending) {
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_attendees')
          .insert({
            event_id: eventId,
            user_id: user.id
          });

        if (error) throw error;
      }

      await fetchEvents();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update attendance',
        variant: 'destructive'
      });
    }
  };

  return {
    events,
    loading,
    createEvent,
    toggleAttendance,
    refetch: fetchEvents
  };
};