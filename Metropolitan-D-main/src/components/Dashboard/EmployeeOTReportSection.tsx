// File: src/components/Dashboard/EmployeeOTReportSection.tsx

import React, { useState, useEffect } from "react";
import {
  Calendar,
  User,
  Clock,
  MapPin,
  Route,
  ExternalLink,
  Download,
} from "lucide-react";
import { apiService } from "../../services/api";
import {
  EmployeeResponse,
  OTReportRequest,
  OTRecord,
  OTReportResponse,
} from "../../types/api";
import LoadingSpinner from "../ui/LoadingSpinner";
import { downloadPdf } from "../../utils/downloadUtils";
import { extractErrorMessage, logError } from "../../utils/errorHandler";

interface EmployeeOTReportSectionProps {
  employees: EmployeeResponse[];
}

export const EmployeeOTReportSection: React.FC<EmployeeOTReportSectionProps> = ({
  employees,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<OTReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(lastMonth.toISOString().split("T")[0]);
  }, []);

  const generateOTReport = async (): Promise<void> => {
    if (!selectedEmployee || !startDate || !endDate) {
      setReportError("Please select employee and date range");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setReportError("Start date cannot be after end date");
      return;
    }

    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24));
    if (daysDiff > 31) {
      setReportError("Maximum report period is 31 days");
      return;
    }

    setReportLoading(true);
    setReportError("");

    try {
      const request: OTReportRequest = {
        employeeEmail: selectedEmployee,
        startDate,
        endDate,
      };

      const response = await apiService.generateEmployeeOTReport(request);
      console.log("Raw OT API Response:", response);

      // Handle the response - it could be wrapped or direct
      let data: OTReportResponse | null = null;
      
      if (response && response.data) {
        data = response.data;
      } else if (response && response.employeeEmail) {
        data = response as OTReportResponse;
      }

      if (data && data.employeeEmail) {
        setReportData(data);
        console.log("OT Report data loaded:", data);
      } else {
        setReportError("No data received from server");
        console.error("Invalid response structure:", response);
      }
    } catch (error) {
      console.error("OT API Error:", error);
      setReportError("Failed to generate OT report. Check console for details.");
    } finally {
      setReportLoading(false);
    }
  };

  const downloadPdfReport = async (): Promise<void> => {
    if (!selectedEmployee || !startDate || !endDate) {
      setReportError("Please select employee and date range");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setReportError("Start date cannot be after end date");
      return;
    }

    setPdfLoading(true);
    setReportError("");

    try {
      const request: OTReportRequest = {
        employeeEmail: selectedEmployee,
        startDate,
        endDate,
      };

      const pdfBlob = await apiService.downloadOvertimeReportPdf(request);

      // Generate filename with employee name and date range
      const employeeName = employees.find(emp => emp.email === selectedEmployee)?.name || 'employee';
      const filename = `ot-report_${employeeName.replace(/\s+/g, '-')}_${startDate}_to_${endDate}`;

      downloadPdf(pdfBlob, filename);

      console.log("OT PDF downloaded successfully");
    } catch (error: unknown) {
      const errorInfo = extractErrorMessage(error, 'Failed to download OT PDF report');
      logError(errorInfo, 'EmployeeOTReportSection.downloadPdf');
      setReportError(errorInfo.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const formatTime = (timeString: string): string => {
    if (!timeString || timeString === "00:00") return "00:00";
    // Handle both HH:MM and HH:MM:SS formats, return only HH:MM
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1].padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return timeString;
  };

  // Function to open Google Maps route with all locations
  const openLocationRoute = (allLocations: string[]): void => {
    if (!allLocations || allLocations.length === 0) return;
    
    // Filter out empty or invalid coordinates
    const validLocations = allLocations.filter(location => {
      if (!location) return false;
      const coords = location.split(',');
      return coords.length >= 2 && !isNaN(parseFloat(coords[0])) && !isNaN(parseFloat(coords[1]));
    });

    if (validLocations.length === 0) return;

    // Create Google Maps route URL
    if (validLocations.length === 1) {
      // Single location - just show the location
      const coords = validLocations[0].split(',');
      const lat = coords[0].trim();
      const lng = coords[1].trim();
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(mapsUrl, '_blank');
    } else {
      // Multiple locations - create route
      const routeUrl = `https://www.google.com/maps/dir/${validLocations.join('/')}/`;
      window.open(routeUrl, '_blank');
    }
  };

  // Function to format coordinates for display
  const formatCoordinates = (coordinates: string): string => {
    if (!coordinates) return "N/A";
    const coords = coordinates.split(',');
    if (coords.length >= 2) {
      const lat = parseFloat(coords[0]).toFixed(6);
      const lng = parseFloat(coords[1]).toFixed(6);
      return `${lat}, ${lng}`;
    }
    return coordinates;
  };

  // Function to get location count for display
  const getLocationCount = (allLocations: string[]): number => {
    if (!allLocations) return 0;
    return allLocations.filter(location => location && location.trim().length > 0).length;
  };

  const parseTimeToMinutes = (timeString: string): number => {
    if (!timeString) return 0;
    const parts = timeString.split(':').map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;
    return (hours * 60) + minutes + (seconds / 60);
  };

  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Clock className="h-5 w-5 text-orange-600 mr-2" />
        <h3 className="text-lg font-semibold text-slate-900">
          Employee Overtime Report
        </h3>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Employee
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
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
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
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
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        <div className="flex items-end gap-2 col-span-1 md:col-span-2 lg:col-span-1">
          <button
            onClick={generateOTReport}
            disabled={reportLoading}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 text-sm"
          >
            {reportLoading ? <LoadingSpinner size="sm" /> : <Clock className="h-4 w-4 mr-2" />}
            {reportLoading ? "Loading..." : "Generate OT Report"}
          </button>

          <button
            onClick={downloadPdfReport}
            disabled={pdfLoading || !selectedEmployee || !startDate || !endDate}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
            title="Download OT report as PDF"
          >
            {pdfLoading ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4 mr-2" />}
            {pdfLoading ? "Downloading..." : "PDF"}
          </button>
        </div>
      </div>

      {/* Error */}
      {reportError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900">
              Overtime Report - {reportData.employeeName}
            </h4>
            <p className="text-sm text-slate-600">
              {formatDate(reportData.startDate)} to {formatDate(reportData.endDate)} • {reportData.otRecords?.length || 0} days with OT
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-slate-200 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">First Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">Last Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">Daily Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">Morning OT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">Evening OT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">Daily Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">On Hold</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">In Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase border-b">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.otRecords && reportData.otRecords.length > 0 ? (
                  reportData.otRecords.map((record: OTRecord, index) => (
                    <tr key={`${record.date}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-slate-900">
                        {formatTime(record.firstTime)}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-slate-900">
                        {formatTime(record.lastTime)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-900">
                        {record.allLocations && record.allLocations.length > 0 ? (
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => openLocationRoute(record.allLocations)}
                              className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                              title={`View route through ${getLocationCount(record.allLocations)} locations`}
                            >
                              <Route className="h-4 w-4" />
                              <div className="flex flex-col items-start">
                                <span className="text-xs font-medium">
                                  View Route ({getLocationCount(record.allLocations)} locations)
                                </span>
                                {/* {record.locationsSummary && (
                                  <span className="text-xs text-blue-600 truncate max-w-32" title={record.locationsSummary}>
                                    {record.locationsSummary.length > 30 
                                      ? `${record.locationsSummary.substring(0, 30)}...` 
                                      : record.locationsSummary}
                                  </span>
                                )} */}
                              </div>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-slate-400">
                            <MapPin className="h-4 w-4" />
                            <span className="text-xs">No locations</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-blue-700">
                        {formatTime(record.morningOT)}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-green-700">
                        {formatTime(record.eveningOT)}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono font-medium text-orange-700">
                        {formatTime(record.dailyTotalOT)}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-yellow-700">
                        {formatTime(record.onHoldTime)}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-purple-700">
                        {formatTime(record.assignedTime)}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-indigo-700">
                        {formatTime(record.inProgressTime)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-900">
                        <div className="flex flex-col space-y-1">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                            {record.currentStatus}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                      No overtime records found for this period
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