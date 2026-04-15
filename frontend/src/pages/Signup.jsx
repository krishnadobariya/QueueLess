import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Loader2, Store, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
      toast.success('Account created successfully!');
      if (user.role === 'vendor') {
        navigate('/vendor');
      } else {
        navigate('/customer');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center pt-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
          <p className="text-slate-500">Join the QueueLess community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Full Name"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              placeholder="Email Address"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="password" 
              placeholder="Password"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'customer' })}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition ${
                formData.role === 'customer' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                  : 'border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              <Users className="w-6 h-6 mb-2" />
              <span className="font-semibold">Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'vendor' })}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition ${
                formData.role === 'vendor' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                  : 'border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              <Store className="w-6 h-6 mb-2" />
              <span className="font-semibold">Vendor</span>
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Get Started'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600">
            Already have an account? {' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
