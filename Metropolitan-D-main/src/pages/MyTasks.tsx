import React, { useState, useEffect } from "react";
import { format } from "date-fns-tz";
import { Zap, MapPin, AlertTriangle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { MiniJobCardResponse, UpdateMiniJobCardRequest } from "../types/api";
import { LocationManager } from "../components/MyTasks/LocationManager";
import { TasksDisplay } from "../components/MyTasks/TasksDisplay";
import { EndSessionComponent } from "../components/MyTasks/EndSessionComponent";

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
  orderPosition?: number; // Added for ordering
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

// Location Requirement Guard Component
const LocationRequirementGuard: React.FC<{
  onEnableLocation: () => void;
  onRefresh: () => void;
  locationLoading: boolean;
  locationError: string;
}> = ({ onEnableLocation, onRefresh, locationLoading, locationError }) => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <MapPin className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Location Access Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please enable location services to access this page.
            </p>
          </div>

          {locationError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700 text-sm">{locationError}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={onEnableLocation}
              disabled={locationLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                locationLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {locationLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Requesting Access...
                </div>
              ) : (
                "Enable Location Access"
              )}
            </button>

            <button
              onClick={onRefresh}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="w-full py-2 px-4 text-blue-600 hover:text-blue-700 transition-colors"
            >
              How to Fix?
            </button>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">How to Enable Location</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>Chrome/Edge:</strong> Click lock icon → Allow location
              </p>
              <p>
                <strong>Firefox:</strong> Click shield icon → Allow location
              </p>
              <p>
                <strong>Safari:</strong> Safari menu → Preferences → Websites →
                Location
              </p>
              <p className="text-xs text-gray-500 mt-3">
                After enabling, click Refresh button
              </p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const [, setTasks] = useState<EnhancedMiniJobCardResponse[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<
    EnhancedMiniJobCardResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingTask, setUpdatingTask] =
    useState<EnhancedMiniJobCardResponse | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateMiniJobCardRequest>({});

  // Location states
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(
    null
  );
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "checking"
  >("checking");
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [locationError, setLocationError] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // New state for location requirement check
  const [locationRequirementMet, setLocationRequirementMet] = useState(false);
  const [initialLocationCheck, setInitialLocationCheck] = useState(true);

  // NEW: State to track if any task is in blocking status
  const [hasBlockingStatus, setHasBlockingStatus] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const isToday = (dateString: string) => {
    const sriLankaTime = format(new Date(), "yyyy-MM-dd", {
      timeZone: "Asia/Colombo",
    });
    const taskDate = format(new Date(dateString), "yyyy-MM-dd");
    return sriLankaTime === taskDate;
  };

  useEffect(() => {
    if (user?.email) {
      checkLocationRequirements();
    }
  }, [user]);

  useEffect(() => {
    if (user?.email && locationRequirementMet) {
      // Initialize with today's date
      const today = format(new Date(), "yyyy-MM-dd", {
        timeZone: "Asia/Colombo",
      });
      setFilterDate(today);
    }
  }, [user, locationRequirementMet]);

  useEffect(() => {
    if (user?.email && locationRequirementMet && filterDate) {
      loadTasks();
    }
  }, [user, filterDate, locationRequirementMet]);

  useEffect(() => {
    if (showUpdateModal && !currentLocation) {
      getCurrentLocation();
    }
  }, [showUpdateModal]);

  useEffect(() => {
    if (currentLocation) {
      fetchLocationAddress();
    }
  }, [currentLocation]);

  // NEW: Check for blocking statuses whenever tasks change
  useEffect(() => {
    checkForBlockingStatuses();
  }, [filteredTasks]);

  // NEW: Function to check if any task has a blocking status
  const checkForBlockingStatuses = () => {
    const blockingStatuses = ["IN_PROGRESS", "ON_HOLD", "ASSIGNED"];
    const taskWithBlockingStatus = filteredTasks.find((task) =>
      blockingStatuses.includes(task.status)
    );

    setHasBlockingStatus(!!taskWithBlockingStatus);
    setActiveTaskId(taskWithBlockingStatus?.miniJobCardId || null);
  };

  // NEW: Function to check if a task can be edited
  const canEditTask = (task: EnhancedMiniJobCardResponse): boolean => {
    if (!hasBlockingStatus) return true;
    return task.miniJobCardId === activeTaskId;
  };

  // Check if location requirements are met
  const checkLocationRequirements = async () => {
    setInitialLocationCheck(true);
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setLocationPermission("denied");
      setLocationRequirementMet(false);
      setLocationLoading(false);
      setInitialLocationCheck(false);
      return;
    }

    try {
      // Check permission status first
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permission.state === "granted") {
          // Try to get current position to verify device location is also enabled
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentLocation({ lat: latitude, lon: longitude });
              setLocationPermission("granted");
              setLocationRequirementMet(true);
              setLocationLoading(false);
              setInitialLocationCheck(false);
              setLocationError("");
            },
            (error) => {
              handleLocationError(error);
              setLocationRequirementMet(false);
              setLocationLoading(false);
              setInitialLocationCheck(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000,
            }
          );
        } else {
          setLocationPermission(
            permission.state as "granted" | "denied" | "prompt"
          );
          setLocationRequirementMet(false);
          setLocationLoading(false);
          setInitialLocationCheck(false);
          setLocationError(
            "Location permission is required to access this page"
          );
        }
      } else {
        // Fallback for browsers without permissions API
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lon: longitude });
            setLocationPermission("granted");
            setLocationRequirementMet(true);
            setLocationLoading(false);
            setInitialLocationCheck(false);
            setLocationError("");
          },
          (error) => {
            handleLocationError(error);
            setLocationRequirementMet(false);
            setLocationLoading(false);
            setInitialLocationCheck(false);
          }
        );
      }
    } catch (error) {
      console.error("Error checking location requirements:", error);
      setLocationError("Unable to check location requirements");
      setLocationRequirementMet(false);
      setLocationLoading(false);
      setInitialLocationCheck(false);
    }
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setLocationPermission("denied");
        setLocationError(
          "Location access denied. Please enable location services in your browser and device settings."
        );
        break;
      case error.POSITION_UNAVAILABLE:
        setLocationError(
          "Location information unavailable. Please ensure your device location is enabled."
        );
        break;
      case error.TIMEOUT:
        setLocationError("Location request timed out. Please try again.");
        break;
      default:
        setLocationError(
          "An error occurred while retrieving location. Please check your location settings."
        );
        break;
    }
  };

  // Quick enable location function
  const handleQuickEnableLocation = async () => {
    setLocationLoading(true);
    setLocationError("");

    const success = await requestLocationPermission();
    if (success) {
      setLocationRequirementMet(true);
    }
    setLocationLoading(false);
  };

  // Refresh location check without full page reload
  const handleRefresh = () => {
    setLocationRequirementMet(false);
    setLocationError("");
    checkLocationRequirements();
  };

  // Location functions (existing)
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lon: longitude });
        setLocationLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationAddress("Unable to get current location");
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const fetchLocationAddress = async () => {
    if (!currentLocation) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.lat}&lon=${currentLocation.lon}&format=json`
      );

      if (response.ok) {
        const data = await response.json();
        setLocationAddress(data.display_name || "Address not found");
      } else {
        setLocationAddress("Unable to fetch address");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setLocationAddress("Error fetching address");
    }
  };

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setLocationPermission("denied");
      setLocationLoading(false);
      return false;
    }

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lon: longitude });
          setLocationPermission("granted");
          setLocationLoading(false);
          setShowLocationAlert(false);
          resolve(true);
        },
        (error) => {
          setLocationLoading(false);
          handleLocationError(error);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  };

  // Function to convert time string to minutes for sorting
  const timeToMinutes = (timeString: string): number => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Function to get ordinal suffix
  const getOrdinalSuffix = (position: number): string => {
    const j = position % 10;
    const k = position % 100;
    if (j === 1 && k !== 11) return `${position}st`;
    if (j === 2 && k !== 12) return `${position}nd`;
    if (j === 3 && k !== 13) return `${position}rd`;
    return `${position}th`;
  };

  // Task management functions
  const loadTasks = async () => {
    if (!user?.email || !filterDate) return;

    try {
      setLoading(true);
      console.log(`Loading tasks for date: ${filterDate}`);

      const response = await apiService.getMiniJobCardsByEmployeeAndDate(
        user.email,
        filterDate
      );

      if (response.status && response.data) {
        const sortedTasks = response.data
          .sort((a, b) => {
            const aTime = timeToMinutes(a.estimatedTime || "00:00");
            const bTime = timeToMinutes(b.estimatedTime || "00:00");
            return aTime - bTime;
          })
          .map((task, index) => ({
            ...task,
            orderPosition: index + 1,
          }));

        setTasks(sortedTasks);
        setFilteredTasks(sortedTasks);
      } else {
        setTasks([]);
        setFilteredTasks([]);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      setTasks([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Get available status options (exclude current status)
  const getAvailableStatusOptions = (currentStatus: string) => {
    const allOptions = [];
    if (currentStatus == "PENDING") {
      allOptions.push(
        { value: "ASSIGNED", label: "Traveling" },
        { value: "CANCELLED", label: "Cancelled" }
      );
    } else if (currentStatus == "ASSIGNED") {
      allOptions.push(
        { value: "PENDING", label: "Pending" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "ON_HOLD", label: "On Hold (Take a break.)" },
        { value: "CANCELLED", label: "Cancelled" }
      );
    } else if (currentStatus == "IN_PROGRESS") {
      allOptions.push(
        { value: "ON_HOLD", label: "On Hold (Take a break.)" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" }
      );
    } else if (currentStatus == "ON_HOLD") {
      allOptions.push(
        { value: "PENDING", label: "Pending" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "ASSIGNED", label: "Traveling" },
        { value: "CANCELLED", label: "Cancelled" }
      );
    } else if (currentStatus == "COMPLETED") {
      allOptions.push({ value: "ON_HOLD", label: "On Hold (Take a break.)" });
    } else if (currentStatus == "CANCELLED") {
      allOptions.push({ value: "ON_HOLD", label: "On Hold (Take a break.)" });
    } else {
      allOptions.push(
        { value: "PENDING", label: "Pending" },
        { value: "ASSIGNED", label: "Traveling" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "ON_HOLD", label: "On Hold (Take a break.)" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" }
      );
    }

    return allOptions.filter((option) => option.value !== currentStatus);
  };

  // MODIFIED: Check if task can be edited before allowing update
  const handleUpdateTask = (task: EnhancedMiniJobCardResponse) => {
    if (!canEditTask(task)) {
      // Show notification or alert that editing is blocked
      alert(
        "Cannot edit this task. Another task is currently In Progress, On Hold , or Traveling."
      );
      return;
    }

    setUpdatingTask(task);
    setUpdateForm({
      status: task.status,
      location: task.location,
      time: task.time,
      date: task.date,
      estimatedTime: task.estimatedTime,
    });
    setShowUpdateModal(true);
    setCurrentLocation(null);
    setLocationAddress("");
  };

  const handleSaveUpdate = async () => {
    if (!updatingTask || !currentLocation) return;

    setIsUpdating(true);

    const updatedForm = {
      ...updateForm,
      location: `${currentLocation.lat},${currentLocation.lon}`,
      coordinates: {
        lat: currentLocation.lat,
        lon: currentLocation.lon,
      },
    };

    try {
      const response = await apiService.updateMiniJobCard(
        updatingTask.miniJobCardId,
        updatedForm
      );
      if (response.status) {
        await loadTasks();
        setShowUpdateModal(false);
        setUpdatingTask(null);
        setUpdateForm({});
        setCurrentLocation(null);
        setLocationAddress("");
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Set today's date
  const setTodayFilter = () => {
    const today = format(new Date(), "yyyy-MM-dd", {
      timeZone: "Asia/Colombo",
    });
    setFilterDate(today);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Create location context value
  const locationContext: LocationContextType = {
    currentLocation,
    locationAddress,
    locationLoading,
    locationPermission,
    locationError,
    showLocationAlert,
    getCurrentLocation,
    requestLocationPermission,
    setShowLocationAlert,
  };

  // Show location requirement guard if conditions not met
  if (
    initialLocationCheck ||
    (!locationRequirementMet &&
      !locationLoading &&
      locationPermission !== "checking")
  ) {
    return (
      <LocationRequirementGuard
        onEnableLocation={handleQuickEnableLocation}
        onRefresh={handleRefresh}
        locationLoading={locationLoading}
        locationError={locationError}
      />
    );
  }

  // Show loading while checking initial location
  if (locationPermission === "checking" || initialLocationCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking location requirements...</p>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="space-y-6">
      {/* Location Management Component */}
      <LocationManager locationContext={locationContext} />

      <h1 className="text-2xl font-bold ml-5">My Tasks</h1>

      {/* Tasks Display Component */}
      <TasksDisplay
        tasks={filteredTasks}
        loading={loading}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        setTodayFilter={setTodayFilter}
        formatDate={formatDate}
        showUpdateModal={showUpdateModal}
        setShowUpdateModal={setShowUpdateModal}
        updatingTask={updatingTask}
        setUpdatingTask={setUpdatingTask}
        updateForm={updateForm}
        setUpdateForm={setUpdateForm}
        locationContext={locationContext}
        onUpdateTask={handleUpdateTask}
        onSaveUpdate={handleSaveUpdate}
        isUpdating={isUpdating}
        getAvailableStatusOptions={getAvailableStatusOptions}
        getOrdinalSuffix={getOrdinalSuffix}
        canEditTask={canEditTask}
        hasBlockingStatus={hasBlockingStatus}
        activeTaskId={activeTaskId}
      />

      {/* No tasks message */}
      {!loading && filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            No tasks found for {formatDate(filterDate)}
          </p>
          <button
            onClick={setTodayFilter}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Load today's tasks
          </button>
        </div>
      )}

      {/* NEW: Show blocking status notification */}
      {filterDate &&
        isToday(filterDate) &&
        !hasBlockingStatus &&
        filteredTasks.length !== 0 && (
          <div>
            {user?.email && (
              <EndSessionComponent
                userEmail={user.email}
                currentLocation={currentLocation}
                locationAddress={locationAddress}
                onLocationUpdate={getCurrentLocation}
              />
            )}
          </div>
        )}
    </div>
  );
};
