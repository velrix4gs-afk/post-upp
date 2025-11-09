import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MapPin, Users, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  image_url: string | null;
  created_by: string;
}

interface EventManagementProps {
  event: Event;
  isCreator: boolean;
  onUpdate: () => void;
}

const EventManagement = ({ event, isCreator, onUpdate }: EventManagementProps) => {
  const { user } = useAuth();
  const [rsvpStatus, setRsvpStatus] = useState<'going' | 'maybe' | 'not_going' | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || '',
    location: event.location || '',
    start_date: event.start_date,
    end_date: event.end_date || ''
  });

  const handleRSVP = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!user) return;

    try {
      if (status === 'going') {
        await supabase
          .from('event_attendees')
          .insert({
            event_id: event.id,
            user_id: user.id
          });
      } else {
        await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);
      }
      
      setRsvpStatus(status);
      toast({
        title: "RSVP Updated",
        description: `You're ${status === 'going' ? 'attending' : status === 'maybe' ? 'maybe attending' : 'not attending'} this event`
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = async () => {
    if (!isCreator) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date || null
        })
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully"
      });
      setEditDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!isCreator || !confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Event Management</span>
          {isCreator && (
            <div className="flex gap-2">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Edit</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleUpdate} className="w-full">Update Event</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.start_date).toLocaleDateString()}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}

          {/* RSVP Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant={rsvpStatus === 'going' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRSVP('going')}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Going
            </Button>
            <Button
              variant={rsvpStatus === 'maybe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRSVP('maybe')}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Maybe
            </Button>
            <Button
              variant={rsvpStatus === 'not_going' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRSVP('not_going')}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Can't Go
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventManagement;
