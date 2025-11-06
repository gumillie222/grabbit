// useRealtime.js
import { io } from 'socket.io-client';
import { useEffect, useRef, useState, useCallback } from 'react';

export function useRealtime(room, serverUrl) {
  const socketRef = useRef();
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState({
    items: [], // [{id, name, status: 'todo'|'done', price}]
    finances: { budget: 0, spent: 0 },
  });
  const [latencyMs, setLatencyMs] = useState(null);

  useEffect(() => {
    const s = io(serverUrl, {
      transports: ['websocket'],
      query: { room },
    });
    socketRef.current = s;

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('update', (payload) => {
      // Replace state with authoritative payload
      setState((prev) => ({ ...prev, ...payload }));
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
      s.disconnect();
    };
  }, [room, serverUrl]);

  const send = useCallback((nextState) => {
    socketRef.current?.emit('update', nextState);
  }, []);

  return { connected, state, setState, send, latencyMs };
}