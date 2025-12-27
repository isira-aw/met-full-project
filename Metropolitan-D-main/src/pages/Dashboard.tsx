// Simplified Dashboard Component without Reports
// File: src/pages/Dashboard.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Zap,
  ClipboardList,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import {
  MiniJobCardResponse,
  LogResponse,
} from "../types/api";
import { LoadingSpinner } from "../components/UI/LoadingSpinner";
import { StatusBadge } from "../components/UI/StatusBadge";
import { format } from "date-fns-tz";

interface DashboardStats {
  totalEmployees: number;
  totalGenerators: number;
  todayJobCards: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalGenerators: 0,
    todayJobCards: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState<MiniJobCardResponse[]>([]);
  const [recentActivity, setRecentActivity] = useState<LogResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const getSriLankanToday = useCallback(() => {
    return format(new Date(), "yyyy-MM-dd", {
      timeZone: "Asia/Colombo",
    });
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get today's date in YYYY-MM-DD format
      const today = getSriLankanToday();

      // Load admin dashboard data
      const [employeesRes, generatorsRes, todayJobCardsRes, tasksRes, logsRes] =
        await Promise.all([
          apiService.getAllEmployees(),
          apiService.getAllGeneratorsCount(),
          apiService.getJobCardsByDate(today),
          apiService.getAllMiniJobCards(),
          apiService.getRecentLogs(24),
        ]);

      if (
        employeesRes.status &&
        generatorsRes.status &&
        todayJobCardsRes.status &&
        tasksRes.status
      ) {
        const tasks = tasksRes.data || [];
        setStats({
          totalEmployees: employeesRes.data?.length || 0,
          totalGenerators: generatorsRes.data || 0,
          todayJobCards: todayJobCardsRes.data?.length || 0,
          totalTasks: tasks.length,
          pendingTasks: tasks.filter(
            (t) => t.status === "PENDING" || t.status === "ASSIGNED"
          ).length,
          completedTasks: tasks.filter((t) => t.status === "COMPLETED").length,
        });
        setRecentTasks(tasks.slice(0, 6));
      }

      if (logsRes.status) {
        setRecentActivity(logsRes.data?.slice(0, 10) || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const adminCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Total Generators",
      value: stats.totalGenerators,
      icon: Zap,
      color: "bg-yellow-500",
    },
    {
      title: "Today Job Cards",
      value: stats.todayJobCards,
      icon: ClipboardList,
      color: "bg-green-500",
    },
    {
      title: "Today Tasks",
      value: stats.totalTasks,
      icon: CheckSquare,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 ml-4">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}
              >
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tasks and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Tasks
          </h3>

          <div className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div
                  key={task.miniJobCardId}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  {/* Left Section */}
                  <div className="flex items-start gap-3">
                    {/* Status Dot */}
                    <div className="w-2.5 h-2.5 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>

                    {/* Task Details */}
                    <div>
                      <p className="font-medium text-slate-900">
                        {task.employeeName}
                      </p>
                      <p className="text-sm text-slate-700">
                        {task.generatorName}
                      </p>
                      <p className="text-sm text-slate-600">{task.location}</p>
                      <p className="text-xs text-slate-500">
                        {task.date} at {task.time}
                      </p>
                    </div>
                  </div>

                  {/* Right Section: Status Badge */}
                  <StatusBadge status={task.status} />
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-8">No tasks found</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Activity
          </h3>

          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div
                  key={log.logId}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  {/* Timeline Dot */}
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {log.generatorName}
                    </p>

                    <p className="text-sm text-slate-700">
                      Employee:{" "}
                      <span className="font-medium text-slate-900">
                        {log.employeeName}
                      </span>
                    </p>

                    <p className="text-xs text-blue-600 font-medium">
                      {log.status}
                    </p>

                    <p className="text-xs text-slate-500">
                      {log.date} at {log.time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};