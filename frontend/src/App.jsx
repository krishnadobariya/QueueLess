import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VendorDashboard from './pages/VendorDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import QuickJoin from './pages/QuickJoin';
import PublicDisplay from './pages/PublicDisplay';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/q/:queueId" element={<QuickJoin />} />
              <Route path="/display/:queueId" element={<PublicDisplay />} />
              
              <Route 
                path="/vendor" 
                element={
                  <ProtectedRoute role="vendor">
                    <VendorDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/customer" 
                element={
                  <ProtectedRoute role="customer">
                    <CustomerDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Toaster position="bottom-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
