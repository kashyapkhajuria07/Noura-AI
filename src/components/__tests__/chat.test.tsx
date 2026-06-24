import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatProvider, useChat } from '@/components/chat/ChatWrapper';

function TestConsumer() {
  const { isOpen, openChat, closeChat } = useChat();
  return (
    <div>
      <span data-testid="is-open">{isOpen ? 'true' : 'false'}</span>
      <button onClick={() => openChat()}>Open Chat</button>
      <button onClick={closeChat}>Close Chat</button>
    </div>
  );
}

describe('ChatProvider', () => {
  it('provides context with default closed state', () => {
    render(
      <ChatProvider>
        <TestConsumer />
      </ChatProvider>
    );
    expect(screen.getByTestId('is-open').textContent).toBe('false');
  });

  it('throws when useChat is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useChat must be used within ChatProvider');
    consoleSpy.mockRestore();
  });
});
