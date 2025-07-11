// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

const ProtectedRoute = () => {
  // We use `isAuthenticated` from the authSlice to determine access.
  // `loading` can be used to show a spinner while authentication state is being determined,
  // preventing a premature redirect.
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  // If the authentication state is still loading (e.g., initial app load, checking token),
  // we return null or a loading spinner to prevent flicker or incorrect redirection.
  if (loading) {
    return <CircularProgress /> ; // Or <CircularProgress /> or <div>Loading authentication...</div>
  }

  // If the user is NOT authenticated, redirect them to the login page.
  // The key here is that this component ONLY redirects and does NOT render
  // any "Not authorized" text or other UI directly.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If the user IS authenticated, render the nested routes.
  return <Outlet />;
};

export default ProtectedRoute;