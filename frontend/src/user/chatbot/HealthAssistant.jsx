import { useState, useRef, useEffect } from "react";
import { healthService } from "../../services/healthService.js";

export default function HealthAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your health assistant. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      // Expected response: { reply: "..." }
      const { data } = await healthService.askAssistant(text);
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't reach the server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[75vh] max-w-2xl flex-col">
      <h1 className="mb-3 text-2xl font-semibold">Health Assistant</h1>
      <div className="card flex-1 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100"}`}>
              {m.text}
            </p>
          </div>
        ))}
        {loading && <p className="text-sm text-slate-400">Thinking...</p>}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a health question..." />
        <button className="btn" disabled={loading}>Send</button>
      </form>
    </div>
  );
}
