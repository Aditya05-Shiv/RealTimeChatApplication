import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wifi,
} from "lucide-react";
import { io } from "socket.io-client";
import clsx from "clsx";
import { API_URL, api, setAuthToken } from "./lib/api";

const savedToken = localStorage.getItem("chat_token");

const initials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

const formatTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const otherParticipant = (conversation, currentUserId) =>
  conversation?.participants?.find((participant) => participant._id !== currentUserId);

function Avatar({ user, online, size = "md" }) {
  return (
    <div className="relative shrink-0">
      <div
        className={clsx(
          "grid place-items-center rounded-2xl font-semibold text-white shadow-sm",
          size === "lg" ? "h-14 w-14 text-lg" : "h-11 w-11 text-sm",
        )}
        style={{ background: user?.avatarColor || "#2563eb" }}
      >
        {initials(user?.name)}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login" ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem("chat_token", data.token);
      setAuthToken(data.token);
      onAuth(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),linear-gradient(135deg,#f8fafc,#e2e8f0)] px-4 py-6 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
            <Wifi className="h-4 w-4 text-blue-600" />
            Real-time MERN and Socket.io chat
          </div>
          <div className="max-w-2xl space-y-5">
            <h1 className="text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">
              ProChat
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              Secure direct messaging with live presence, typing status, and a focused professional workspace.
            </p>
          </div>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              ["JWT Auth", ShieldCheck],
              ["Live Messages", MessageCircle],
              ["Modern UI", Sparkles],
            ].map(([label, Icon]) => (
              <div key={label} className="rounded-lg border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <Icon className="mb-3 h-5 w-5 text-blue-600" />
                <p className="font-semibold text-slate-900">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/80 bg-white p-6 shadow-2xl shadow-slate-300/60">
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
            {["login", "register"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={clsx(
                  "flex-1 rounded-md px-4 py-2 text-sm font-semibold capitalize transition",
                  mode === item ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <label className="block text-sm font-medium text-slate-700">
                Full name
                <input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Aditya Sharma"
                />
              </label>
            )}
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                required
                minLength={6}
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Minimum 6 characters"
              />
            </label>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <ShieldCheck className="h-5 w-5" />
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function App() {
  const [token, setToken] = useState(savedToken);
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState(null);
  const [loading, setLoading] = useState(Boolean(savedToken));
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const activeIdRef = useRef("");

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeId),
    [activeId, conversations],
  );
  const activeContact = otherParticipant(activeConversation, user?._id);

  useEffect(() => {
    setAuthToken(token);

    if (!token) return;

    const boot = async () => {
      try {
        const [meRes, convRes, usersRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/conversations"),
          api.get("/users"),
        ]);
        setUser(meRes.data.user);
        setConversations(convRes.data.conversations);
        setUsers(usersRes.data.users);
        setActiveId(convRes.data.conversations[0]?._id || "");
      } catch {
        localStorage.removeItem("chat_token");
        setToken(null);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, [token]);

  useEffect(() => {
    if (!token || !user) return undefined;

    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("presence:update", ({ onlineUsers: online }) => setOnlineUsers(online));
    socket.on("typing:start", ({ conversationId, user: typingUser }) => {
      if (conversationId === activeIdRef.current && typingUser._id !== user._id) setTyping(typingUser);
    });
    socket.on("typing:stop", ({ conversationId }) => {
      if (conversationId === activeIdRef.current) setTyping(null);
    });
    socket.on("message:new", ({ message, conversation }) => {
      setConversations((current) => {
        const filtered = current.filter((item) => item._id !== conversation._id);
        return [conversation, ...filtered];
      });

      if (message.conversation === activeIdRef.current || message.conversation?._id === activeIdRef.current) {
        setMessages((current) => {
          if (current.some((item) => item._id === message._id)) return current;
          return [...current, message];
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;

    socketRef.current?.emit("conversation:join", activeId);
    api.get(`/messages/${activeId}`).then(({ data }) => setMessages(data.messages));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const filteredUsers = useMemo(() => {
    const existingIds = new Set(
      conversations.map((conversation) => otherParticipant(conversation, user?._id)?._id).filter(Boolean),
    );
    const query = search.toLowerCase();

    return users.filter((item) => {
      const matches = item.name.toLowerCase().includes(query) || item.email.toLowerCase().includes(query);
      return matches && !existingIds.has(item._id);
    });
  }, [conversations, search, user?._id, users]);

  const handleAuth = (authUser, authToken) => {
    setUser(authUser);
    setToken(authToken);
  };

  const logout = () => {
    socketRef.current?.disconnect();
    localStorage.removeItem("chat_token");
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setConversations([]);
    setMessages([]);
    setActiveId("");
  };

  const startConversation = async (participantId) => {
    const { data } = await api.post("/conversations", { participantId });
    setConversations((current) => {
      const filtered = current.filter((item) => item._id !== data.conversation._id);
      return [data.conversation, ...filtered];
    });
    setActiveId(data.conversation._id);
    setSearch("");
  };

  const emitTyping = () => {
    if (!activeId || !socketRef.current) return;
    socketRef.current.emit("typing:start", { conversationId: activeId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit("typing:stop", { conversationId: activeId });
    }, 900);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || sending) return;

    setSending(true);
    setDraft("");
    socketRef.current?.emit("typing:stop", { conversationId: activeId });

    socketRef.current?.emit("message:send", { conversationId: activeId, text }, (ack) => {
      setSending(false);
      if (!ack?.ok) setDraft(text);
    });
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-700">
        <div className="rounded-lg bg-white px-6 py-4 shadow-sm">Loading ProChat...</div>
      </main>
    );
  }

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  return (
    <main className="min-h-screen bg-slate-100 p-0 text-slate-900 lg:p-4">
      <section className="mx-auto grid h-screen max-w-7xl overflow-hidden bg-white shadow-xl lg:h-[calc(100vh-2rem)] lg:grid-cols-[360px_1fr] lg:rounded-lg">
        <aside
          className={clsx(
            "min-h-0 flex-col border-r border-slate-200 bg-slate-50 lg:flex",
            activeId ? "hidden" : "flex",
          )}
        >
          <header className="border-b border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar user={user} online size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-slate-950">{user.name}</p>
                  <p className="flex items-center gap-1 text-sm text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Online
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Logout"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </header>

          <div className="chat-scroll min-h-0 flex-1 overflow-y-auto p-3">
            {search && (
              <div className="mb-4 space-y-2">
                <p className="px-2 text-xs font-bold uppercase text-slate-400">Start a chat</p>
                {filteredUsers.map((person) => (
                  <button
                    key={person._id}
                    type="button"
                    onClick={() => startConversation(person._id)}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-white hover:shadow-sm"
                  >
                    <Avatar user={person} online={onlineUsers.includes(person._id)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{person.name}</p>
                      <p className="truncate text-sm text-slate-500">{person.email}</p>
                    </div>
                    <Plus className="h-5 w-5 text-blue-600" />
                  </button>
                ))}
                {!filteredUsers.length && <p className="px-2 py-4 text-sm text-slate-500">No new people found.</p>}
              </div>
            )}

            <div className="space-y-2">
              <p className="px-2 text-xs font-bold uppercase text-slate-400">Messages</p>
              {conversations.map((conversation) => {
                const contact = otherParticipant(conversation, user._id);
                const selected = activeId === conversation._id;

                return (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => setActiveId(conversation._id)}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-lg p-3 text-left transition",
                      selected ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "hover:bg-white hover:shadow-sm",
                    )}
                  >
                    <Avatar user={contact} online={onlineUsers.includes(contact?._id)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{contact?.name || "Unknown user"}</p>
                        <span className={clsx("text-xs", selected ? "text-blue-100" : "text-slate-400")}>
                          {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
                        </span>
                      </div>
                      <p className={clsx("truncate text-sm", selected ? "text-blue-100" : "text-slate-500")}>
                        {conversation.lastMessage?.text || contact?.bio || "Say hello"}
                      </p>
                    </div>
                  </button>
                );
              })}
              {!conversations.length && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                  Search for a person to begin.
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className={clsx("min-h-0 flex-col bg-white lg:flex", activeConversation ? "flex" : "hidden")}>
          {activeConversation ? (
            <>
              <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveId("")}
                    title="Back to conversations"
                    className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 lg:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <Avatar user={activeContact} online={onlineUsers.includes(activeContact?._id)} />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{activeContact?.name}</p>
                    <p className="text-sm text-slate-500">
                      {onlineUsers.includes(activeContact?._id) ? "Active now" : "Offline"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  title="Conversation menu"
                  className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </header>

              <div className="chat-scroll min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(#f8fafc,#eef2f7)] px-6 py-6">
                <div className="mx-auto flex max-w-3xl flex-col gap-3">
                  {messages.map((message) => {
                    const mine = message.sender?._id === user._id;
                    return (
                      <div key={message._id} className={clsx("flex items-end gap-2", mine && "justify-end")}>
                        {!mine && <Avatar user={message.sender} online={onlineUsers.includes(message.sender?._id)} />}
                        <div
                          className={clsx(
                            "max-w-[75%] rounded-lg px-4 py-3 shadow-sm",
                            mine
                              ? "rounded-br-sm bg-blue-600 text-white"
                              : "rounded-bl-sm border border-slate-200 bg-white text-slate-800",
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words leading-6">{message.text}</p>
                          <p className={clsx("mt-1 text-right text-xs", mine ? "text-blue-100" : "text-slate-400")}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {typing && (
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Avatar user={typing} online />
                      <span>{typing.name} is typing...</span>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-4">
                <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
                  <textarea
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      emitTyping();
                    }}
                    rows={1}
                    placeholder={`Message ${activeContact?.name || "contact"}`}
                    className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    title="Send message"
                    className="grid h-11 w-11 place-items-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="grid h-full place-items-center bg-slate-50 px-6 text-center">
              <div className="max-w-sm">
                <UserRound className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                <h2 className="text-2xl font-bold">Choose a conversation</h2>
                <p className="mt-2 text-slate-500">Search for a teammate or select a chat to start messaging.</p>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
