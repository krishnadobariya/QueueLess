import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL;

export const useSocket = (queueId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (queueId) {
        newSocket.emit('joinQueueRoom', queueId);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (queueId) {
        newSocket.emit('leaveQueueRoom', queueId);
      }
      newSocket.close();
    };
  }, [queueId]);

  return { socket, isConnected };
};
