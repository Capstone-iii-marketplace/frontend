import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

// Public STUN only. On the same campus network peers usually connect directly;
// a TURN relay would be needed for restrictive NATs but isn't set up here.
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

// Peers are keyed by user id rather than held as a single connection, so a
// 1:1 call is just "one entry in the map" and a small broadcast is the same
// code with several. Signaling events already address payloads by user id.
export function useWebRTC() {
  const socket = useSocket();

  const peersRef = useRef(new Map());
  // Peer ids currently mid-negotiation, set synchronously before the first
  // await in onAccepted/onOffer — closes the race where a duplicate event
  // (e.g. from a second live connection for the same user) sneaks past a
  // `peersRef.current.has()` check while the first call is still awaiting
  // getUserMedia.
  const pendingPeersRef = useRef(new Set());
  const localStreamRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [callId, setCallId] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | calling | ringing | active
  const [error, setError] = useState('');

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // Builds one peer connection and wires its three event handlers. Called
  // once per remote participant.
  const createPeer = useCallback(
    (peerId, stream, currentCallId) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket.emit('signal:ice', {
          to: peerId,
          callId: currentCallId,
          data: event.candidate,
        });
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => new Map(prev).set(peerId, event.streams[0]));
      };

      pc.onconnectionstatechange = () => {
        if (['failed', 'closed'].includes(pc.connectionState)) {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
        }
      };

      peersRef.current.set(peerId, pc);
      return pc;
    },
    [socket],
  );

  const cleanup = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams(new Map());
    setCallId(null);
    setIncoming(null);
    setStatus('idle');
  }, []);

  const startCall = useCallback(
    async (conversationId) => {
      try {
        setError('');
        await getLocalStream();
        setStatus('calling');

        socket.emit('call:invite', { conversationId }, (res) => {
          if (res?.error) {
            setError(res.error);
            cleanup();
            return;
          }
          setCallId(res.callId);
        });
      } catch {
        setError('Camera or microphone unavailable');
        cleanup();
      }
    },
    [socket, getLocalStream, cleanup],
  );

  const acceptCall = useCallback(async () => {
    if (!incoming) return;
    try {
      setError('');
      await getLocalStream();

      socket.emit('call:accept', { callId: incoming.callId }, (res) => {
        if (res?.error) {
          setError(res.error);
          cleanup();
          return;
        }
        // The caller sends the offer; the callee just waits for it.
        setCallId(res.callId);
        setStatus('active');
        setIncoming(null);
      });
    } catch {
      setError('Camera or microphone unavailable');
      cleanup();
    }
  }, [incoming, socket, getLocalStream, cleanup]);

  const declineCall = useCallback(() => {
    if (!incoming) return;
    socket.emit('call:decline', { callId: incoming.callId });
    setIncoming(null);
  }, [incoming, socket]);

  const endCall = useCallback(() => {
    if (callId) socket.emit('call:end', { callId });
    cleanup();
  }, [callId, socket, cleanup]);

  useEffect(() => {
    if (!socket) return;

    const onIncoming = (payload) => {
      // Already busy — decline automatically rather than dropping the ring.
      if (status !== 'idle') {
        socket.emit('call:decline', { callId: payload.callId });
        return;
      }
      setIncoming(payload);
      setStatus('ringing');
    };

    // Callee accepted: create the peer and send the offer.
    const onAccepted = async ({ callId: id, peerId }) => {
      // Already negotiating with this peer — a repeated accept (e.g. from a
      // duplicate connection replaying the same event) would create a
      // second offer and break the first connection. Reserved synchronously,
      // before the first await, so a second call landing while this one is
      // still awaiting getUserMedia can't slip past the check.
      if (peersRef.current.has(peerId) || pendingPeersRef.current.has(peerId)) {
        return;
      }
      pendingPeersRef.current.add(peerId);

      try {
        const stream = await getLocalStream();
        const pc = createPeer(peerId, stream, id);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('signal:offer', { to: peerId, callId: id, data: offer });
        setStatus('active');
      } finally {
        pendingPeersRef.current.delete(peerId);
      }
    };

    const onOffer = async ({ from, callId: id, data }) => {
      // A peer already exists for this id — treat a repeat offer (from a
      // duplicate connection relaying the same event) as a no-op rather
      // than renegotiating an already-answered connection.
      if (peersRef.current.has(from) || pendingPeersRef.current.has(from)) {
        return;
      }
      pendingPeersRef.current.add(from);

      try {
        const stream = await getLocalStream();
        const pc = createPeer(from, stream, id);

        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal:answer', { to: from, callId: id, data: answer });
      } finally {
        pendingPeersRef.current.delete(from);
      }
    };

    const onAnswer = async ({ from, data }) => {
      const pc = peersRef.current.get(from);
      // An answer is only valid while we're waiting on one. A duplicate
      // arriving after negotiation would throw on a stable connection.
      if (!pc || pc.signalingState !== 'have-local-offer') return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } catch {
        // The signaling-state check above isn't atomic with this await, so
        // a second answer racing the first can still lose here once the
        // first finishes applying — the connection is already negotiated
        // with it, so the loser is safe to drop.
      }
    };
    const onIce = async ({ from, data }) => {
      const pc = peersRef.current.get(from);
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      } catch {
        // Candidates can arrive before the remote description is set;
        // dropping a late one is survivable.
      }
    };

    const onEnded = () => cleanup();

    socket.on('call:incoming', onIncoming);
    socket.on('call:accepted', onAccepted);
    socket.on('signal:offer', onOffer);
    socket.on('signal:answer', onAnswer);
    socket.on('signal:ice', onIce);
    socket.on('call:ended', onEnded);

    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:accepted', onAccepted);
      socket.off('signal:offer', onOffer);
      socket.off('signal:answer', onAnswer);
      socket.off('signal:ice', onIce);
      socket.off('call:ended', onEnded);
    };
  }, [socket, status, createPeer, getLocalStream, cleanup]);

  return {
    localStream,
    remoteStreams,
    status,
    incoming,
    error,
    startCall,
    acceptCall,
    declineCall,
    endCall,
  };
}