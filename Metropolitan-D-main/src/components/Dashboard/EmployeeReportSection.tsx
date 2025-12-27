import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  User,
} from "lucide-react";
import { apiService } from "../../services/api";
import {
  EmployeeResponse,
  ReportRequest,
} from "../../types/api";
import { LoadingSpinner } from "../UI/LoadingSpinner";
import { StatusBadge } from "../UI/StatusBadge";

interface EmployeeReportSectionProps {
  employees: EmployeeResponse[];
}

interface ReportData {
  employeeEmail: string;
  employeeName: string;
  reportStartDate: string;
  reportEndDate: string;
  totalJobCards: number;
  totalTimeSpent: {
    totalOnHoldTime: string;
    totalInProgressTime: string;
    totalAssignedTime: string;
    totalCombinedTime: string;
    totalOnHoldMinutes: number;
    totalInProgressMinutes: number;
    totalAssignedMinutes: number;
    totalCombinedMinutes: number;
  };
  jobCards: Array<{
    miniJobCardId: string;
    jobCardId: string;
    jobCardTitle: string;
    currentStatus: string;
    date: string;
    // location: string;
    timeSpentOnHold: string;
    timeSpentInProgress: string;
    timeSpentAssigned: string;
    onHoldMinutes: number;
    inProgressMinutes: number;
    assignedMinutes: number;
    totalMinutes: number;
    createdAt: string;
    updatedAt: string;
  }>;
  generatedAt: string;
}

export const EmployeeReportSection: React.FC<EmployeeReportSectionProps> = ({
  employees,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(lastWeek.toISOString().split("T")[0]);
  }, []);

  const generateReport = async (): Promise<void> => {
    if (!selectedEmployee || !startDate || !endDate) {
      setReportError("Please select employee and date range");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setReportError("Start date cannot be after end date");
      return;
    }

    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24));
    if (daysDiff > 14) {
      setReportError("Maximum report period is 14 days");
      return;
    }

    setReportLoading(true);
    setReportError("");

    try {
      const request: ReportRequest = {
        employeeEmail: selectedEmployee,
        startDate,
        endDate,
      };

      const response = await apiService.generateEmployeeTimeReport(request);
      console.log("Raw API Response:", response);

      // Handle the response - it could be wrapped or direct
      let data: ReportData | null = null;
      
      if (response && response.data) {
        data = response.data;
      } else if (response && response.employeeEmail) {
        data = response as unknown as ReportData;
      }

      if (data && data.employeeEmail) {
        setReportData(data);
        console.log("Report data loaded:", data);
      } else {
        setReportError("No data received from server");
        console.error("Invalid response structure:", response);
      }
    } catch (error) {
      console.error("API Error:", error);
      setReportError("Failed to generate report. Check console for details.");
    } finally {
      setReportLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm ">
      <div className="flex items-center mb-6">
        <Search className="h-6 w-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-semibold text-slate-900">
          Employee Time Tracking Report
        </h2>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Employee
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select Employee</option>
            {employees
              .filter((emp) => emp.role !== "ADMIN")
              .map((emp) => (
                <option key={emp.email} value={emp.email}>
                  {emp.name} ({emp.email})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={generateReport}
            disabled={reportLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {reportLoading ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4 mr-2" />}
            {reportLoading ? "Loading..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Error */}
      {reportError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-700 text-sm">{reportError}</span>
          <button
            onClick={() => {setReportError(""); setReportData(null);}}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Results */}
      {reportData && (
        <div className="mt-6">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Time Report - {reportData.employeeName}
            </h3>
            <p className="text-sm text-slate-600">
              {formatDate(reportData.reportStartDate)} to {formatDate(reportData.reportEndDate)} • {reportData.totalJobCards} job cards
            </p>
          </div>

          {/* Summary Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Assigned</p>
                  <p className="text-lg font-bold text-blue-900">
                    {reportData.totalTimeSpent.totalAssignedTime}
                  </p>
                  <p className="text-xs text-blue-600">
                    {formatMinutesToHours(reportData.totalTimeSpent.totalAssignedMinutes)}
                  </p>
                </div>
              </div>
            </div> */}

            {/* <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900">In Progress</p>
                  <p className="text-lg font-bold text-green-900">
                    {reportData.totalTimeSpent.totalInProgressTime}
                  </p>
                  <p className="text-xs text-green-600">
                    {formatMinutesToHours(reportData.totalTimeSpent.totalInProgressMinutes)}
                  </p>
                </div>
              </div>
            </div> */}

            {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Pause className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">On Hold</p>
                  <p className="text-lg font-bold text-yellow-900">
                    {reportData.totalTimeSpent.totalOnHoldTime}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {formatMinutesToHours(reportData.totalTimeSpent.totalOnHoldMinutes)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckSquare className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Total</p>
                  <p className="text-lg font-bold text-purple-900">
                    {reportData.totalTimeSpent.totalCombinedTime}
                  </p>
                  <p className="text-xs text-purple-600">
                    {formatMinutesToHours(reportData.totalTimeSpent.totalCombinedMinutes)}
                  </p>
                </div>
              </div>
            </div>
          </div> */}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Job Card</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  {/* <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th> */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">In Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">On Hold</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.jobCards && reportData.jobCards.length > 0 ? (
                  reportData.jobCards.map((card, index) => (
                    <tr key={card.miniJobCardId} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{card.jobCardTitle}</p>
                          <p className="text-xs text-slate-500">ID: {card.miniJobCardId.slice(-8)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-900">{formatDate(card.date)}</td>
                      {/* <td className="px-4 py-4 text-sm text-slate-900">{card.location || "N/A"}</td> */}
                      <td className="px-4 py-4">
                        <StatusBadge status={card.currentStatus.toUpperCase()} />
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-slate-900">{card.timeSpentAssigned}</td>
                      <td className="px-4 py-4 text-sm font-mono text-slate-900">{card.timeSpentInProgress}</td>
                      <td className="px-4 py-4 text-sm font-mono text-slate-900">{card.timeSpentOnHold}</td>
                      <td className="px-4 py-4 text-sm font-mono font-medium text-slate-900">
                        {formatMinutesToHours(card.totalMinutes)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No job cards found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};