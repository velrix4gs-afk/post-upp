import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LocationShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (lat: number, lon: number, address?: string) => void;
}

export const LocationShareDialog = ({ open, onOpenChange, onShare }: LocationShareDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number; address?: string } | null>(null);

  const getLocation = async () => {
    setLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });

      const { latitude, longitude } = position.coords;
      
      // Try to get address from reverse geocoding
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        if (data.display_name) address = data.display_name;
      } catch {}

      setLocation({ lat: latitude, lon: longitude, address });
    } catch (error: any) {
      toast({
        title: 'Location access denied',
        description: 'Please enable location permissions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !location) {
      getLocation();
    }
  }, [open]);

  const handleShare = () => {
    if (location) {
      onShare(location.lat, location.lon, location.address);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Share Location
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Getting your location...</p>
          </div>
        ) : location ? (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium mb-1">Your Location</p>
              <p className="text-muted-foreground">{location.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={!location || loading}>
            Share Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
