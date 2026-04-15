import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'react-hot-toast';
import { Search, MapPin, Clock, LogOut, ArrowRight, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewModal from '../components/ReviewModal';

const CustomerDashboard = () => {
  const [queues, setQueues] = useState([]);
  const [myStatus, setMyStatus] = useState({ joined: false });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { socket } = useSocket(myStatus.joined ? myStatus.entry.queueId._id : null);

  const fetchData = async () => {
    try {
      const [qRes, sRes] = await Promise.all([
        api.get('/api/customer/queues'),
        api.get('/api/customer/status')
      ]);
      setQueues(qRes.data);
      setMyStatus(sRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('queueUpdated', () => {
        fetchData();
      });

      socket.on('userCalled', (data) => {
        // We could check if it's the current user here, but user id is in context
        // The status refresh will handle it regardless
        fetchData();
      });
    }
    return () => {
      socket?.off('queueUpdated');
      socket?.off('userCalled');
    };
  }, [socket]);

  const joinQueue = async (id) => {
    try {
      await api.post(`/api/customer/queues/${id}/join`);
      toast.success('Joined queue successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join queue');
    }
  };

  const leaveQueue = async () => {
    try {
      await api.delete(`/api/customer/queues/${myStatus.entry.queueId._id}/leave`);
      toast.success('Left queue');
      fetchData();
    } catch (error) {
      toast.error('Failed to leave queue');
    }
  };

  const filteredQueues = queues.filter(q => 
    q.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Active Status Header */}
      <AnimatePresence>
        {myStatus.joined && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            {myStatus.entry.status === 'completed' ? (
              <div className="bg-white rounded-[2.5rem] p-8 border border-indigo-100 shadow-xl shadow-indigo-50 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                    <UserCheck className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Service Completed!</h2>
                  <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                    Your visit to <strong>{myStatus.entry.queueId.name}</strong> is finished. How was your experience?
                  </p>
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                  >
                    Rate your experience
                  </button>
                </div>
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
              </div>
            ) : (
              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                      <p className="text-indigo-100 font-medium mb-1">
                        {myStatus.isCalled ? "It's your turn!" : "You are in queue for"}
                      </p>
                      <h2 className="text-2xl font-bold mb-4">{myStatus.entry.queueId.name}</h2>
                      
                      {myStatus.isCalled ? (
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                            <p className="text-sm uppercase tracking-widest text-indigo-200 mb-1">Proceed to</p>
                            <p className="text-3xl font-black">{myStatus.counterName}</p>
                            <p className="mt-2 text-indigo-100 flex items-center gap-2">
                              <UserCheck className="w-5 h-5 text-emerald-400" />
                              Token #{myStatus.entry.tokenNumber}
                            </p>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-4xl font-black">{myStatus.entry.position}</p>
                              <p className="text-xs uppercase font-bold tracking-widest text-indigo-200">Position</p>
                            </div>
                            <div className="w-px h-10 bg-indigo-400"></div>
                            <div className="text-center">
                              <p className="text-4xl font-black">{myStatus.estimatedWaitTime} <span className="text-lg">m</span></p>
                              <p className="text-xs uppercase font-bold tracking-widest text-indigo-200">Wait Time</p>
                            </div>
                        </div>
                      )}
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                      <button 
                        onClick={fetchData} 
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-6 py-2 rounded-xl font-bold transition"
                      >
                        Refresh Status
                      </button>
                      <button 
                        onClick={leaveQueue}
                        className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-xl font-bold transition"
                      >
                        Leave Queue
                      </button>
                  </div>
                </div>
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20"></div>
              </div>
            )}
            
            {!myStatus.isCalled && myStatus.entry.status === 'waiting' && myStatus.entry.position <= 3 && myStatus.entry.position > 0 && (
              <motion.div 
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center space-x-3 text-amber-700 font-bold"
              >
                <AlertCircle className="w-6 h-6" />
                <span>Get ready! You are almost next in line.</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Browse */}
      {!myStatus.joined && (
        <>
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Join a Queue</h1>
            <p className="text-slate-500">Find shops, clinics, or services nearby</p>
          </div>

          <div className="relative mb-12">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search for a business or service..."
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-3xl text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid gap-6">
            {filteredQueues.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-slate-400 text-lg italic">No available queues found matching "{search}"</p>
              </div>
            ) : (
              filteredQueues.map(queue => (
                <motion.div 
                  key={queue._id}
                  whileHover={{ y: -4 }}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between items-center gap-6"
                >
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{queue.name}</h3>
                      <div className="flex flex-col space-y-2 mt-2">
                        <div className="flex items-center space-x-4 text-slate-500 font-medium text-sm">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{queue.serviceTime}m service</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {queue.counters?.filter(c => c.currentToken > 0).map(counter => (
                            <span key={counter.name} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                              {counter.name}: #{counter.currentToken}
                            </span>
                          ))}
                          {queue.counters?.every(c => c.currentToken === 0) && (
                            <span className="text-slate-400 text-xs italic">No active tokens</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => joinQueue(queue._id)}
                    className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 group"
                  >
                    <span>JOIN QUEUE</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <ReviewModal 
            entry={myStatus.entry}
            onClose={() => setShowReviewModal(false)}
            onSuccess={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDashboard;
