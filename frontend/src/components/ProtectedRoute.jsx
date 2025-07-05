// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { user, isLoading } = useSelector((state) => state.auth);

  // If still loading, you might want to show a spinner or null
  // before deciding to redirect. For simplicity, we'll assume
  // user state is quickly determined.
  if (isLoading) {
    return <div>Loading authentication...</div>; // Or a spinner component
  }

  // If user is authenticated, render the child routes
  // Outlet renders the nested route's component
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;