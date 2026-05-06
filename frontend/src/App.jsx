import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import RequestAccess from './pages/Auth/RequestAccess';
import { Toaster } from 'react-hot-toast';

// Governance & Layout Components
import MainLayout from './components/Layout/MainLayout';
import AlertCenter from './components/governance/AlertCenter';
import NotificationSettings from './components/governance/NotificationSettings';
import ApprovalQueue from './components/governance/ApprovalQueue';
import AdminDashboard from './components/governance/AdminDashboard';
import AccessRequestForm from './components/access/AccessRequestForm';
import AccessRequestsList from './components/access/AccessRequestsList';
import IntelligenceList from './components/records/IntelligenceList';
import IntelligenceDetail from './components/records/IntelligenceDetail';
import DealsPipelineView from './components/records/DealsPipelineView';
import UserDashboard from './components/dashboard/UserDashboard';
import CriticalUpdateCards from './components/governance/CriticalUpdateCards';

import './styles/index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return (
    <MainLayout>
      <CriticalUpdateCards />
      {children}
    </MainLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/request-access" element={<AccessRequestForm />} />

            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/alerts" 
              element={
                <ProtectedRoute>
                  <AlertCenter />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/governance/approvals" 
              element={
                <ProtectedRoute>
                  <ApprovalQueue />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/access-requests" 
              element={
                <ProtectedRoute>
                  <AccessRequestsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/intelligence" 
              element={
                <ProtectedRoute>
                  <IntelligenceList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/intelligence/:id" 
              element={
                <ProtectedRoute>
                  <IntelligenceDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pipeline" 
              element={
                <ProtectedRoute>
                  <DealsPipelineView />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'glass',
              style: {
                background: 'rgba(15, 23, 42, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px'
              }
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

