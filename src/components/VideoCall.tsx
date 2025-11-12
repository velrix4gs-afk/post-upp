import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VideoCallProps {
  chatId: string;
  isInitiator: boolean;
  onEndCall: () => void;
}

export const VideoCall = ({ chatId, isInitiator, onEndCall }: VideoCallProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle incoming remote stream
      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await sendSignal('ice-candidate', event.candidate);
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
      toast({
        title: 'Error',
        description: 'Failed to access camera/microphone',
        variant: 'destructive'
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track?.kind === 'video'
        );
        
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      } else {
        const videoTrack = localStream?.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track?.kind === 'video'
        );
        
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
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
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };

  const handleEndCall = () => {
    cleanup();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex-1 grid md:grid-cols-2 gap-4 p-4">
        {/* Remote Video */}
        <Card className="relative overflow-hidden bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p>Waiting for other participant...</p>
            </div>
          )}
        </Card>

        {/* Local Video */}
        <Card className="relative overflow-hidden bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </Card>
      </div>

      {/* Controls */}
      <div className="p-4 bg-card border-t">
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant={isVideoEnabled ? 'default' : 'destructive'}
            onClick={toggleVideo}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          
          <Button
            size="lg"
            variant={isAudioEnabled ? 'default' : 'destructive'}
            onClick={toggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          
          <Button
            size="lg"
            variant={isScreenSharing ? 'secondary' : 'outline'}
            onClick={toggleScreenShare}
          >
            <Monitor className="h-5 w-5" />
          </Button>
          
          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
