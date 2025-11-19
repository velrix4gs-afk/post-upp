import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallNotifications } from '@/hooks/useCallNotifications';
import { useNavigate } from 'react-router-dom';

export const IncomingCallOverlay = () => {
  const { incomingCall, ringing, acceptCall, declineCall } = useCallNotifications();
  const navigate = useNavigate();

  if (!ringing || !incomingCall) return null;

  const handleAccept = () => {
    const call = acceptCall();
    if (call) {
      navigate(`/messages/${call.call_id}`, {
        state: { callType: call.call_type, autoJoin: true }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-background rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
        <div className="space-y-4">
          <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary">
            <AvatarImage src={incomingCall.caller_avatar} />
            <AvatarFallback>{incomingCall.caller_name[0]}</AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="text-2xl font-bold">{incomingCall.caller_name}</h3>
            <p className="text-muted-foreground">
              Incoming {incomingCall.call_type} call...
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full h-16 w-16"
            onClick={declineCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          
          <Button
            size="lg"
            className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600"
            onClick={handleAccept}
          >
            {incomingCall.call_type === 'video' ? (
              <Video className="h-6 w-6" />
            ) : (
              <Phone className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Hidden audio element for ringtone */}
        <audio src="/ringtone.mp3" loop />
      </div>
    </div>
  );
};
