import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export default function Messages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

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

    const onNew = (message) => {
      if (message.conversationId !== id) return;
      setMessages((prev) => [...prev, message]);
    };
    socket.on('message:new', onNew);

    return () => {
      socket.off('message:new', onNew);
      socket.emit('conversation:leave', id);
    };
  }, [socket, id]);

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

  return (
    <div className="flex h-[calc(100vh-4rem)] border-t border-base-300">
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-base-300">
        {conversations.length === 0 && (
          <p className="p-4 text-sm opacity-60">No conversations yet.</p>
        )}
        {conversations.map((c) => {
          const other =
            c.buyer.id === user?.id ? c.listing.seller.name : c.buyer.name;
          return (
            <button
              key={c.id}
              onClick={() => navigate(`/messages/${c.id}`)}
              className={`block w-full border-b border-base-300 p-3 text-left hover:bg-base-200 ${
                c.id === id ? 'bg-base-200' : ''
              }`}
            >
              <span className="block text-sm font-semibold">{other}</span>
              <span className="block truncate text-xs opacity-60">
                {c.listing.title}
              </span>
            </button>
          );
        })}
      </aside>

      <section className="flex flex-1 flex-col">
        {!id && (
          <p className="m-auto text-sm opacity-60">
            Select a conversation to start chatting.
          </p>
        )}

        {id && (
          <>
            <header className="border-b border-base-300 p-3">
              <span className="text-sm font-semibold">
                {active?.listing.title ?? 'Conversation'}
              </span>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
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