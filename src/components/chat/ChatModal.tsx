'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

interface MessagePayload {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-ink-100 px-1 rounded-brutal-sm font-mono text-caption">$1</code>')
    .replace(/\n/g, '<br/>');

  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` data-lang="${lang}"` : '';
    return `<pre class="bg-ink-50 border-brutal border-ink rounded-brutal-sm p-3 my-2 overflow-x-auto font-mono text-caption"${langClass}>${code.trim()}</pre>`;
  });

  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc font-mono text-caption">$1</li>');

  return html;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="w-2 h-2 bg-ink-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-ink-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-ink-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export function ChatModal({ onClose, initialMessage }: { onClose: () => void; initialMessage?: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadHistory();
    if (initialMessage) {
      setInput(initialMessage);
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  async function loadHistory() {
    try {
      const res = await fetch('/api/chat?limit=50');
      const data = await res.json();
      setMessages(data.data ?? []);
    } catch {}
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setInput('');
    setQuickReplies([]);

    const optimisticUser: ChatMessage = {
      id: `opt-${Date.now()}`,
      content: text.trim(),
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuickReplies(data.data.quickReplies ?? []);
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== optimisticUser.id)
          .concat([
            { ...data.data.user, id: data.data.user.id },
            { ...data.data.bot, id: data.data.bot.id },
          ])
      );
    } catch (e: any) {
      setError(e.message);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim()) return;
    await sendMessage(input);
  }

  async function handleQuickReply(text: string) {
    await sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex animate-fade-in">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl mx-auto my-8 flex flex-col bg-paper border-brutal border-ink rounded-brutal shadow-brutal-hover animate-fade-in-up max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
          <div>
            <p className="font-mono text-caption uppercase tracking-wider text-ink-400">
              Support Chat
            </p>
            <p className="font-display text-subheading font-bold">How can I help?</p>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-caption text-ink-300 hover:text-accent transition-colors px-3 py-1.5 border border-ink-200 rounded-brutal-sm hover:border-accent"
          >
            ESC ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[300px]">
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="font-display text-body-sm font-semibold text-ink-400">
                  Start a conversation
                </p>
                <p className="font-mono text-caption text-ink-300">
                  I'm here to listen and help. What's on your mind?
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'order-1' : 'order-1'}`}>
                <div
                  className={`px-4 py-2.5 border-brutal border-ink ${
                    msg.role === 'user'
                      ? 'bg-ink text-paper rounded-brutal-sm'
                      : 'bg-chrome/30 text-ink rounded-brutal-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <span
                      className="font-sans text-body-sm leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_code]:bg-ink-100 [&_code]:px-1 [&_code]:rounded-brutal-sm [&_code]:font-mono [&_code]:text-caption [&_pre]:bg-ink-50 [&_pre]:p-3 [&_pre]:border [&_pre]:border-ink [&_pre]:rounded-brutal-sm [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-caption [&_li]:ml-4 [&_li]:list-disc [&_li]:font-mono [&_li]:text-caption"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <span className="font-sans text-body-sm leading-relaxed text-paper">
                      {msg.content}
                    </span>
                  )}
                </div>
                <p className={`font-mono text-caption text-ink-300 px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-chrome/30 border-brutal border-ink rounded-brutal-sm">
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 border-brutal border-accent rounded-brutal-sm bg-accent/5">
              <p className="font-mono text-caption text-accent">{error}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {quickReplies.length > 0 && !loading && (
          <div className="px-6 py-3 border-t border-ink-200 flex flex-wrap gap-2">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => handleQuickReply(qr)}
                className="font-mono text-caption px-3 py-1.5 border-brutal border-ink rounded-brutal-sm bg-paper text-ink hover:bg-ink hover:text-paper transition-colors shadow-brutal-sm hover:shadow-brutal"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        <div className="px-6 py-4 border-t border-ink-200">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              disabled={loading}
              className="flex-1 bg-ink-50 border-brutal border-ink rounded-brutal-sm px-4 py-2.5 font-sans text-body-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink disabled:opacity-40"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 bg-ink text-paper font-display text-body-sm font-semibold border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
