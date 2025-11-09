import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface CallState {
  isInCall: boolean;
  callType: 'voice' | 'video' | null;
  remotePeerId: string | null;
  isMuted: boolean;
  isVideoOff: boolean;
}

export const useWebRTC = (chatId: string, receiverId: string) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    callType: null,
    remotePeerId: null,
    isMuted: false,
    isVideoOff: false,
  });

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callLogIdRef = useRef<string | null>(null);
  const callStartTimeRef = useRef<number | null>(null);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const createCallLog = async (callType: 'voice' | 'video') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          chat_id: chatId,
          caller_id: user.id,
          receiver_id: receiverId,
          call_type: callType,
          status: 'completed',
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating call log:', error);
      return null;
    }
  };

  const updateCallLog = async (status: 'missed' | 'completed' | 'declined' | 'failed', duration?: number) => {
    if (!callLogIdRef.current) return;

    try {
      await supabase
        .from('call_logs')
        .update({
          status,
          duration,
          ended_at: new Date().toISOString(),
        })
        .eq('id', callLogIdRef.current);
    } catch (error) {
      console.error('Error updating call log:', error);
    }
  };

  const startCall = async (callType: 'voice' | 'video') => {
    try {
      // Create call log
      const logId = await createCallLog(callType);
      callLogIdRef.current = logId;
      callStartTimeRef.current = Date.now();

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      localStreamRef.current = stream;

      // Create peer connection
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          // Send ICE candidate to remote peer via Supabase realtime
          await supabase
            .channel(`call_${chatId}`)
            .send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: {
                candidate: event.candidate,
                from: user?.id,
              },
            });
        }
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to remote peer via Supabase realtime
      await supabase
        .channel(`call_${chatId}`)
        .send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            offer,
            callType,
            from: user?.id,
          },
        });

      setCallState({
        isInCall: true,
        callType,
        remotePeerId: receiverId,
        isMuted: false,
        isVideoOff: false,
      });

      toast({
        title: 'Calling',
        description: `${callType === 'video' ? 'Video' : 'Voice'} call started`,
      });
    } catch (error: any) {
      console.error('Error starting call:', error);
      toast({
        title: 'Error',
        description: 'Failed to start call',
        variant: 'destructive',
      });
      await updateCallLog('failed');
    }
  };

  const answerCall = async (offer: RTCSessionDescriptionInit, callType: 'voice' | 'video') => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      localStreamRef.current = stream;

      // Create peer connection
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await supabase
            .channel(`call_${chatId}`)
            .send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: {
                candidate: event.candidate,
                from: user?.id,
              },
            });
        }
      };

      // Set remote description and create answer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer to caller
      await supabase
        .channel(`call_${chatId}`)
        .send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            answer,
            from: user?.id,
          },
        });

      setCallState({
        isInCall: true,
        callType,
        remotePeerId: receiverId,
        isMuted: false,
        isVideoOff: false,
      });

      callStartTimeRef.current = Date.now();
    } catch (error: any) {
      console.error('Error answering call:', error);
      toast({
        title: 'Error',
        description: 'Failed to answer call',
        variant: 'destructive',
      });
    }
  };

  const endCall = async () => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    remoteStreamRef.current?.getTracks().forEach(track => track.stop());

    // Close peer connection
    peerConnectionRef.current?.close();

    // Calculate call duration
    const duration = callStartTimeRef.current 
      ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      : 0;

    // Update call log
    await updateCallLog('completed', duration);

    // Reset state
    setCallState({
      isInCall: false,
      callType: null,
      remotePeerId: null,
      isMuted: false,
      isVideoOff: false,
    });

    localStreamRef.current = null;
    remoteStreamRef.current = null;
    peerConnectionRef.current = null;
    callLogIdRef.current = null;
    callStartTimeRef.current = null;

    toast({
      title: 'Call ended',
      description: `Call duration: ${duration}s`,
    });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
      }
    }
  };

  // Setup realtime listeners
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`call_${chatId}`);

    channel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.from !== user.id) {
          // Incoming call
          const accept = window.confirm(`Incoming ${payload.callType} call. Accept?`);
          if (accept) {
            await answerCall(payload.offer, payload.callType);
          } else {
            await updateCallLog('declined');
          }
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.from !== user.id && peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(payload.answer)
          );
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.from !== user.id && peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(payload.candidate)
          );
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [chatId, user]);

  return {
    callState,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};
