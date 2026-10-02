"use client";

import { useEffect, useRef, useState } from "react";
import { MascotChat } from "@/components/mascot";

type ChatMsg = { role: "user" | "assistant"; content: string };

// NoriChat — the Socratic AI tutor panel. Bubbles: assistant left with the
// mascot avatar (bg #F0F0F0, radius 16/16/16/4), user right (bg #FFFD73).
// Input row: rounded-xl #F0F0F0 with a w-7 h-7 black send button.

export function NoriChat({
  courseId,
  initialChat,
}: {
  courseId: string | null;
  initialChat: ChatMsg[];
}) {
  const [messages, setMessages] = useState<ChatMsg[]>(
    initialChat.length > 0
      ? initialChat
      : [
          {
            role: "assistant",
            content:
              "Hey! I'm Nori 👋 Ask me anything if you need a hint or want to talk through a concept.",
          },
        ],
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, courseId }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { reply: string } }
        | { ok: false; error: { message: string } };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: json.ok
            ? json.data.reply
            : "I'm having trouble connecting right now — try again in a moment.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now — try again in a moment." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col" style={{ fontFamily: '"Funnel Sans", sans-serif' }}>
      {/* header */}
      <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: "rgba(0, 0, 0, 0.08)" }}>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
          <MascotChat size={36} />
        </div>
        <div>
          <p className="text-sm font-medium text-black">Nori</p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "rgb(76, 175, 80)" }} />
            <span className="text-xs font-light" style={{ color: "rgb(89, 89, 89)" }}>
              Your AI Tutor
            </span>
          </div>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="scroll-slim min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="flex justify-start">
              <div className="mt-0.5 mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center">
                <MascotChat size={24} />
              </div>
              <div
                className="max-w-[80%] px-3.5 py-2.5 text-sm font-light leading-relaxed"
                style={{
                  backgroundColor: "rgb(240, 240, 240)",
                  color: "rgb(15, 14, 14)",
                  borderRadius: "16px 16px 16px 4px",
                }}
              >
                <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-p:leading-relaxed">
                  <p>{m.content}</p>
                </div>
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div
                className="max-w-[80%] px-3.5 py-2.5 text-sm font-light leading-relaxed"
                style={{
                  backgroundColor: "rgb(255, 253, 115)",
                  color: "rgb(15, 14, 14)",
                  borderRadius: "16px 16px 4px 16px",
                }}
              >
                <p>{m.content}</p>
              </div>
            </div>
          ),
        )}
        {sending ? (
          <div className="flex justify-start">
            <div className="mt-0.5 mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center">
              <MascotChat size={24} />
            </div>
            <div
              className="px-3.5 py-2.5 text-sm font-light"
              style={{ backgroundColor: "rgb(240, 240, 240)", borderRadius: "16px 16px 16px 4px", color: "rgb(89, 89, 89)" }}
            >
              <span className="inline-flex gap-1">
                <span className="dot-blink">·</span>
                <span className="dot-blink" style={{ animationDelay: "0.2s" }}>·</span>
                <span className="dot-blink" style={{ animationDelay: "0.4s" }}>·</span>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* input */}
      <div className="flex-shrink-0 border-t px-4 py-3" style={{ borderColor: "rgba(0, 0, 0, 0.08)" }}>
        <form
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ backgroundColor: "rgb(240, 240, 240)" }}
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Nori anything..."
            className="flex-1 bg-transparent text-sm font-light text-black outline-none placeholder:text-black/30"
            aria-label="Ask Nori anything"
          />
          <button
            type="submit"
            disabled={sending || input.trim().length === 0}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-30"
            style={{ backgroundColor: "rgb(15, 14, 14)" }}
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up h-4 w-4 text-white">
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
