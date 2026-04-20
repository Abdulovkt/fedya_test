"use client";

import { useEffect, useRef, useState } from "react";
import { MessageText } from "@/components/chat/MessageText";

type Message = {
  id: number;
  sender: "customer" | "admin";
  text: string;
  createdAt: number;
};

export function ChatBox({ orderId, token }: { orderId: number; token: string }) {
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
    <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-brand-border shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-brand-border bg-brand-surface px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-heading">Чат с магазином</p>
          <p className="text-xs text-brand-muted">Заказ #{orderId} · Ответим в ближайшее время</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#f0f2f5] px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex justify-center">
            <span className="rounded-full bg-black/10 px-3 py-1 text-xs text-gray-500">
              Задайте любой вопрос по вашему заказу
            </span>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.sender === "customer";
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {/* Sender label */}
                <span className={`mb-0.5 text-xs font-semibold ${isMe ? "text-right text-brand/80" : "text-left text-brand-teal"}`}>
                  {isMe ? "Вы" : "Продавец"}
                </span>
                {/* Bubble */}
                <div className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${
                  isMe
                    ? "rounded-tr-sm bg-brand text-white"
                    : "rounded-tl-sm bg-white text-brand-heading border border-brand-border/50"
                }`}>
                  <MessageText text={m.text} isDark={isMe} />
                  <p className={`mt-1 text-right text-[11px] ${isMe ? "text-white/60" : "text-brand-muted/60"}`}>
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
      <form onSubmit={send} className="border-t border-brand-border bg-brand-surface px-3 py-3">
        {attachment && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-brand-border bg-brand-elevated px-3 py-2 text-xs text-brand-muted">
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
        <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
          placeholder="Сообщение…"
          className="flex-1 rounded-xl border border-brand-border bg-brand-elevated px-4 py-2 text-sm text-brand-heading outline-none focus:border-brand/50"
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
          className="rounded-full border border-brand-border p-2 text-brand-muted hover:border-brand/40 hover:text-brand"
          aria-label="Прикрепить чек"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-8.49 8.49a6 6 0 0 1-8.49-8.49l8.49-8.49a4 4 0 0 1 5.66 5.66l-8.5 8.48a2 2 0 1 1-2.82-2.82l7.79-7.78"/></svg>
        </button>
        <button
          type="submit"
          disabled={sending || (!text.trim() && !attachment)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-hover disabled:opacity-40"
          aria-label="Отправить"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
        </div>
      </form>
    </div>
  );
}
