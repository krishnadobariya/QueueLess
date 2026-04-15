import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="flex flex-col items-center pt-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-3xl"
      >
        <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6 inline-block">
          The future of queue management is here
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
          Say Goodbye to <span className="text-indigo-600">Physical Waiting Lines</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 leading-relaxed">
          QueueLess helps businesses manage customer flow in real-time. Join queues remotely, 
          track your position, and get notified when it's your turn.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link 
            to="/signup" 
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            Get Started For Free
          </Link>
          <Link 
            to="/login" 
            className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 transition"
          >
            Sign In
          </Link>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl mt-8">
        {[
          {
            icon: <Clock className="w-10 h-10 text-indigo-500" />,
            title: "Join Remotely",
            description: "No need to stand in line. Join the queue from your home or car using your phone."
          },
          {
            icon: <Zap className="w-10 h-10 text-indigo-500" />,
            title: "Live Tracker",
            description: "See your exact position and estimated wait time update in real-time."
          },
          {
            icon: <ShieldCheck className="w-10 h-10 text-indigo-500" />,
            title: "Smart Alerts",
            description: "Receive notifications when your turn is near so you never miss your spot."
          }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition"
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-slate-600">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Home;
