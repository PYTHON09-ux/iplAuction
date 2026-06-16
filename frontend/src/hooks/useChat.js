import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const CHAT_URL = import.meta.env.VITE_CHAT_URL || 'https://iplauction-production-ee83.up.railway.app';

const GUEST_COLORS = [
    '#38d9f5', '#16d975', '#f5a623', '#c084fc',
    '#f87171', '#34d399', '#60a5fa', '#fbbf24',
    '#a78bfa', '#fb923c', '#4ade80', '#e879f9',
];

export function useChatColors() {
    return GUEST_COLORS;
}

export default function useChat({ token, guestName }) {
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]); // [{ name, color }]
    const [viewers, setViewers] = useState(0);
    const [status, setStatus] = useState('connecting');
    const [myColor, setMyColor] = useState(GUEST_COLORS[0]);
    const [myName, setMyName] = useState(guestName || '');
    const [error, setError] = useState(null);

    const socketRef = useRef(null);
    const typingTimer = useRef(null);

    useEffect(() => {
        if (!token) return;

        const socket = io(CHAT_URL + '/chat', {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1500,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setStatus('connected');
            setError(null);
            socket.emit('join', { token, name: guestName });
        });

        socket.on('disconnect', () => setStatus('disconnected'));
        socket.on('connect_error', () => {
            setStatus('error');
            setError('Could not connect to chat server.');
        });

        socket.on('joined', ({ name, color, viewers: v }) => {
            setMyName(name);
            setMyColor(color);
            setViewers(v);
        });

        socket.on('history', (msgs) => {
            setMessages(msgs.map(m => ({
                ...m,
                color: GUEST_COLORS[m.colorIndex] || GUEST_COLORS[0],
            })));
        });

        socket.on('message', (msg) => {
            setMessages(prev => [
                ...prev.slice(-199), // keep max 200 in memory
                { ...msg, color: GUEST_COLORS[msg.colorIndex] || GUEST_COLORS[0] },
            ]);
            // Remove from typing when they send
            setTypingUsers(prev => prev.filter(u => u.name !== msg.sender));
        });

        socket.on('system', ({ text, viewers: v }) => {
            setViewers(v ?? 0);
            setMessages(prev => [
                ...prev.slice(-199),
                {
                    _id: `sys-${Date.now()}`,
                    senderType: 'system',
                    text,
                    createdAt: new Date().toISOString(),
                },
            ]);
        });

        socket.on('typing', ({ name, colorIndex, typing }) => {
            const color = GUEST_COLORS[colorIndex] || GUEST_COLORS[0];
            setTypingUsers(prev => {
                const without = prev.filter(u => u.name !== name);
                return typing ? [...without, { name, color }] : without;
            });
        });

        socket.on('error', ({ message }) => {
            setError(message);
            setTimeout(() => setError(null), 3000);
        });

        return () => {
            socket.disconnect();
        };
    }, [token, guestName]);

    /* ── send ── */
    const send = useCallback((text) => {
        if (!socketRef.current || !text?.trim()) return;
        socketRef.current.emit('message', { text: text.trim() });
        // Stop typing indicator immediately
        socketRef.current.emit('typing', { typing: false });
        clearTimeout(typingTimer.current);
    }, []);

    /* ── setTyping (debounced stop) ── */
    const setTyping = useCallback((isTyping) => {
        if (!socketRef.current) return;
        socketRef.current.emit('typing', { typing: isTyping });
        if (isTyping) {
            clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => {
                socketRef.current?.emit('typing', { typing: false });
            }, 2500);
        }
    }, []);

    return {
        messages,
        typingUsers,
        viewers,
        status,
        myColor,
        myName,
        error,
        send,
        setTyping,
    };
}