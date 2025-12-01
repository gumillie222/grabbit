// useRealtime.js
import { io } from 'socket.io-client';
import { useEffect, useRef, useState, useCallback } from 'react';

export function useRealtime(room, serverUrl, userId = null) {
  const socketRef = useRef();
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState({
    items: [], // [{id, name, status: 'todo'|'done', price}]
    finances: { budget: 0, spent: 0 },
  });
  const [latencyMs, setLatencyMs] = useState(null);

  useEffect(() => {
    if (!serverUrl) return; // Don't connect if no server URL

    const query = { room };
    if (userId) {
      query.userId = userId;
    }

    const s = io(serverUrl, {
      transports: ['websocket'],
      query,
    });
    socketRef.current = s;

    s.on('connect', () => {
      setConnected(true);
      console.log('[Realtime] Connected', { room, userId });
    });
    s.on('disconnect', () => {
      setConnected(false);
      console.log('[Realtime] Disconnected');
    });

    s.on('update', (payload) => {
      // Replace state with authoritative payload
      setState((prev) => ({ ...prev, ...payload }));
    });

    // User-based event updates
    s.on('event:update', (payload) => {
      console.log('[Realtime] Event update received', payload);
      // Handle event updates from other users
      // You can customize this based on your needs
    });

    // Friend-related events
    s.on('friend:request', (payload) => {
      console.log('[Realtime] Friend request received', payload);
      // This will be handled by ProfileScreen
    });

    s.on('friend:accepted', (payload) => {
      console.log('[Realtime] Friend request accepted', payload);
    });

    s.on('friend:declined', (payload) => {
      console.log('[Realtime] Friend request declined', payload);
    });

    s.on('friend:presence', (payload) => {
      console.log('[Realtime] Friend presence update', payload);
    });

    const onPong = ({ clientTs }) => {
      const rtt = Date.now() - clientTs;
      setLatencyMs(Math.round(rtt / 2)); // rough one-way latency
    };

    s.on('pong', onPong);
    const id = setInterval(() => s.emit('ping', Date.now()), 1000);

    return () => {
      clearInterval(id);
      s.off('pong', onPong);
      s.off('event:update');
      s.off('friend:request');
      s.off('friend:accepted');
      s.off('friend:declined');
      s.off('friend:presence');
      s.disconnect();
    };
  }, [room, serverUrl, userId]);

  const send = useCallback((nextState) => {
    socketRef.current?.emit('update', nextState);
  }, []);

  const sendEventUpdate = useCallback((eventId, data, targetUserIds) => {
    socketRef.current?.emit('event:update', {
      eventId,
      data,
      targetUserIds,
    });
  }, []);

  return { connected, state, setState, send, sendEventUpdate, latencyMs };
}