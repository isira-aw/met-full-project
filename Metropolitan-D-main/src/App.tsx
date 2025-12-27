import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Generators } from './pages/Generators';
import { JobCards } from './pages/JobCards';
import { MyTasks } from './pages/MyTasks';
import { ActivityLogs } from './pages/ActivityLogs';
import { Report } from './pages/Report'; // Add the Report import
import { ForgotPasswordComponent } from './components/frogetpassword';
import { ResetPasswordComponent } from './components/Resetpasswordcom';

// Role-based redirect component
const RoleBasedRedirect: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on user role
  // Admins go to dashboard, Employees go to my-tasks
  return <Navigate to={isAdmin ? "/dashboard" : "/my-tasks"} replace />;
};

// Strict Admin-only route protection - Completely blocks employees
const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  
  // If not admin (i.e., employee), redirect to my-tasks with no access
  if (!isAdmin) {
    return <Navigate to="/my-tasks" replace />;
  }
  
  return <>{children}</>;
};

// Employee-only route protection - Blocks admins from employee routes
const EmployeeOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  
  // If admin tries to access employee route, redirect to dashboard
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// // Universal access route - Both admins and employees can access
// const UniversalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { loading } = useAuth();
  
//   if (loading) {
//     return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
//   }
  
//   return <>{children}</>;
// };

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - No authentication required */}
      <Route path="/login" element={<Login />} />
      <Route path="/register8f3b56f79e4a4f21a4c75b8f273617f8" element={<Register />} />
      
             {/* New password reset routes */}
        <Route path="/forgot-password" element={<ForgotPasswordComponent />} />
        <Route path="/reset-password" element={<ResetPasswordComponent />} />
        
      {/* Root redirect based on role */}
      <Route path="/" element={<RoleBasedRedirect />} />
      
      {/* Protected routes with Layout - Requires authentication */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        
        {/* ===== ADMIN-ONLY ROUTES ===== */}
        {/* These routes are completely blocked for employees */}
        
        <Route path="dashboard" element={
          <AdminOnlyRoute>
            <Dashboard />
          </AdminOnlyRoute>
        } />
        
        <Route path="employees" element={
          <AdminOnlyRoute>
            <Employees />
          </AdminOnlyRoute>
        } />
        
        <Route path="generators" element={
          <AdminOnlyRoute>
            <Generators />
          </AdminOnlyRoute>
        } />
        
        <Route path="jobs" element={
          <AdminOnlyRoute>
            <JobCards />
          </AdminOnlyRoute>
        } />
        
        <Route path="reports" element={
          <AdminOnlyRoute>
            <Report />
          </AdminOnlyRoute>
        } />
        
        <Route path="activity" element={
          <AdminOnlyRoute>
            <ActivityLogs />
          </AdminOnlyRoute>
        } />
        
        {/* Add more admin-only routes here as needed */}
        {/* 
        <Route path="settings" element={
          <AdminOnlyRoute>
            <Settings />
          </AdminOnlyRoute>
        } />
        */}
        
        {/* ===== EMPLOYEE-ONLY ROUTES ===== */}
        {/* These routes are only accessible to employees */}
        
        <Route path="my-tasks" element={
          <EmployeeOnlyRoute>
            <MyTasks />
          </EmployeeOnlyRoute>
        } />
        
        {/* HOW TO ADD NEW EMPLOYEE-ONLY ROUTES: */}
        {/* Uncomment and customize the route below for new employee pages */}
        {/* 
        <Route path="download" element={
          <EmployeeOnlyRoute>
            <Download />
          </EmployeeOnlyRoute>
        } />
        
        <Route path="my-profile" element={
          <EmployeeOnlyRoute>
            <MyProfile />
          </EmployeeOnlyRoute>
        } />
        
        <Route path="my-schedule" element={
          <EmployeeOnlyRoute>
            <MySchedule />
          </EmployeeOnlyRoute>
        } />
        */}
        
        {/* ===== UNIVERSAL ROUTES (Optional) ===== */}
        {/* These routes can be accessed by both admins and employees */}
        {/* Uncomment if you need routes accessible to all authenticated users */}
        {/* 
        <Route path="help" element={
          <UniversalRoute>
            <Help />
          </UniversalRoute>
        } />
        
        <Route path="notifications" element={
          <UniversalRoute>
            <Notifications />
          </UniversalRoute>
        } />
        */}
        
        {/* ===== CATCH-ALL ROUTE ===== */}
        {/* Any unmatched route redirects based on user role */}
        <Route path="*" element={<RoleBasedRedirect />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

/* 
===========================================
HOW TO ADD NEW ROUTES - QUICK REFERENCE:
===========================================

1. FOR ADMIN-ONLY ROUTES:
   - Add to the "ADMIN-ONLY ROUTES" section
   - Wrap with <AdminOnlyRoute>
   - Example:
   <Route path="new-admin-page" element={
     <AdminOnlyRoute>
       <NewAdminPage />
     </AdminOnlyRoute>
   } />

2. FOR EMPLOYEE-ONLY ROUTES:
   - Add to the "EMPLOYEE-ONLY ROUTES" section  
   - Wrap with <EmployeeOnlyRoute>
   - Example:
   <Route path="download" element={
     <EmployeeOnlyRoute>
       <Download />
     </EmployeeOnlyRoute>
   } />

3. FOR UNIVERSAL ROUTES (both can access):
   - Add to the "UNIVERSAL ROUTES" section
   - Wrap with <UniversalRoute>
   - Example:
   <Route path="help" element={
     <UniversalRoute>
       <Help />
     </UniversalRoute>
   } />

SECURITY GUARANTEE:
- Employees CANNOT access admin routes (will be redirected to /my-tasks)
- Admins CANNOT access employee-only routes (will be redirected to /dashboard)
- All routes require authentication via ProtectedRoute wrapper
- Unknown routes redirect based on user role
*/