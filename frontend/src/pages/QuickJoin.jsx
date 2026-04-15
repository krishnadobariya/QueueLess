import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Clock, UserPlus, LogIn, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const QuickJoin = () => {
  const { queueId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [queue, setQueue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQueueDetails = async () => {
      try {
        const { data } = await api.get(`/api/customer/queues/${queueId}`);
        setQueue(data);
      } catch (error) {
        toast.error('Queue not found');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQueueDetails();
  }, [queueId, navigate]);

  const handleJoin = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/q/${queueId}` } });
      return;
    }

    try {
      await api.post(`/api/customer/queues/${queue._id}/join`);
      toast.success(`Joined ${queue.name} successfully!`);
      navigate('/customer');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join queue');
      if (error.response?.status === 400 && error.response?.data?.message.includes('already')) {
        navigate('/customer');
      }
    }
  };

  if (isLoading || authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-md mx-auto pt-12">
        <Link to="/" className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 mb-8 transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
        </Link>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl"
        >
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                    <Clock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{queue?.name}</h2>
                <p className="text-slate-500">{queue?.vendorId.name}</p>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                    <span className="text-slate-500">Service Time</span>
                    <span className="font-bold text-slate-900">{queue?.serviceTime} mins</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                    <span className="text-slate-500">Queue Status</span>
                    <span className={`font-bold capitalize ${queue?.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {queue?.status}
                    </span>
                </div>
            </div>

            {user ? (
                <button 
                    onClick={handleJoin}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2"
                >
                    <UserPlus className="w-6 h-6" />
                    <span>Join Queue Now</span>
                </button>
            ) : (
                <div className="space-y-3">
                    <p className="text-center text-sm text-slate-500 mb-4">You need to be logged in to join this queue</p>
                    <Link 
                        to="/login"
                        state={{ from: `/q/${queueId}` }}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
                    >
                        <LogIn className="w-6 h-6" />
                        <span>Login to Join</span>
                    </Link>
                    <Link 
                        to="/signup"
                        state={{ from: `/q/${queueId}` }}
                        className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-50 transition flex items-center justify-center"
                    >
                        Create an Account
                    </Link>
                </div>
            )}
        </motion.div>
    </div>
  );
};

export default QuickJoin;
