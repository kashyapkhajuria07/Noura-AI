'use client';

import { useNotifications } from '@/lib/notifications/context';
import { useChat } from '@/components/chat/ChatWrapper';

function typeBorder(type: string): string {
  switch (type) {
    case 'risk_red':
      return 'border-accent shadow-brutal-accent';
    case 'risk_amber':
      return 'border-ink-300';
    case 'intervention':
      return 'border-chrome';
    default:
      return 'border-chrome';
  }
}

function typeAccent(type: string): string {
  switch (type) {
    case 'risk_red':
      return 'bg-accent';
    case 'risk_amber':
      return 'bg-ink-300';
    case 'intervention':
      return 'bg-chrome';
    default:
      return 'bg-chrome';
  }
}

export function Toast() {
  const { current, visible, expanded, dismiss, toggleExpand, collapse } = useNotifications();
  const { openChat } = useChat();

  if (!current) return null;

  return (
    <>
      <div
        className={`fixed bottom-6 right-6 z-[60] max-w-sm w-full transition-all duration-300 ${
          visible
            ? 'animate-fade-in-up opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div
          className={`bg-paper border-brutal border-ink rounded-brutal shadow-brutal-sm ${typeBorder(current.type)}`}
        >
          <div className="flex items-start gap-3 p-4">
            <div
              className={`w-2 h-full min-h-[2.5rem] flex-shrink-0 rounded-brutal-sm ${typeAccent(current.type)}`}
            />

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-caption uppercase tracking-wider text-ink-400">
                  {current.type.replace('risk_', '').replace('_', ' ')}
                </span>
                <button
                  onClick={dismiss}
                  className="font-mono text-caption text-ink-300 hover:text-accent transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              <p className="font-display text-body-sm font-semibold text-ink leading-tight">
                {current.title}
              </p>

              <p className="font-mono text-caption text-ink-500 leading-snug">{current.message}</p>

              <div className="flex items-center gap-3 pt-2">
                {current.actionable && !expanded && (
                  <button
                    onClick={() => {
                      dismiss();
                      openChat(current.message);
                    }}
                    className="font-mono text-caption text-accent hover:underline transition-colors"
                  >
                    Respond
                  </button>
                )}
                <button
                  onClick={dismiss}
                  className="font-mono text-caption text-ink-400 hover:text-ink transition-colors"
                >
                  Dismiss (7d)
                </button>
              </div>
            </div>
          </div>

          {expanded && (
            <div className="border-t border-ink-200 p-4 animate-fade-in">
              <div className="space-y-3">
                <p className="font-display text-body-sm font-semibold">Chat</p>
                <textarea
                  placeholder="Type a message..."
                  rows={3}
                  className="w-full bg-ink-50 border-brutal border-ink rounded-brutal-sm p-3 font-mono text-caption resize-none focus:outline-none focus:ring-2 focus:ring-ink"
                />
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-ink text-paper font-display text-body-sm font-semibold border-brutal border-ink rounded-brutal-sm shadow-brutal-sm hover:shadow-brutal transition-all active:translate-x-0.5 active:translate-y-0.5">
                    Send
                  </button>
                  <button
                    onClick={collapse}
                    className="font-mono text-caption text-ink-400 hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {visible && (
        <button
          onClick={dismiss}
          className="fixed inset-0 z-50 cursor-default"
          aria-hidden="true"
        />
      )}
    </>
  );
}
