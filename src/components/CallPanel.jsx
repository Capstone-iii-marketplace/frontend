import { useEffect, useRef, useState } from 'react';

// Attaches a MediaStream to a <video>. srcObject can't be set via JSX props,
// so it has to happen in an effect after the element exists.
function Video({ stream, muted, className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream ?? null;
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      // The local preview must be muted or you hear your own mic echoed back.
      muted={muted}
      className={className}
    />
  );
}

export default function CallPanel({ call }) {
  const {
    localStream,
    remoteStreams,
    status,
    incoming,
    error,
    acceptCall,
    declineCall,
    endCall,
  } = call;

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Toggling a track's enabled flag keeps the connection up — stopping the
  // track instead would require renegotiating to turn it back on.
  const toggleMic = () => {
    const track = localStream?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCam = () => {
    const track = localStream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  if (status === 'idle') {
    return error ? (
      <p className="px-4 py-2 text-sm text-rose-600">{error}</p>
    ) : null;
  }

  // Incoming ring is its own modal — it renders before either side has a
  // stream, so it can't share the video-overlay layout below.
  if (status === 'ringing' && incoming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6 text-center text-white shadow-xl">
          <p className="text-lg font-semibold">{incoming.from.name}</p>
          <p className="mt-1 text-sm text-gray-400">Incoming video call…</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={acceptCall}
              className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-medium hover:bg-emerald-700"
            >
              Accept
            </button>
            <button
              onClick={declineCall}
              className="rounded-full bg-rose-600 px-6 py-2 text-sm font-medium hover:bg-rose-700"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  const remote = [...remoteStreams.entries()];

  // Fixed overlay above the whole app — the chat underneath needs no layout
  // changes to accommodate it, since it's out of normal flow entirely.
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      <div className="relative min-h-0 flex-1">
        {remote.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            {status === 'calling' ? 'Calling…' : 'Connecting…'}
          </div>
        ) : (
          // A grid rather than one element: the layout already holds however
          // many remote streams arrive.
          <div
            className="grid h-full auto-rows-fr gap-1"
            style={{
              gridTemplateColumns: `repeat(${Math.min(remote.length, 2)}, 1fr)`,
            }}
          >
            {remote.map(([peerId, stream]) => (
              <Video
                key={peerId}
                stream={stream}
                className="h-full w-full bg-black object-cover"
              />
            ))}
          </div>
        )}

        <Video
          stream={localStream}
          muted
          className="absolute bottom-6 right-6 h-28 w-40 rounded-lg border border-gray-700 bg-black object-cover shadow-lg"
        />
      </div>

      {error && (
        <p className="px-4 py-1 text-center text-sm text-rose-400">{error}</p>
      )}

      <div className="flex items-center justify-center gap-3 bg-gray-900 py-4">
        <button
          onClick={toggleMic}
          className={`rounded-full px-4 py-2 text-sm ${
            micOn ? 'bg-gray-700 text-white' : 'bg-gray-500 text-gray-200'
          }`}
        >
          {micOn ? 'Mute' : 'Unmute'}
        </button>
        <button
          onClick={toggleCam}
          className={`rounded-full px-4 py-2 text-sm ${
            camOn ? 'bg-gray-700 text-white' : 'bg-gray-500 text-gray-200'
          }`}
        >
          {camOn ? 'Camera off' : 'Camera on'}
        </button>
        <button
          onClick={endCall}
          className="rounded-full bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          End
        </button>
      </div>
    </div>
  );
}
