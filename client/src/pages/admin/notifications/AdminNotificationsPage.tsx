import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Archive, Filter, AlertCircle, Info, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { apiClient } from '../../../api/axios';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'booking' | 'lead' | 'revenue' | 'system';
  is_read: boolean;
  priority: 'high' | 'normal' | 'low';
  time: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'high'>('all');

  useEffect(() => {
    const fetchLiveNotifications = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/notifications/admin-feed');
        if (Array.isArray(res.data)) {
          const mapped: NotificationItem[] = res.data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.title.toLowerCase().includes('booking') ? 'booking' : n.title.toLowerCase().includes('visit') ? 'lead' : n.title.toLowerCase().includes('payment') ? 'revenue' : 'system',
            is_read: n.is_read,
            priority: n.title.includes('⚡') || n.title.toLowerCase().includes('vip') || n.title.toLowerCase().includes('payment') ? 'high' : 'normal',
            time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.warn('Could not fetch notifications feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveNotifications();
  }, []);


  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    apiClient.put('/notifications/mark-all-read').catch(() => null);
  };

  const toggleRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: !n.is_read } : n));
    apiClient.put(`/notifications/${id}/read`).catch(() => null);
  };

  const filtered = notifications.filter(n => {
    if (filterTab === 'unread') return !n.is_read;
    if (filterTab === 'high') return n.priority === 'high';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Admin Notification Center</h1>
          <p className="text-sm text-slate-400">Real-time alerts across bookings, high-value leads, commission requests & system logs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition border border-slate-700"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filterTab === 'all' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterTab('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filterTab === 'unread' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Unread ({notifications.filter(n => !n.is_read).length})
        </button>
        <button
          onClick={() => setFilterTab('high')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filterTab === 'high' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          High Priority ({notifications.filter(n => n.priority === 'high').length})
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleRead(item.id)}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4 ${
              item.is_read
                ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                : 'bg-slate-900 border-indigo-500/30 text-white shadow-glow-primary/5'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                item.type === 'booking' ? 'bg-emerald-500/10 text-emerald-400' :
                item.type === 'revenue' ? 'bg-amber-500/10 text-amber-400' :
                item.type === 'lead' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {item.type === 'booking' && <Calendar className="w-5 h-5" />}
                {item.type === 'revenue' && <DollarSign className="w-5 h-5" />}
                {item.type === 'lead' && <Bell className="w-5 h-5" />}
                {item.type === 'system' && <Info className="w-5 h-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  {item.priority === 'high' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-400 uppercase">High Priority</span>
                  )}
                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.message}</p>
                <span className="text-[10px] text-slate-500 mt-2 block">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
