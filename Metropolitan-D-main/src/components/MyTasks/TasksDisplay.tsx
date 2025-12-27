// components/MyTasks/TasksDisplay.tsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns-tz";
import {
  Clock,
  MapPin,
  Calendar,
  Navigation,
  Zap,
  Phone,
  Mail,
  FileText,
  Settings,
  Timer,
  Award,
} from "lucide-react";
import {
  MiniJobCardResponse,
  TaskStatus,
  UpdateMiniJobCardRequest,
} from "../../types/api";
import { StatusBadge } from "../UI/StatusBadge";
import { Modal } from "../UI/Modal";
import { apiService } from "../../services/api";

// Enhanced interface
interface EnhancedMiniJobCardResponse extends MiniJobCardResponse {
  jobType?: "SERVICE" | "REPAIR";
  estimatedTime: string;
  generatorId?: string;
  generatorName?: string;
  generatorCapacity?: string;
  generatorContactNumber?: string;
  generatorEmail?: string;
  generatorDescription?: string;
  orderPosition?: number;
}

// Location context type
interface LocationState {
  lat: number;
  lon: number;
}

interface LocationContextType {
  currentLocation: LocationState | null;
  locationAddress: string;
  locationLoading: boolean;
  locationPermission: "granted" | "denied" | "prompt" | "checking";
  locationError: string;
  showLocationAlert: boolean;
  getCurrentLocation: () => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
  setShowLocationAlert: (show: boolean) => void;
}

interface TasksDisplayProps {
  tasks: EnhancedMiniJobCardResponse[];
  loading: boolean;
  filterDate: string;
  setFilterDate: (date: string) => void;
  setTodayFilter: () => void;
  formatDate: (dateString: string) => string;
  showUpdateModal: boolean;
  setShowUpdateModal: (show: boolean) => void;
  updatingTask: EnhancedMiniJobCardResponse | null;
  setUpdatingTask: (task: EnhancedMiniJobCardResponse | null) => void;
  updateForm: UpdateMiniJobCardRequest;
  setUpdateForm: React.Dispatch<React.SetStateAction<UpdateMiniJobCardRequest>>;
  locationContext: LocationContextType;
  onUpdateTask: (task: EnhancedMiniJobCardResponse) => void;
  onSaveUpdate: () => Promise<void>;
  isUpdating: boolean;
  getAvailableStatusOptions: (
    currentStatus: string
  ) => { value: string; label: string }[];
  getOrdinalSuffix: (position: number) => string;
  canEditTask: (task: EnhancedMiniJobCardResponse) => boolean;
  hasBlockingStatus: boolean;
  activeTaskId: string | null;
}

export const TasksDisplay: React.FC<TasksDisplayProps> = ({
  tasks,
  loading,
  filterDate,
  setFilterDate,
  setTodayFilter,
  formatDate,
  showUpdateModal,
  setShowUpdateModal,
  updatingTask,
  setUpdatingTask,
  updateForm,
  setUpdateForm,
  locationContext,
  onUpdateTask,
  onSaveUpdate,
  isUpdating,
  getAvailableStatusOptions,
  getOrdinalSuffix,
}) => {
  const {
    currentLocation,
    locationAddress,
    locationLoading,
    locationPermission,
    getCurrentLocation,
  } = locationContext;

  const formatTime = (timeString: string) => {
    if (!timeString) return "No time set";

    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get current time in Sri Lanka (Colombo) timezone
  const isToday = (dateString: string) => {
    const sriLankaTime = format(new Date(), "yyyy-MM-dd", {
      timeZone: "Asia/Colombo",
    });
    const taskDate = format(new Date(dateString), "yyyy-MM-dd");
    return sriLankaTime === taskDate;
  };

  const getJobTypeColor = (jobType?: string) => {
    switch (jobType) {
      case "SERVICE":
        return "bg-blue-100 text-blue-800";
      case "REPAIR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 2:
        return "bg-slate-100 text-slate-800 border-slate-300";
      case 3:
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const handleClick = async () => {
    await onSaveUpdate();
  };

  const [canEditTasks, setCanEditTasks] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  // Check eligibility on mount
  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setCheckingEligibility(true);
        const response = await apiService.canEditStatus();
        setCanEditTasks(response.data || false);
      } catch (error) {
        console.error("Error checking eligibility:", error);
        setCanEditTasks(false);
      } finally {
        setCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, []);

  return (
    <>
      {/* Simple Date Filter - Only Date Picker and Today Button */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Date Input */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
              Select Date:
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Today Button */}
          <button
            onClick={setTodayFilter}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Today
          </button>

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center gap-2 ml-auto">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-xs text-slate-600">Loading tasks...</span>
            </div>
          )}

          {/* Selected Date Display */}
          {filterDate && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-600">
                Showing tasks for: <strong>{formatDate(filterDate)}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Tasks Grid with Order Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div
            key={task.miniJobCardId}
            className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
              isToday(task.date)
                ? "border-blue-300 bg-blue-50"
                : "border-slate-200"
            }`}
          >
            {/* Order Badge and Status */}
            <div className="flex justify-between items-start mb-4">
              {task.orderPosition && (
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getOrderBadgeColor(
                    task.orderPosition
                  )}`}
                >
                  <Award className="w-4 h-4 mr-1" />
                  {getOrdinalSuffix(task.orderPosition)} Priority
                </div>
              )}
              <StatusBadge
                status={task.status === "ASSIGNED" ? "TRAVELING" : task.status}
              />
            </div>

            {/* Task Header with Generator Info */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isToday(task.date) ? "bg-blue-200" : "bg-blue-100"
                  }`}
                >
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-slate-900 truncate">
                    {task.generatorName || "Generator Task"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Task #{task.miniJobCardId.slice(-8)}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {task.jobType && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getJobTypeColor(
                          task.jobType
                        )}`}
                      >
                        {task.jobType}
                      </span>
                    )}
                    {isToday(task.date) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                        TODAY
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {task.estimatedTime && (
              <div className="flex items-center space-x-2 text-sm text-slate-600 mb-3">
                <Timer className="w-4 h-4" />
                <span>
                  <span className="font-medium text-red-600">
                    Estimated Time:
                    {/* </span>{" "}
                  {task.estimatedTime
                    ? `${task.estimatedTime.split(":")[0]} H ${
                        task.estimatedTime.split(":")[1]
                      } min`
                    : "No time set"}
                </span> */}
                  </span>{" "}
                  {task.estimatedTime
                    ? (() => {
                        const [hoursStr, minutesStr] =
                          task.estimatedTime.split(":");
                        let hours = parseInt(hoursStr, 10) || 0;
                        const minutes = minutesStr.padStart(2, "0");

                        // Convert to 12-hour format
                        const period = hours >= 12 ? "PM" : "AM";
                        hours = hours % 12 || 12; // 0 → 12

                        // Clamp to max 12h if you want
                        if (hours > 12) hours = 12;

                        return `${hours}:${minutes} ${period}`;
                      })()
                    : "No time set"}
                </span>
              </div>
            )}

            {/* Generator Details */}
            {(task.generatorCapacity || task.generatorDescription) && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Generator Details
                  </span>
                </div>
                {task.generatorCapacity && (
                  <p className="text-sm text-slate-600 mb-1">
                    <span className="font-medium">Capacity:</span>{" "}
                    {task.generatorCapacity} KW
                  </p>
                )}
                {task.generatorDescription && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Description:</span>{" "}
                    {task.generatorDescription}
                  </p>
                )}
              </div>
            )}

            {/* Task Schedule */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span
                  className={
                    isToday(task.date) ? "font-medium text-blue-700" : ""
                  }
                >
                  {formatDate(task.date)}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>{formatTime(task.time)}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span>{task.location || "No location specified"}</span>
              </div>
            </div>

            {/* Generator Contact Info */}
            {(task.generatorContactNumber || task.generatorEmail) && (
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-amber-800">
                    Contact Information
                  </span>
                </div>
                {task.generatorContactNumber && (
                  <div className="flex items-center space-x-2 text-sm text-amber-700 mb-1">
                    <Phone className="w-3 h-3" />
                    <a
                      href={`tel:${task.generatorContactNumber}`}
                      className="hover:underline"
                    >
                      {task.generatorContactNumber}
                    </a>
                  </div>
                )}
                {task.generatorEmail && (
                  <div className="flex items-center space-x-2 text-sm text-amber-700">
                    <Mail className="w-3 h-3" />
                    <a
                      href={`mailto:${task.generatorEmail}`}
                      className="hover:underline"
                    >
                      {task.generatorEmail}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Action Button - Show for all tasks with proper status filtering */}
            {/* Action Button */}
            <div className="mb-4">
              {checkingEligibility ? (
                <div className="w-full py-2 px-4 rounded-lg text-center bg-gray-100">
                  <span className="text-xs text-gray-600">Checking...</span>
                </div>
              ) : !canEditTasks ? (
                <div className="w-full py-2 px-4 rounded-lg text-center bg-gray-200">
                  <span className="text-xs font-medium text-gray-600">
                    Session Ended - Cannot Edit
                  </span>
                </div>
              ) : !isToday(task.date) ? (
                <div className="w-full py-2 px-4 rounded-lg text-center bg-blue-100">
                  <span className="text-xs font-medium text-blue-800">
                    Not Today
                  </span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onUpdateTask(task)}
                    disabled={
                      locationPermission === "denied" || locationLoading
                    }
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      locationPermission === "denied"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : locationLoading
                        ? "bg-blue-400 text-white cursor-wait"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {locationLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Getting Location...</span>
                      </div>
                    ) : locationPermission === "denied" ? (
                      <div className="flex items-center justify-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>Location Required</span>
                      </div>
                    ) : (
                      "Update Task"
                    )}
                  </button>
                  {locationPermission === "denied" && (
                    <p className="text-xs text-red-600 mt-1 text-center">
                      Enable location access to update tasks
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Task Footer */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Last updated {formatDate(task.updatedAt)}</span>
                {task.generatorId && (
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>ID: {task.generatorId.slice(-8)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Update Task Modal with Status Filtering */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setUpdatingTask(null);
          setUpdateForm({});
        }}
        title={`Update Task - ${
          updatingTask?.generatorName || "Generator Task"
        }`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Current Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Location
              <span className="text-xs text-slate-500 ml-1">
                (Auto-detected)
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={locationAddress || "Getting current location..."}
                readOnly
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                placeholder="Detecting location..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {locationLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <Navigation className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
            {currentLocation && (
              <p className="text-xs text-slate-500 mt-1">
                Coordinates: {currentLocation.lat.toFixed(6)},{" "}
                {currentLocation.lon.toFixed(6)}
              </p>
            )}
            {!locationLoading && !currentLocation && (
              <button
                onClick={getCurrentLocation}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                Retry getting location
              </button>
            )}
          </div>

          {/* Estimated Time - Show as read-only */}
          {/* <div>
            <label className="block text-sm font-medium text-red-700 mb-2">
              Estimated Time To Do this Task
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={(updateForm.estimatedTime?.split(":")[0] || "0") + " hrs"}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-300 bg-slate-50 text-slate-600 rounded-lg cursor-not-allowed"
                placeholder="Hours"
              />

              <span className="flex items-center text-slate-500 px-2">:</span>
              <input
                type="text"
                value={(updateForm.estimatedTime?.split(":")[1] || "0") + " min"}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-300 bg-slate-50 text-slate-600 rounded-lg cursor-not-allowed"
                placeholder="Minutes"
              />
            </div>
          </div> */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-2">
              Estimated Time To Do This Task
            </label>
            <input
              type="text"
              value={(() => {
                const [hoursStr, minutesStr] = updateForm.estimatedTime?.split(
                  ":"
                ) || ["0", "0"];
                let hours = parseInt(hoursStr, 10) || 0;
                const minutes = minutesStr.padStart(2, "0");

                // Convert to 12-hour format with AM/PM
                const period = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12; // 0 -> 12

                // Ensure max 12 hours (if needed)
                if (hours > 12) hours = 12;

                return `${hours}:${minutes} ${period}`;
              })()}
              readOnly
              className="w-full px-3 py-2 border border-slate-300 bg-slate-50 
               text-red-600 rounded-lg cursor-not-allowed text-center font-medium"
              placeholder="Estimated time"
            />
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date
              </label>
              <input
                type="date"
                readOnly
                value={updateForm.date || ""}
                className="w-full px-3 py-2 border border-slate-300 bg-slate-50 text-slate-600 rounded-lg cursor-not-allowed"
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total time you spent on this task.
              </label>
              <div className="flex gap-2">
                <select
                  value={updateForm.time?.split(":")[0] || ""}
                  onChange={(e) => {
                    const hour = e.target.value;
                    const minute = updateForm.time?.split(":")[1] || "00";
                    setUpdateForm((prev) => ({
                      ...prev,
                      time: `${hour}:${minute}`,
                    }));
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Hour</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className="flex items-center text-slate-500 px-2">:</span>
                <select
                  value={updateForm.time?.split(":")[1] || ""}
                  onChange={(e) => {
                    const minute = e.target.value;
                    const hour = updateForm.time?.split(":")[0] || "00";
                    setUpdateForm((prev) => ({
                      ...prev,
                      time: `${hour}:${minute}`,
                    }));
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Min</option>
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div> */}
          </div>

          {/* Status - Filtered to exclude current status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Update Status
              <span className="text-xs text-slate-500 ml-1">
                (Current: {updatingTask?.status})
              </span>
            </label>
            <select
              value={updateForm.status || ""}
              onChange={(e) =>
                setUpdateForm((prev) => ({
                  ...prev,
                  status: e.target.value as TaskStatus,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select new status...</option>
              {updatingTask &&
                getAvailableStatusOptions(updatingTask.status).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowUpdateModal(false);
                setUpdatingTask(null);
                setUpdateForm({});
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClick}
              disabled={locationLoading || !currentLocation || isUpdating}
              className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isUpdating
                  ? "bg-green-600 animate-pulse"
                  : locationLoading
                  ? "bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {locationLoading ? (
                "Getting Location..."
              ) : isUpdating ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                    ></path>
                  </svg>
                  Updating...
                </>
              ) : (
                "Update Task"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
