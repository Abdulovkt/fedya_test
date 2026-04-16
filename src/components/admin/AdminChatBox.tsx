"use client";

import { useEffect, useRef, useState } from "react";
import { markChatAsRead } from "@/app/actions/admin";
import { MessageText } from "@/components/chat/MessageText";

type Message = {
  id: number;
  sender: "customer" | "admin";
  text: string;
  createdAt: number;
};

export function AdminChatBox({
  orderId,
  customerName,
}: {
  orderId: number;
  customerName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    const res = await fetch(`/api/chat/${orderId}`);
    if (res.ok) {
      setMessages(await res.json());
      markChatAsRead(orderId).catch(() => {});
    }
  }

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch(`/api/chat/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    setText("");
    await fetchMessages();
    setSending(false);
  }

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-brand-border shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-brand-border bg-brand-surface px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-lg font-bold text-brand-teal">
          {customerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-heading">{customerName}</p>
          <p className="text-xs text-brand-muted">Заказ #{orderId}</p>
        </div>
        <div className="ml-auto flex h-2 w-2 rounded-full bg-green-400" title="Онлайн-опрос активен" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#f0f2f5] px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex justify-center">
            <span className="rounded-full bg-black/10 px-3 py-1 text-xs text-gray-500">
              Клиент ещё не писал
            </span>
          </div>
        )}
        {messages.map((m) => {
          const isAdmin = m.sender === "admin";
          return (
            <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                {/* Sender label */}
                <span className={`mb-0.5 text-xs font-semibold ${isAdmin ? "text-right text-brand/80" : "text-left text-brand-teal"}`}>
                  {isAdmin ? "Вы (продавец)" : customerName}
                </span>
                {/* Bubble */}
                <div className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${
                  isAdmin
                    ? "rounded-tr-sm bg-brand text-white"
                    : "rounded-tl-sm bg-white text-brand-heading border border-brand-border/50"
                }`}>
                  <MessageText text={m.text} isDark={isAdmin} />
                  <p className={`mt-1 text-right text-[11px] ${isAdmin ? "text-white/60" : "text-brand-muted/60"}`}>
                    {new Date(m.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-brand-border bg-brand-surface px-3 py-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
          placeholder={`Ответить ${customerName}…`}
          className="flex-1 rounded-xl border border-brand-border bg-brand-elevated px-4 py-2 text-sm text-brand-heading outline-none focus:border-brand/50"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-hover disabled:opacity-40"
          aria-label="Отправить"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  );
}
