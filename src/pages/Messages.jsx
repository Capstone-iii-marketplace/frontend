import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useCall } from '../context/CallContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { ArrowLeft, MessageSquare, Send, Video } from 'lucide-react';

// Two-letter badge from a name, matching the avatars used elsewhere.
function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function messageTime(value) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Messages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const call = useCall();
  const { unread, clearThread } = useNotifications();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  // Inbox list — loaded once.
  useEffect(() => {
    chatApi
      .conversations()
      .then((data) => setConversations(data.conversations))
      .catch((err) => setError(err.message));
  }, []);

  // History for whichever thread is open. Runs again whenever :id changes.
  useEffect(() => {
    if (!id) return;
    setMessages([]);
    chatApi
      .messages(id)
      .then((data) => setMessages(data.messages))
      .catch((err) => setError(err.message));
  }, [id]);

  // Join the room, listen for incoming messages, and clean both up when the
  // thread changes — otherwise you keep receiving messages for old threads.
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('conversation:join', id, (res) => {
      if (res?.error) setError(res.error);
    });
    clearThread(id);

    const onNew = (message) => {
      if (message.conversationId !== id) return;
      setMessages((prev) => [...prev, message]);
    };
    socket.on('message:new', onNew);

    return () => {
      socket.off('message:new', onNew);
      socket.emit('conversation:leave', id);
    };
  }, [socket, id, clearThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const body = draft.trim();
    if (!body || !socket) return;

    // Clear immediately — the message comes back through message:new, which
    // the sender is also in the room for, so no optimistic append needed.
    setDraft('');
    socket.emit('message:send', { conversationId: id, body }, (res) => {
      if (res?.error) {
        setError(res.error);
        setDraft(body);
      }
    });
  };

  const active = conversations.find((c) => c.id === id);
  const activeOther =
    active &&
    (active.buyer.id === user?.id ? active.listing.seller : active.buyer);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] bg-base-100">
      {/* On mobile the thread list and an open thread take turns owning the
          screen — both stay visible side by side from md up. */}
      <aside
        className={`${
          id ? 'hidden md:flex' : 'flex'
        } w-full shrink-0 flex-col border-r border-base-300 md:w-80`}
      >
        <div className="border-b border-base-300 px-4 py-3">
          <h1 className="font-display text-lg font-bold">Messages</h1>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <MessageSquare size={28} className="opacity-30" />
              <p className="text-sm opacity-60">No conversations yet.</p>
              <Link to="/home" className="link link-primary text-xs">
                Browse listings
              </Link>
            </div>
          )}

          {conversations.map((c) => {
            const other =
              c.buyer.id === user?.id ? c.listing.seller : c.buyer;
            const unreadCount = unread[c.id] ?? 0;
            const isActive = c.id === id;
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/messages/${c.id}`)}
                className={`flex w-full items-center gap-3 border-b border-base-300 px-4 py-3 text-left transition hover:bg-base-200 ${
                  isActive ? 'bg-base-200' : ''
                }`}
              >
                <div className="avatar placeholder shrink-0">
                  <div className="w-10 rounded-full bg-neutral text-neutral-content">
                    <span className="text-xs font-semibold">
                      {initials(other?.name)}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-sm ${
                        unreadCount > 0 ? 'font-bold' : 'font-semibold'
                      }`}
                    >
                      {other?.name}
                    </span>
                    {unreadCount > 0 && (
                      <span className="badge badge-primary badge-sm shrink-0 font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="block truncate text-xs opacity-60">
                    {c.listing.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className={`${id ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
        {!id && (
          <div className="m-auto flex flex-col items-center gap-3 text-center">
            <MessageSquare size={40} className="opacity-20" />
            <p className="text-sm opacity-60">
              Select a conversation to start chatting.
            </p>
          </div>
        )}

        {id && (
          <>
            <header className="flex items-center gap-3 border-b border-base-300 bg-base-100/80 px-4 py-3 backdrop-blur">
              <button
                type="button"
                onClick={() => navigate('/messages')}
                aria-label="Back to conversations"
                className="btn btn-ghost btn-sm px-2 md:hidden"
              >
                <ArrowLeft size={18} />
              </button>

              {/* Listing thumbnail — the thread is about an item, so show it. */}
              {active?.listing?.images?.[0] && (
                <img
                  src={active.listing.images[0]}
                  alt=""
                  className="hidden h-10 w-10 shrink-0 rounded-lg object-cover sm:block"
                />
              )}

              <div className="min-w-0">
                {activeOther && (
                  <Link
                    to={`/users/${activeOther.id}`}
                    className="block truncate text-sm font-semibold hover:underline"
                  >
                    {activeOther.name}
                  </Link>
                )}
                <Link
                  to={active?.listing ? `/listings/${active.listing.id}` : '#'}
                  className="block truncate text-xs opacity-60 hover:underline"
                >
                  {active?.listing.title ?? 'Conversation'}
                </Link>
              </div>

              {call.status === 'idle' && (
                <button
                  onClick={() => call.startCall(id)}
                  className="btn btn-outline btn-sm ml-auto gap-1.5"
                >
                  <Video size={15} />
                  <span className="hidden sm:inline">Video call</span>
                </button>
              )}
            </header>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-base-200/40 p-4">
              {messages.length === 0 && (
                <p className="py-10 text-center text-sm opacity-50">
                  No messages yet — say hello.
                </p>
              )}

              {messages.map((m) => {
                const mine = m.sender.id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`chat ${mine ? 'chat-end' : 'chat-start'}`}
                  >
                    <div className="avatar placeholder chat-image">
                      <div className="w-8 rounded-full bg-neutral text-neutral-content">
                        <span className="text-[10px] font-semibold">
                          {initials(m.sender.name)}
                        </span>
                      </div>
                    </div>
                    <div className="chat-header mb-0.5 text-xs opacity-60">
                      {mine ? 'You' : m.sender.name}
                      <time className="ml-1.5 text-[10px] opacity-70">
                        {messageTime(m.createdAt)}
                      </time>
                    </div>
                    <div
                      className={`chat-bubble ${
                        mine ? 'chat-bubble-primary' : ''
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {error && <p className="px-4 pb-2 text-sm text-error">{error}</p>}

            <div className="flex items-center gap-2 border-t border-base-300 p-3">
              <input
                className="input input-bordered flex-1 rounded-full"
                value={draft}
                placeholder="Type a message..."
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button
                className="btn btn-primary btn-circle"
                onClick={send}
                disabled={!draft.trim()}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
