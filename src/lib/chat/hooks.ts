'use client';

import { useState, useCallback } from 'react';

export function useChatModal() {
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

  return { isOpen, initialMessage, openChat, closeChat };
}
