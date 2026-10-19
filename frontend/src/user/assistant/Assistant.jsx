
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  UserRound,
  Send,
  Trash2,
  LoaderCircle,
  HeartPulse,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const suggestions = [
  "What are some habits for better sleep?",
  "How can I maintain a balanced diet?",
  "What are common ways to manage stress?",
  "What should I ask my doctor at a checkup?",
];

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const { data } = await api.get("/tutor/history");

        if (active) setMessages(data.messages || []);
      } catch (error) {
        if (active) {
          toast.error(
            error.response?.data?.message ||
              "Unable to load chat history."
          );
        }
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(event) {
    event.preventDefault();

    const question = input.trim();

    if (!question || sending) return;

    if (question.length > 2000) {
      toast.error("Your message must be 2000 characters or fewer.");
      return;
    }

    setInput("");
    setSending(true);

    const temporaryId = `temp-${Date.now()}`;

    setMessages((current) => [
      ...current,
      {
        id: temporaryId,
        role: "user",
        content: question,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const { data } = await api.post("/tutor/chat", {
        message: question,
      });

      setMessages((current) => [
        ...current.filter((item) => item.id !== temporaryId),
        {
          ...data.userMessage,
          id: `${temporaryId}-user`,
          createdAt: new Date().toISOString(),
        },
        {
          ...data.assistantMessage,
          id: `${temporaryId}-assistant`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to contact the AI assistant."
      );

      // Keep the question visible so the user can see what failed.
    } finally {
      setSending(false);
    }
  }

  async function handleClearHistory() {
    if (sending) {
      toast.error("Please wait for the current response to finish.");
      return;
    }

    try {
      await api.delete("/tutor/history");
      setMessages([]);
      toast.success("Conversation history cleared.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to clear conversation history."
      );
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] min-h-[520px] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
            <HeartPulse size={24} />
          </div>

          <div>
            <h1 className="font-bold text-slate-800">
              SehatSathi AI Assistant
            </h1>
            <p className="text-xs text-slate-500">
              General health information
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearHistory}
          disabled={sending || messages.length === 0}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          title="Clear conversation history"
        >
          <Trash2 size={17} />
          <span className="hidden sm:inline">Clear chat</span>
        </button>
      </header>

      {/* Safety notice */}
      <div className="flex gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 sm:px-6">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <p>
          This assistant provides general educational information, not
          medical diagnosis or treatment. For emergencies, contact local
          emergency services.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={20} />
            Loading your conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
            <div className="rounded-2xl bg-teal-50 p-5 text-teal-700">
              <Bot size={40} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              How can I help you today?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ask a general health question or choose a suggested topic
              to get started.
            </p>

            <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-600 transition hover:border-teal-300 hover:text-teal-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id || `${message.role}-${index}`}
                className={`flex items-start gap-3 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="shrink-0 rounded-xl bg-teal-100 p-2 text-teal-800">
                    <Bot size={19} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                    isUser
                      ? "rounded-tr-sm bg-teal-700 text-white"
                      : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {message.content}
                </div>

                {isUser && (
                  <div className="shrink-0 rounded-xl bg-blue-100 p-2 text-blue-800">
                    <UserRound size={19} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-100 p-2 text-teal-800">
              <Bot size={19} />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              <LoaderCircle size={17} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-200 bg-white p-4 sm:p-5"
      >
        <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-teal-500">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask a general health question..."
            aria-label="Your health question"
            rows={1}
            maxLength={2000}
            disabled={loadingHistory || sending}
            className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={
              loadingHistory || sending || !input.trim()
            }
            className="rounded-xl bg-teal-700 p-3 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-slate-400">
          Avoid sharing passwords, identification numbers, or other
          unnecessary sensitive information.
        </p>
      </form>
    </div>
  );
}
