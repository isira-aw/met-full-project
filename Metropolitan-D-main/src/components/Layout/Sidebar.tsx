import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Zap,
  ClipboardList,
  CheckSquare,
  Activity,
  LogOut,
  FileBarChart, // New icon for Reports
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const Sidebar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const adminNavItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/employees", icon: Users, label: "Employees" },
    { to: "/generators", icon: Zap, label: "Generators" },
    { to: "/jobs", icon: ClipboardList, label: "Job Cards" },
    // { to: "/tasks", icon: CheckSquare, label: "All Tasks" },
    { to: "/reports", icon: FileBarChart, label: "Reports" }, // New Reports section
    { to: "/activity", icon: Activity, label: "Activity Logs" },
  ];

  // const employeeNavItems = [
  //   { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  //   { to: "/generators", icon: Zap, label: "Generators" },
  //   { to: "/my-tasks", icon: CheckSquare, label: "My Tasks" },
  //   { to: "/my-activity", icon: Activity, label: "My Activity" },
  // ];

  const employeeNavItems = [
    { to: "/my-tasks", icon: CheckSquare, label: "My Tasks" },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="https://github.com/isira-aw/Metropolitan-D/blob/main/images.png?raw=true"
              alt="settings"
              className="w-10 h-9 rounded-lg mb-5"
            />
            <div>
              <h1 className="text-xl font-bold">Metropolitan</h1>
              <p className="text-slate-400 text-sm">
                Employee Management System
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <p className="text-xs text-blue-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 ml-0 z-50 bg-transparent text-slate-900 p-3 rounded-lg  transition-colors md:hidden"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6 " />
          )}
        </button>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex bg-slate-900 text-white w-64 min-h-screen flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Sidebar */}
          <div className="fixed top-0 left-0 h-full bg-slate-900 text-white w-64 z-50 transform transition-transform duration-300 ease-in-out md:hidden">
            <div className="flex flex-col h-full">
              <SidebarContent />
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Layout wrapper component (optional - for easier integration)
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 md:ml-0 p-4 md:p-6">
        <div className="pt-16 md:pt-0">{children}</div>
      </main>
    </div>
  );
};