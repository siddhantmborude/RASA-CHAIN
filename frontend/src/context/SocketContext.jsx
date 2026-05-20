import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://rasa-chain-backend.onrender.com' : '/');
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for real-time batch events
    newSocket.on('batch:created', (data) => {
      if (!isAuthenticated) return;
      const notif = {
        id: Date.now(),
        type: 'batch_created',
        title: 'New Batch Created',
        message: `${data.herbName} batch created by ${data.createdBy}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      toast.custom((t) => (
        <div className={`glass-card p-4 flex items-start gap-3 max-w-sm ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 node-pulse" />
          <div>
            <p className="font-medium text-white text-sm">{notif.title}</p>
            <p className="text-gray-400 text-xs mt-0.5">{notif.message}</p>
          </div>
        </div>
      ));
    });

    newSocket.on('batch:updated', (data) => {
      if (!isAuthenticated) return;
      const notif = {
        id: Date.now(),
        type: 'batch_updated',
        title: 'Batch Stage Updated',
        message: `Batch ${data.batchId} moved to ${data.stage}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider value={{ socket, isConnected, notifications, unreadCount, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
