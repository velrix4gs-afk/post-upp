import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VoiceCallProps {
  chatId: string;
  isInitiator: boolean;
  onEndCall: () => void;
  participantName?: string;
  participantAvatar?: string;
}

export const VoiceCall = ({ 
  chatId, 
  isInitiator, 
  onEndCall,
  participantName = 'User',
  participantAvatar 
}: VoiceCallProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected]);

  const initializeCall = async () => {
    try {
      // Request notification and microphone permissions
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setLocalStream(stream);

      // Use STUN/TURN servers for better connectivity
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
        }
        setIsConnected(true);
        
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Call Connected', {
            body: `Voice call with ${participantName}`,
            icon: participantAvatar
          });
        }
      };

      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await sendSignal('ice-candidate', event.candidate);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true);
        } else if (peerConnection.connectionState === 'disconnected' || 
            peerConnection.connectionState === 'failed') {
          toast({
            title: 'Connection Lost',
            description: 'The call was disconnected',
            variant: 'destructive'
          });
        }
      };

      // Subscribe to call signals
      const channel = supabase
        .channel(`call:${chatId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `call_id=eq.${chatId}`
        }, async (payload) => {
          const signal = payload.new;
          if (signal.sender_id !== user?.id) {
            await handleIncomingSignal(signal);
          }
        })
        .subscribe();
      
      channelRef.current = channel;

      if (isInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await sendSignal('offer', offer);
      }

    } catch (error) {
      console.error('Error initializing call:', error);
      let errorMessage = 'Failed to access microphone';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is being used by another application';
        }
      }
      
      toast({
        title: 'Call Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      // Auto-close on error
      setTimeout(() => handleEndCall(), 2000);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleSpeaker = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsSpeakerEnabled(!audioRef.current.muted);
    }
  };

  const sendSignal = async (type: string, data: any) => {
    try {
      await supabase
        .from('call_signals')
        .insert({
          call_id: chatId,
          sender_id: user?.id,
          signal_type: type,
          signal_data: data
        });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  };

  const handleIncomingSignal = async (signal: any) => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) return;

    try {
      if (signal.signal_type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await sendSignal('answer', answer);
      } else if (signal.signal_type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
      } else if (signal.signal_type === 'ice-candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.signal_data));
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  };

  const cleanup = () => {
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };

  const handleEndCall = () => {
    cleanup();
    onEndCall();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4">
      <audio ref={audioRef} autoPlay />
      
      <Card className="w-full max-w-md p-8 space-y-8 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center space-y-4">
          <Avatar className="h-32 w-32 mx-auto ring-4 ring-primary/20">
            <AvatarImage src={participantAvatar} />
            <AvatarFallback className="text-4xl bg-primary/10">
              {participantName[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="text-2xl font-semibold">{participantName}</h2>
            <p className="text-muted-foreground mt-1">
              {isConnected ? formatDuration(callDuration) : 'Calling...'}
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-8 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center gap-6">
          <Button
            size="lg"
            variant={isAudioEnabled ? 'default' : 'destructive'}
            onClick={toggleAudio}
            className="h-16 w-16 rounded-full"
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant={isSpeakerEnabled ? 'default' : 'secondary'}
            onClick={toggleSpeaker}
            className="h-16 w-16 rounded-full"
          >
            {isSpeakerEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndCall}
            className="h-16 w-16 rounded-full"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
