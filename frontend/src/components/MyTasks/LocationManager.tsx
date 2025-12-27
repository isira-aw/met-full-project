// components/MyTasks/LocationManager.tsx
import React from "react";
import { MapPin } from "lucide-react";

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

interface LocationManagerProps {
  locationContext: LocationContextType;
}

export const LocationManager: React.FC<LocationManagerProps> = ({
  locationContext,
}) => {
  const {
    locationPermission,
    locationError,
    showLocationAlert,
    locationLoading,
    requestLocationPermission,
    setShowLocationAlert,
  } = locationContext;

  return (
    <>
      {/* Location Permission Alert */}
      {showLocationAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <MapPin className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Location Access Required
              </h3>
              <p className="text-sm text-red-700 mb-3">
                {locationError ||
                  "You need to allow location access to update tasks. Please enable location permission in your browser settings."}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={async () => {
                    const hasPermission = await requestLocationPermission();
                    if (hasPermission) {
                      setShowLocationAlert(false);
                    }
                  }}
                  disabled={locationLoading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {locationLoading ? "Requesting..." : "Enable Location"}
                </button>
                <button
                  onClick={() => setShowLocationAlert(false)}
                  className="bg-white border border-red-300 text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
              <div className="mt-3 text-xs text-red-600">
                <p>
                  <strong>How to enable location:</strong>
                </p>
                <p>
                  1. Click the location icon (🗺️) in your browser's address bar
                </p>
                <p>2. Select "Allow" for location access</p>
                <p>3. Refresh the page if needed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Status Indicator */}
      {locationPermission !== "granted" && !showLocationAlert && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                <strong>Location access is required</strong> to update tasks.
                {locationPermission === "checking" &&
                  " Checking permissions..."}
                {locationPermission === "prompt" &&
                  ' Click "Update Task" to enable location access.'}
                {locationPermission === "denied" &&
                  " Location access has been denied."}
              </p>
            </div>
            {locationPermission === "denied" && (
              <button
                onClick={() => setShowLocationAlert(true)}
                className="text-yellow-700 hover:text-yellow-900 text-sm font-medium"
              >
                Fix this
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};