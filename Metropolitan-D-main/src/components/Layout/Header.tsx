import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-slate-900 ml-10">
            Welcome back, {user?.name.split(' ')[0]}!
          </h2>
        </div>

        <div className="flex items-center space-x-4">

          
          <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            {/* <Bell className="w-5 h-5" /> */}
            {/* <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span> */}
          </button>
        </div>
      </div>
    </header>
  );
};