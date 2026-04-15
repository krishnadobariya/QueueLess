import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { 
  TrendingUp, Clock, Users, Download, Loader2, AlertCircle, 
  Calendar, CheckCircle2, LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsView = ({ queueId }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`/api/vendor/${queueId}/stats`);
        setStats(data);
      } catch (err) {
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    if (queueId) fetchStats();
  }, [queueId]);

  const handleExport = async () => {
    try {
      const response = await api.get(`/api/vendor/${queueId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `queue_report_${queueId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed');
    }
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  if (error) return <div className="p-12 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle /> {error}</div>;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Queue Insights</h2>
          <p className="text-slate-500">Data-driven performance overview for your business</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
        >
          <Download className="w-5 h-5" />
          <span>Export Excel Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center space-x-6"
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Wait Time</p>
            <p className="text-3xl font-black text-slate-900">{stats.averages.wait} <span className="text-lg font-bold text-slate-400">min</span></p>
          </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center space-x-6"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Today Served</p>
            <p className="text-3xl font-black text-slate-900">{stats.averages.total}</p>
          </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center space-x-6"
        >
          <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Service</p>
            <p className="text-3xl font-black text-slate-900">{stats.averages.service} <span className="text-lg font-bold text-slate-400">min</span></p>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Hourly Traffic Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Hourly Traffic
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">Last 24h</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.hourlyJoins}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#4f46e5' }}
                />
                <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={4} dot={{r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Counter Performance Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                Staff Performance
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">By Counter</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.counterPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                  {stats.counterPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
