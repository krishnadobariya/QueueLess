import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Volume2, Users, Clock, Loader2, ArrowRight } from 'lucide-react';

const PublicDisplay = () => {
    const { queueId } = useParams();
    const [queue, setQueue] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [lastCall, setLastCall] = useState(null);
    const [recentCalls, setRecentCalls] = useState([]);
    const { socket } = useSocket(queueId);

    const fetchQueue = async () => {
        try {
            const { data } = await api.get(`/api/customer/queues/${queueId}`);
            setQueue(data);
        } catch (error) {
            console.error('Failed to fetch queue details');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [queueId]);

    useEffect(() => {
        if (socket) {
            socket.on('queueUpdated', fetchQueue);
            socket.on('userCalled', (data) => {
                const call = {
                    tokenNumber: data.tokenNumber,
                    counterName: data.counterName,
                    timestamp: new Date()
                };
                setLastCall(call);
                setRecentCalls(prev => [call, ...prev].slice(0, 5));
                if (isAudioEnabled) {
                    announce(data.tokenNumber, data.counterName);
                }
                fetchQueue();
            });
        }
        return () => {
            socket?.off('queueUpdated');
            socket?.off('userCalled');
        };
    }, [socket, isAudioEnabled]);

    const announce = (token, counter) => {
        const text = `Now calling token number ${token} at ${counter}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    if (isLoading) return <div className="h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin" /></div>;

    if (!isAudioEnabled) {
        return (
            <div className="h-screen bg-indigo-600 flex items-center justify-center p-6 bg-[linear-gradient(45deg,rgba(79,70,229,1)_0%,rgba(99,102,241,1)_100%)]">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl"
                >
                    <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-8">
                        <Monitor className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4">{queue?.name}</h1>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        To enable voice announcements and real-time updates, please click the button below to start the public display.
                    </p>
                    <button 
                        onClick={() => setIsAudioEnabled(true)}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex items-center justify-center space-x-3"
                    >
                        <Volume2 className="w-6 h-6" />
                        <span>START DISPLAY</span>
                    </button>
                    <p className="mt-6 text-xs text-slate-400 uppercase tracking-widest font-bold">Recommended for TV screens</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-50 overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-12 py-8 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{queue?.name}</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-sm mt-1">{queue?.vendorId.name}</p>
                </div>
                <div className="flex items-center space-x-8">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Queue Status</p>
                        <p className={`text-xl font-black uppercase ${queue?.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {queue?.status}
                        </p>
                    </div>
                    <div className="w-px h-12 bg-slate-100"></div>
                    <div className="text-indigo-600">
                        <Volume2 className="w-8 h-8 opacity-50" />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-12 grid grid-cols-12 gap-12">
                {/* Current Active Call */}
                <div className="col-span-8 flex flex-col">
                    <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-6">Now Calling</h2>
                    <motion.div 
                        key={lastCall?.tokenNumber}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center p-12 text-center relative overflow-hidden"
                    >
                        {lastCall ? (
                            <>
                                <motion.div 
                                    animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 bg-indigo-600"
                                />
                                <span className="relative z-10 text-indigo-600 font-black text-[12rem] leading-none mb-6">
                                    #{lastCall.tokenNumber}
                                </span>
                                <div className="relative z-10 flex items-center space-x-4">
                                    <span className="text-slate-400 text-3xl font-bold uppercase tracking-widest">Please proceed to</span>
                                    <span className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-4xl font-black shadow-lg">
                                        {lastCall.counterName}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-slate-300">
                                <Monitor className="w-32 h-32 mb-6 opacity-30" />
                                <p className="text-4xl font-bold">Waiting for next customer...</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Counter Overview */}
                <div className="col-span-4 flex flex-col">
                    <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-6">All Counters</h2>
                    <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 overflow-y-auto">
                        <div className="space-y-6">
                            {queue?.counters?.map((counter) => (
                                <div key={counter.name} className={`p-6 rounded-3xl border-2 transition ${lastCall?.counterName === counter.name ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 bg-slate-50'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-black text-slate-700">{counter.name}</span>
                                        <span className={`text-4xl font-black ${counter.currentToken > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                                            {counter.currentToken > 0 ? `#${counter.currentToken}` : '—'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer / Ticker */}
            <footer className="bg-slate-900 py-6 px-12 flex justify-between items-center">
                <div className="flex items-center space-x-8 text-slate-400 font-bold uppercase tracking-widest text-sm">
                    <span className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>Total Waiting: {queue?.lastToken - queue?.currentToken || 0}</span>
                    </span>
                    <span className="flex items-center space-x-2 text-emerald-400">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                        <span>Live Connection Active</span>
                    </span>
                </div>
                <p className="text-slate-500 font-bold">Powered by QueueLess</p>
            </footer>
        </div>
    );
};

export default PublicDisplay;
