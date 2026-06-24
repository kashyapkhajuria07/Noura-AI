'use client';

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { ChatModal } from './ChatModal';

interface ChatContextValue {
  openChat: (message?: string) => void;
  closeChat: () => void;
  isOpen: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();

  const openChat = useCallback((message?: string) => {
    setInitialMessage(message);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setInitialMessage(undefined);
  }, []);

  return (
    <ChatContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
      {isOpen && <ChatModal onClose={closeChat} initialMessage={initialMessage} />}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
