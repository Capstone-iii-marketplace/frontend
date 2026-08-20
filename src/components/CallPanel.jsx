import { useEffect, useRef, useState } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

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
      muted={muted}
      className={className}
    />
  );
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function CallPanel({ call }) {
  const { user } = useAuth();
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
  const [minimized, setMinimized] = useState(false);

  // Fresh call, fresh window size — don't inherit "minimized" from the last one.
  useEffect(() => {
    if (status === 'idle') setMinimized(false);
  }, [status]);

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

  // Local camera-off shows initials instead of a black rectangle — a black
  // box in a corner reads as broken, an avatar reads as an intentional state.
  const LocalPreview = ({ className }) =>
    camOn ? (
      <Video stream={localStream} muted className={className} />
    ) : (
      <div
        className={`${className} flex items-center justify-center bg-gray-800`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-600 text-sm font-semibold text-white">
          {initials(user?.name)}
        </div>
      </div>
    );

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-64 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="relative h-36">
          {remote.length > 0 ? (
            <Video
              stream={remote[0][1]}
              className="h-full w-full bg-black object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              {status === 'calling' ? 'Calling…' : 'Connecting…'}
            </div>
          )}
          <LocalPreview className="absolute bottom-2 right-2 h-14 w-20 rounded border border-gray-700 object-cover" />
        </div>
        <div className="flex items-center justify-between gap-2 bg-gray-800 px-2 py-1.5">
          <button
            onClick={() => setMinimized(false)}
            aria-label="Expand call"
            className="rounded-full p-1.5 text-white hover:bg-gray-700"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={endCall}
            className="rounded-full bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700"
          >
            End
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      <div className="relative min-h-0 flex-1">
        {remote.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
            {status === 'calling' ? 'Calling…' : 'Connecting…'}
          </div>
        ) : (
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

        <LocalPreview className="absolute bottom-6 right-6 h-28 w-40 rounded-lg border border-gray-700 shadow-lg" />

        <button
          onClick={() => setMinimized(true)}
          aria-label="Minimize call"
          className="absolute left-4 top-4 rounded-full bg-gray-800/80 p-2 text-white hover:bg-gray-700"
        >
          <Minimize2 size={16} />
        </button>
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