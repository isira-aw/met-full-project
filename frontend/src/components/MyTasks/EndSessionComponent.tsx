import React, { useState, useEffect } from "react";
import { Clock, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { apiService } from "../../services/api";

interface EndSessionProps {
  userEmail: string;
  currentLocation: { lat: number; lon: number } | null;
  locationAddress: string;
  onLocationUpdate: () => Promise<void>;
}

export const EndSessionComponent: React.FC<EndSessionProps> = ({
  userEmail,
  currentLocation,
  locationAddress,
  onLocationUpdate,
}) => {
  const [isEnding, setIsEnding] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Check eligibility on component mount
  useEffect(() => {
    checkEditEligibility();
  }, []);

  // Check if employee can edit/end session
  const checkEditEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const response = await apiService.canEditStatus();
      setCanEdit(response.data || false);
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setCanEdit(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  // Get location when component mounts if eligible
  useEffect(() => {
    const initializeLocation = async () => {
      if (canEdit && !currentLocation) {
        setIsLocationLoading(true);
        try {
          await onLocationUpdate();
        } catch (error) {
          console.error("Error getting initial location:", error);
        } finally {
          setIsLocationLoading(false);
        }
      }
    };

    if (!checkingEligibility) {
      initializeLocation();
    }
  }, [canEdit, checkingEligibility]);

  const handleEndSession = async () => {
    if (!currentLocation) {
      alert("Please enable location access first");
      await onLocationUpdate();
      return;
    }

    setIsEnding(true);

    try {
      const now = new Date();
      const sriLankaTime = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Colombo",
      }).format(now);

      const [date, time] = sriLankaTime.split(" ");
      const endTime = time || now.toTimeString().split(" ")[0];

      const request = {
        employeeEmail: userEmail,
        date: date,
        endTime: endTime,
        endLocation: `${currentLocation.lat},${currentLocation.lon}`,
      };

      const response = await apiService.endWorkSession(request);

      setResult({
        success: response.success,
        message: response.message,
      });

      // Refresh eligibility after ending session
      if (response.success) {
        await checkEditEligibility();
      }
    } catch (error) {
      console.error("Error ending session:", error);
      setResult({
        success: false,
        message: "Network error occurred. Please try again.",
      });
    } finally {
      setIsEnding(false);
      setShowConfirmModal(false);
    }
  };

  const handleEndButtonClick = async () => {
    if (!currentLocation && !isLocationLoading) {
      setIsLocationLoading(true);
      try {
        await onLocationUpdate();
      } catch (error) {
        console.error("Error getting location before ending session:", error);
      } finally {
        setIsLocationLoading(false);
      }
    }

    if (currentLocation || !isLocationLoading) {
      setShowConfirmModal(true);
    }
  };

  const getCurrentSriLankaTime = () => {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Colombo",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getCurrentSriLankaDate = () => {
    return new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Colombo",
    });
  };

  // Don't show button if not eligible
  if (checkingEligibility) {
    return (
      <div className="flex justify-center mt-6">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Checking session status...</span>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex justify-center mt-6">
        <div className="px-10 py-2 rounded-full bg-gray-200 text-gray-600">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Session Already Ended or No Active Session</span>
          </div>
        </div>
      </div>
    );
  }

  const isButtonDisabled = isEnding || isLocationLoading;

  return (
    <>
      {/* End Session Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleEndButtonClick}
          disabled={isButtonDisabled}
          className={`px-10 py-2 rounded-full font-semibold text-white duration-200 ${
            isButtonDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 hover:shadow-xl transform hover:scale-105"
          }`}
        >
          {isLocationLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Getting Location...</span>
            </div>
          ) : isEnding ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Ending Session...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>End The Day</span>
            </div>
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <Clock className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                End Work Session
              </h3>
              <p className="text-gray-600">
                Are you sure you want to end your work session? This will
                calculate your overtime for today.
              </p>
            </div>

            {/* Session Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Date:
                </span>
                <span className="text-sm text-gray-900">
                  {getCurrentSriLankaDate()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  End Time:
                </span>
                <span className="text-sm text-gray-900">
                  {getCurrentSriLankaTime()}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Location:
                </span>
                <div className="flex items-center max-w-48">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                  <span className="text-sm text-gray-900 text-right break-words">
                    {locationAddress || "Current Location"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Employee:
                </span>
                <span className="text-sm text-gray-900">{userEmail}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isEnding}
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                disabled={isEnding || !currentLocation}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  !currentLocation
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isEnding
                    ? "bg-red-400 text-white cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {isEnding ? "Ending..." : "End Session"}
              </button>
            </div>

            {!currentLocation && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                  <p className="text-yellow-700 text-sm">
                    Location access required to end session
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              {result.success ? (
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              )}

              <h3
                className={`text-lg font-bold mb-2 ${
                  result.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {result.success
                  ? "Session Ended Successfully!"
                  : "Error Ending Session"}
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {result.message}
                </p>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  if (result.success) {
                    window.location.reload(); // Refresh to update UI
                  }
                }}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  result.success
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};