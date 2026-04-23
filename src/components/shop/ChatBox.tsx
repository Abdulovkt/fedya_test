"use client";

import { useEffect, useRef, useState } from "react";
import { MessageText } from "@/components/chat/MessageText";

type Message = {
  id: number;
  sender: "customer" | "admin";
  text: string;
  createdAt: number;
};

export function ChatBox({
  orderId,
  orderNumber,
  token,
}: {
  orderId: number;
  orderNumber: string;
  token: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatUrl = `/api/chat/${orderId}?token=${encodeURIComponent(token)}`;

  async function fetchMessages() {
    try {
      const res = await fetch(chatUrl, { cache: "no-store" });
      if (!res.ok) return;
      setMessages((await res.json()) as Message[]);
    } catch (error) {
      console.error("Failed to fetch customer chat messages", error);
    }
  }

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if ((!text.trim() && !attachment) || sending) return;
    setSending(true);
    if (attachment) {
      const fd = new FormData();
      if (text.trim()) fd.set("text", text.trim());
      fd.set("attachment", attachment);
      await fetch(chatUrl, {
        method: "POST",
        body: fd,
      });
    } else {
      await fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
    }
    setText("");
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await fetchMessages();
    setSending(false);
  }

  return (
    <div className="flex h-[min(75vh,760px)] min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-brand-border shadow-lg sm:rounded-3xl">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-4 border-b border-brand-border bg-brand-surface px-5 py-4 sm:px-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-brand-heading sm:text-lg">Чат с магазином</p>
          <p className="mt-0.5 text-sm text-brand-muted">
            Заказ {orderNumber} · Ответим в ближайшее время
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f0f2f5] px-4 py-5 sm:px-6 sm:py-6">
        {messages.length === 0 && (
          <div className="flex justify-center">
            <span className="rounded-full bg-black/8 px-4 py-1.5 text-sm text-slate-600">
              Задайте любой вопрос по вашему заказу
            </span>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.sender === "customer";
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex max-w-[min(100%,32rem)] flex-col sm:max-w-[85%] ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                {/* Sender label */}
                <span
                  className={`mb-1 text-xs font-semibold sm:text-sm ${
                    isMe ? "text-right text-brand/80" : "text-left text-brand-teal"
                  }`}
                >
                  {isMe ? "Вы" : "Продавец"}
                </span>
                {/* Bubble */}
                <div
                  className={`relative rounded-2xl px-4 py-3 shadow-sm sm:px-5 sm:py-3.5 ${
                    isMe
                      ? "rounded-tr-sm bg-brand text-white"
                      : "rounded-tl-sm border border-brand-border/50 bg-white text-brand-heading"
                  }`}
                >
                  <MessageText text={m.text} isDark={isMe} className="text-base" />
                  <p
                    className={`mt-1.5 text-right text-xs ${isMe ? "text-white/65" : "text-brand-muted/80"}`}
                  >
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
      <form
        onSubmit={send}
        className="shrink-0 border-t border-brand-border bg-brand-surface px-4 py-4 sm:px-5"
      >
        {attachment && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-brand-border bg-brand-elevated px-4 py-2.5 text-sm text-brand-muted">
            <span className="truncate pr-2">Чек: {attachment.name}</span>
            <button
              type="button"
              onClick={() => {
                setAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-brand hover:underline"
            >
              Убрать
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 sm:gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
          placeholder="Сообщение…"
          className="min-h-[3rem] flex-1 rounded-2xl border border-brand-border bg-brand-elevated px-4 py-3 text-base text-brand-heading outline-none transition-colors duration-200 focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setAttachment(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-brand-border text-brand-muted transition-colors duration-200 hover:border-brand/40 hover:bg-brand-elevated hover:text-brand"
          aria-label="Прикрепить чек"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-8.49 8.49a6 6 0 0 1-8.49-8.49l8.49-8.49a4 4 0 0 1 5.66 5.66l-8.5 8.48a2 2 0 1 1-2.82-2.82l7.79-7.78"/></svg>
        </button>
        <button
          type="submit"
          disabled={sending || (!text.trim() && !attachment)}
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-brand-teal text-white transition-colors duration-200 hover:bg-brand-teal/90 disabled:opacity-40"
          aria-label="Отправить"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
        </div>
      </form>
    </div>
  );
}
