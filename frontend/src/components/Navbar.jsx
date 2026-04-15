import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Clock } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Clock className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              QueueLess
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  to={user.role === 'vendor' ? '/vendor' : '/customer'} 
                  className="text-slate-600 hover:text-indigo-600 font-medium transition"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline-block font-medium">{user.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-medium">
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition shadow-sm"
                >
                  Join Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
