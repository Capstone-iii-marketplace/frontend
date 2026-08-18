import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useCall } from '../context/CallContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import CallPanel from '../components/CallPanel.jsx';

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
    <div className="flex h-[calc(100vh-4rem)] border-t border-base-300">
      {/* On mobile the thread list and an open thread take turns owning the
          screen — both stay visible side by side from md up. */}
      <aside
        className={`${
          id ? 'hidden md:block' : 'block'
        } w-64 shrink-0 overflow-y-auto border-r border-base-300`}
      >
        {conversations.length === 0 && (
          <p className="p-4 text-sm opacity-60">No conversations yet.</p>
        )}
        {conversations.map((c) => {
          const other =
            c.buyer.id === user?.id ? c.listing.seller.name : c.buyer.name;
          const unreadCount = unread[c.id] ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => navigate(`/messages/${c.id}`)}
              className={`block w-full border-b border-base-300 p-3 text-left hover:bg-base-200 ${
                c.id === id ? 'bg-base-200' : ''
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span
                  className={`block text-sm ${
                    unreadCount > 0 ? 'font-bold' : 'font-semibold'
                  }`}
                >
                  {other}
                </span>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-700 px-1.5 text-xs font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </span>
              <span className="block truncate text-xs opacity-60">
                {c.listing.title}
              </span>
            </button>
          );
        })}
      </aside>

      <section
        className={`${id ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}
      >
        {!id && (
          <p className="m-auto text-sm opacity-60">
            Select a conversation to start chatting.
          </p>
        )}

        {id && (
          <>
           <header className="flex items-center gap-3 border-b border-base-300 p-3">
              <button
                type="button"
                onClick={() => navigate('/messages')}
                aria-label="Back to conversations"
                className="btn btn-ghost btn-sm px-2 md:hidden"
              >
                ←
              </button>
              <div>
                {activeOther && (
                  <Link
                    to={`/users/${activeOther.id}`}
                    className="block text-sm font-semibold hover:underline"
                  >
                    {activeOther.name}
                  </Link>
                )}
                <span className="block text-xs opacity-60">
                  {active?.listing.title ?? 'Conversation'}
                </span>
              </div>
              {call.status === 'idle' && (
                <button
                  onClick={() => call.startCall(id)}
                  className="ml-auto rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:border-gray-900"
                >
                  Video call
                </button>
              )}
            </header>



           <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat ${
                    m.sender.id === user?.id ? 'chat-end' : 'chat-start'
                  }`}
                >
                  <div className="chat-bubble">{m.body}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {error && <p className="px-4 pb-2 text-sm text-error">{error}</p>}

            <div className="flex gap-2 border-t border-base-300 p-3">
              <input
                className="input input-bordered flex-1"
                value={draft}
                placeholder="Type a message..."
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button className="btn btn-primary" onClick={send}>
                Send
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}