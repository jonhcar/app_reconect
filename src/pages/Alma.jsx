import { useEffect, useRef, useState } from "react";
import { Send, Plus, MessageCircleHeart } from "lucide-react";
import { base44 } from "../api/supabaseClient";

const IA_ENABLED = import.meta.env.VITE_ENABLE_IA === "true";

export default function Alma() {
  if (!IA_ENABLED) {
    return (
      <div className="py-20 text-center text-malva-400">
        <MessageCircleHeart className="mx-auto mb-3 text-rosa-400" size={32} />
        <p className="font-display text-xl text-malva-600">Alma llega pronto 💗</p>
      </div>
    );
  }
  const [conversations, setConversations] = useState([]);
  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.agents.listConversations().then((convs) => {
      setConversations(convs);
      if (convs[0]) selectConversation(convs[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!current) return;
    const unsubscribe = base44.agents.subscribeToConversation(current.id, ({ messages }) => {
      setMessages(messages || []);
    });
    return unsubscribe;
  }, [current?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConversation = async (conv) => {
    setCurrent(conv);
    const { messages } = await base44.agents.getConversation(conv.id);
    setMessages(messages);
  };

  const newConversation = async () => {
    const conv = await base44.agents.createConversation({});
    setConversations([conv, ...conversations]);
    setCurrent(conv);
    setMessages([]);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    let conv = current;
    if (!conv) {
      conv = await base44.agents.createConversation({});
      setConversations([conv, ...conversations]);
      setCurrent(conv);
    }
    const content = input.trim();
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { id: "tmp", role: "user", content }]);
    try {
      await base44.agents.addMessage(conv, { role: "user", content });
    } catch {
      alert("Alma no pudo responder ahora. Inténtalo de nuevo 💗");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="py-6 flex flex-col" style={{ minHeight: "calc(100vh - 180px)" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl text-malva-700 flex items-center gap-2">
          <MessageCircleHeart className="text-rosa-400" /> Alma
        </h1>
        <button onClick={newConversation} className="flex items-center gap-1 text-sm font-bold text-rosa-500">
          <Plus size={16} /> Nueva
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-12 text-malva-400">
            <p className="font-display text-xl text-malva-600 mb-2">Hola, soy Alma 💗</p>
            <p className="text-sm">Estoy aquí para escucharte y acompañarte. Cuéntame cómo te sientes hoy.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "user" ? "bg-rosa-500 text-white rounded-br-md" : "bg-white text-malva-700 shadow-sm rounded-bl-md"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white rounded-3xl px-4 py-3 text-sm text-malva-300 animate-pulse shadow-sm">Alma está escribiendo…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="sticky bottom-16 mt-4 flex gap-2 bg-crema pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escríbele a Alma…"
          className="input"
        />
        <button disabled={sending || !input.trim()} className="bg-rosa-500 text-white rounded-2xl px-4 disabled:opacity-40" aria-label="Enviar">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
