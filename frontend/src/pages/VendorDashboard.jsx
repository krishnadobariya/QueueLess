import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'react-hot-toast';
import { Plus, Play, Pause, SkipForward, Users, Clock, Settings, Loader2, Store, Zap, Share2, Trash2, X, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ReviewsList from '../components/ReviewsList';
import AnalyticsView from '../components/AnalyticsView';
import QRCodeModal from '../components/QRCodeModal';

const VendorDashboard = () => {
  const [queues, setQueues] = useState([]);
  const [activeQueue, setActiveQueue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null);
  const [showCounterSettings, setShowCounterSettings] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState('Counter 1');
  const [newCounterName, setNewCounterName] = useState('');
  const [activeTab, setActiveTab] = useState('queues'); // 'queues', 'feedback', or 'analytics'
  const [newQueue, setNewQueue] = useState({ name: '', serviceTime: 10 });

  const { socket } = useSocket(activeQueue?._id);

  const fetchQueues = async () => {
    try {
      const { data } = await api.get('/api/vendor/vendor');
      setQueues(data);
      
      // Update active queue with the latest data from the list
      if (data.length > 0) {
        if (!activeQueue) {
          setActiveQueue(data[0]);
        } else {
          const updatedActive = data.find(q => q._id === activeQueue._id);
          if (updatedActive) setActiveQueue(updatedActive);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch queues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('queueUpdated', () => {
        // ## Phase 6: Public Display Mode
        // - [x] Frontend: Register `/display/:queueId` route
        // - [x] Frontend: Build `PublicDisplay.jsx` page
        // - [x] Frontend: Integrate Voice Alerts (Text-to-Speech)
        // - [x] Frontend: Add "Launch TV Display" to Vendor Dashboard
        // - [x] Verification: Test real-time synchronization and audio
        fetchQueues();
      });
    }
    return () => socket?.off('queueUpdated');
  }, [socket]);

  const handleCreateQueue = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/vendor', newQueue);
      setQueues([...queues, data]);
      setActiveQueue(data);
      setShowCreateModal(false);
      toast.success('Queue created successfully');
    } catch (error) {
      toast.error('Failed to create queue');
    }
  };

  const toggleStatus = async () => {
    const action = activeQueue.status === 'active' ? 'pause' : 'start';
    try {
      const { data } = await api.patch(`/api/vendor/${activeQueue._id}/${action}`);
      setActiveQueue(data);
      setQueues(queues.map(q => q._id === data._id ? data : q));
      toast.success(`Queue ${action === 'start' ? 'started' : 'paused'}`);
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const callNext = async () => {
    try {
      const { data } = await api.patch(`/api/vendor/${activeQueue._id}/next`, { counterName: selectedCounter });
      toast.success(data.message);
      fetchQueues();
    } catch (error) {
      toast.error('Failed to call next customer');
    }
  };

  const handleSkip = async () => {
    try {
      await api.patch(`/api/vendor/${activeQueue._id}/skip`, { counterName: selectedCounter });
      toast.success('Customer skipped/rescheduled');
      fetchQueues();
    } catch (error) {
      toast.error('Failed to skip customer');
    }
  };

  const handleAddCounter = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.patch(`/api/vendor/${activeQueue._id}/counters/add`, { counterName: newCounterName });
      setActiveQueue(data);
      setNewCounterName('');
      toast.success('Counter added');
      fetchQueues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add counter');
    }
  };

  const handleRemoveCounter = async (name) => {
    try {
      const { data } = await api.patch(`/api/vendor/${activeQueue._id}/counters/remove`, { counterName: name });
      setActiveQueue(data);
      if (selectedCounter === name) setSelectedCounter('Counter 1');
      toast.success('Counter removed');
      fetchQueues();
    } catch (error) {
      toast.error('Failed to remove counter');
    }
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vendor Dashboard</h1>
          <p className="text-slate-500">Manage your active queues and customers</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => window.open(`/display/${activeQueue?._id}`, '_blank')}
            disabled={!activeQueue}
            className="flex items-center space-x-2 bg-white text-slate-600 px-6 py-3 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Monitor className="w-5 h-5" />
            <span>TV Display</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
          >
            <Plus className="w-5 h-5" />
            <span>New Queue</span>
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <AnalyticsView queueId={activeQueue?._id} />
      ) : queues.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Queues Found</h3>
          <p className="text-slate-500 mb-6">Create your first queue to start accepting customers.</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="text-indigo-600 font-bold hover:underline"
          >
            Click here to create one
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Queue Control */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              layout
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeQueue?.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`w-3 h-3 rounded-full ${activeQueue?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">{activeQueue?.status}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowCounterSettings(true)}
                    className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition"
                    title="Manage Counters"
                  >
                    <Settings className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setShowQRModal(activeQueue)}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"
                    title="Share QR Code"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                  <button onClick={toggleStatus} className={`p-3 rounded-xl transition ${activeQueue?.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                    {activeQueue?.status === 'active' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              {/* Counter Selection Tabs */}
              <div className="flex flex-wrap gap-2 mb-8 p-1 bg-slate-50 rounded-2xl">
                {activeQueue?.counters?.map(counter => (
                  <button
                    key={counter.name}
                    onClick={() => setSelectedCounter(counter.name)}
                    className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition flex flex-col items-center ${selectedCounter === counter.name ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <span className="text-xs uppercase tracking-wider mb-1">{counter.name}</span>
                    <span className="text-xl">#{counter.currentToken || '—'}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-indigo-600 p-6 rounded-2xl text-white">
                  <p className="text-indigo-100 font-medium mb-1">Serving at {selectedCounter}</p>
                  <p className="text-5xl font-black">{activeQueue?.counters?.find(c => c.name === selectedCounter)?.currentToken || '—'}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <p className="text-slate-500 font-medium mb-1">Last Issued</p>
                  <p className="text-4xl font-black text-slate-900">{activeQueue?.lastToken || '0'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={callNext}
                  disabled={activeQueue?.status !== 'active'}
                  className="flex-1 py-6 bg-indigo-600 text-white rounded-2xl font-black text-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:grayscale"
                >
                  <SkipForward className="w-8 h-8" />
                  <span>CALL NEXT</span>
                </button>
                <button 
                  onClick={handleSkip}
                  disabled={activeQueue?.status !== 'active' || !activeQueue?.currentToken}
                  className="px-8 py-6 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition disabled:opacity-50"
                >
                  SKIP / ABSENT
                </button>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
               {[
                 { label: 'Avg. Wait', value: `${activeQueue?.serviceTime} min`, icon: <Clock /> },
                 { label: 'Today Served', value: activeQueue?.stats?.todayServed || '0', icon: <Users /> },
                 { label: 'Completion', value: `${activeQueue?.stats?.completionRate || 0}%`, icon: <Zap /> }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center space-x-4">
                   <div className="p-3 bg-slate-50 rounded-xl text-indigo-600">{stat.icon}</div>
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase">{stat.label}</p>
                     <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Queue Sidebar */}
          <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setActiveTab('queues')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'queues' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Queues
              </button>
              <button 
                onClick={() => setActiveTab('feedback')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'feedback' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Feedback
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Insights
              </button>
            </div>

            {activeTab === 'queues' ? (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 px-1 uppercase text-xs tracking-widest text-slate-400">Your Active Queues</h3>
                {queues.map(q => (
                  <button 
                    key={q._id}
                    onClick={() => setActiveQueue(q)}
                    className={`w-full text-left p-4 rounded-2xl border transition ${activeQueue?._id === q._id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <p className="font-bold text-slate-900">{q.name}</p>
                    <p className="text-sm text-slate-500">{q.status} • {q.serviceTime}m/user</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 overflow-hidden">
                 <h3 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest text-slate-400">Recent Reviews</h3>
                 <ReviewsList queueId={activeQueue?._id} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Create New Queue</h2>
              <form onSubmit={handleCreateQueue} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Queue Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Dr. Smith's Clinic"
                    value={newQueue.name}
                    onChange={(e) => setNewQueue({...newQueue, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Avg. Service Time (min)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newQueue.serviceTime}
                    onChange={(e) => setNewQueue({...newQueue, serviceTime: e.target.value})}
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Counter Settings Modal */}
      <AnimatePresence>
        {showCounterSettings && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Manage Counters</h2>
                <button onClick={() => setShowCounterSettings(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {activeQueue?.counters?.map(counter => (
                  <div key={counter.name} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">{counter.name}</span>
                    <button 
                      onClick={() => handleRemoveCounter(counter.name)}
                      className="text-red-500 hover:text-red-700 p-2"
                      disabled={activeQueue.counters.length <= 1}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddCounter} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="New counter name..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newCounterName}
                  onChange={(e) => setNewCounterName(e.target.value)}
                  required
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
                  Add
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <QRCodeModal 
            queue={showQRModal} 
            onClose={() => setShowQRModal(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendorDashboard;
