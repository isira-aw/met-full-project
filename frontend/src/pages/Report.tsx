// Dedicated Reports Page Component
// File: src/pages/Report.tsx

import React, { useState, useEffect } from "react";
import {
  Search,
  Clock,
  FileBarChart,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { EmployeeResponse } from "../types/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { EmployeeReportSection } from "../components/Dashboard/EmployeeReportSection";
import { EmployeeOTReportSection } from "../components/Dashboard/EmployeeOTReportSection";

type ReportTab = "time-tracking" | "overtime";

export const Report: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>("time-tracking");

  useEffect(() => {
    loadEmployees();
  }, [user]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeesRes = await apiService.getAllEmployees();
      
      if (employeesRes.status && employeesRes.data) {
        setEmployees(employeesRes.data);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
            <div>
        <h1 className="text-3xl font-bold text-slate-900 ml-4">Reports</h1>
      </div>


      {/* Reports Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveReportTab("time-tracking")}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeReportTab === "time-tracking"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Search className="h-4 w-4" />
                Time Tracking Report
              </button>
              <button
                onClick={() => setActiveReportTab("overtime")}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeReportTab === "overtime"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Clock className="h-4 w-4" />
                Overtime Report
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeReportTab === "time-tracking" && (
            <div>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Time Tracking Report Features:
                </h3>
              </div>
              <EmployeeReportSection employees={employees} />
            </div>
          )}

          {activeReportTab === "overtime" && (
            <div>
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="text-sm font-medium text-orange-900 mb-1">
                  Overtime Report Features:
                </h3>
              </div>
              <EmployeeOTReportSection employees={employees} />
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Report Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Time Tracking Reports</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Best for analyzing work patterns and task completion times</li>
              <li>• Use shorter date ranges (1-7 days) for detailed analysis</li>
              <li>• Assigned time shows when tasks were first given to employees</li>
              <li>• In-progress time tracks active work periods</li>
              <li>• On-hold time captures delays and waiting periods</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Overtime Reports</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Perfect for payroll and compliance monitoring</li>
              <li>• Morning OT calculated for activity before 8:00 AM</li>
              <li>• Evening OT calculated for activity after 5:00 PM</li>
              <li>• Location tracking shows where overtime occurred</li>
              <li>• Use monthly periods for comprehensive overtime analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};