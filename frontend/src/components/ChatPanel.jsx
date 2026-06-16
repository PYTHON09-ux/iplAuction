import { useState, useRef, useEffect } from 'react';
import useChat from '../hooks/useChat';

const GUEST_COLORS = [
  '#38d9f5', '#16d975', '#f5a623', '#c084fc',
  '#f87171', '#34d399', '#60a5fa', '#fbbf24',
  '#a78bfa', '#fb923c', '#4ade80', '#e879f9',
];

export default function ChatPanel({ token, guestName }) {
  const { messages, typingUsers, viewers, status, myColor, myName, error, send, setTyping } = useChat({ token, guestName });
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const prevMsgCount = useRef(0);
  useEffect(() => {
    prevMsgCount.current = messages.length;
  }, [messages]);
  
  const handleSend = () => {
    if (!input.trim()) return;
    send(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0c1220', borderLeft: '1px solid rgba(255,255,255,0.07)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#eaf0ff' }}>Live Chat</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: status === 'connected' ? '#16d975' : '#f04a4a', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#3a4f6e' }}>{viewers} watching</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.map((msg) => {
          if (msg.senderType === 'system') {
            return (
              <div key={msg._id} style={{ textAlign: 'center', fontSize: 11, color: '#3a4f6e', padding: '2px 0' }}>
                {msg.text}
              </div>
            );
          }
          const isMe = msg.sender === myName;
          const color = GUEST_COLORS[msg.colorIndex] || '#7a90b8';
          return (
            <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{isMe ? 'You' : msg.sender}</span>
                <span style={{ fontSize: 10, color: '#3a4f6e' }}>{formatTime(msg.createdAt)}</span>
              </div>
              <div style={{
                maxWidth: '85%', padding: '6px 10px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isMe ? `${color}18` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isMe ? color + '30' : 'rgba(255,255,255,0.07)'}`,
                fontSize: 13, color: '#eaf0ff', lineHeight: 1.45, wordBreak: 'break-word',
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{ fontSize: 11, color: '#3a4f6e', fontStyle: 'italic' }}>
            {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error toast */}
      {error && (
        <div style={{ margin: '0 12px', padding: '6px 10px', background: 'rgba(240,74,74,0.12)', border: '1px solid rgba(240,74,74,0.25)', borderRadius: 8, fontSize: 12, color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setTyping(e.target.value.length > 0); }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTyping(false)}
          placeholder="Say something…"
          maxLength={400}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 12px', color: '#eaf0ff', fontSize: 13, outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || status !== 'connected'}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: input.trim() && status === 'connected' ? '#16d975' : 'rgba(255,255,255,0.07)',
            color: input.trim() && status === 'connected' ? '#06090f' : '#3a4f6e',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'background .15s',
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}