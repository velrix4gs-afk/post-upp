import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEvents } from '@/hooks/useEvents';
import { Calendar, MapPin, Users, Plus, Camera } from 'lucide-react';
import { format } from 'date-fns';

const Events = () => {
  const { events, loading, createEvent, toggleAttendance } = useEvents();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleCreateEvent = async () => {
    if (!formData.title.trim() || !formData.start_date) return;
    
    await createEvent({
      ...formData,
      image: imageFile || undefined,
    });
    
    setCreateDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
    });
    setImageFile(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Events</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Event description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Event location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="image" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Add Event Image
                    </span>
                  </Button>
                </Label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {imageFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>
              
              <Button onClick={handleCreateEvent} className="w-full">
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card className="bg-gradient-card border-0 p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Events Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create an event in your community!
            </p>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="bg-gradient-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={event.creator.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-white text-sm">
                        {event.creator.display_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{event.creator.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{event.creator.username}
                      </p>
                    </div>
                  </div>
                  <Badge variant={event.is_attending ? "default" : "outline"}>
                    {event.is_attending ? "Attending" : "Not Attending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.image_url && (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {event.description}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      {format(new Date(event.start_date), 'PPP p')}
                      {event.end_date && (
                        <> - {format(new Date(event.end_date), 'PPP p')}</>
                      )}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{event.attendees_count} attendees</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => toggleAttendance(event.id)}
                  variant={event.is_attending ? "outline" : "default"}
                  className="w-full"
                >
                  {event.is_attending ? "Leave Event" : "Join Event"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;