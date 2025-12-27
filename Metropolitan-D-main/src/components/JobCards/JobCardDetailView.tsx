import React, { useState, useEffect } from "react";
import {
  Eye,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
  Wrench,
  Mail,
  Building,
  User,
} from "lucide-react";
import { JobCardResponse, MiniJobCardResponse } from "../../types/api";
import { apiService } from "../../services/api";
import { Modal } from "../UI/Modal";
import { LoadingSpinner } from "../UI/LoadingSpinner";
import { EmailNotificationModal } from "./EmailNotificationModal";

interface JobCardDetailViewProps {
  jobCard: JobCardResponse;
  onClose: () => void;
}

export const JobCardDetailView: React.FC<JobCardDetailViewProps> = ({
  jobCard,
  onClose,
}) => {
  const [miniJobCards, setMiniJobCards] = useState<MiniJobCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    loadMiniJobCards();
  }, [jobCard.jobCardId]);

  const loadMiniJobCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getMiniJobCardsByJobCard(jobCard.jobCardId);
      
      if (response.status && response.data) {
        setMiniJobCards(response.data);
      } else {
        setError(response.message || "Failed to load task details");
      }
    } catch (error) {
      console.error("Error loading mini job cards:", error);
      setError("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Not specified";
    
    if (timeString.includes("T")) {
      return new Date(timeString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "IN_PROGRESS":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700";
      case "PENDING":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-red-100 text-red-700";
    }
  };

  const getGoogleMapsUrl = (locationString: string) => {
    if (!locationString) return null;
    const [lat, lng] = locationString.split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(lat) || isNaN(lng)) return null;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="" size="xl">
        <div className="space-y-6">
          {/* Compact Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                jobCard.jobType === "SERVICE" ? "bg-green-100" : "bg-orange-100"
              }`}>
                {jobCard.jobType === "SERVICE" ? (
                  <Settings className="w-6 h-6 text-green-600" />
                ) : (
                  <Wrench className="w-6 h-6 text-orange-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{jobCard.generator.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    jobCard.jobType === "SERVICE" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {jobCard.jobType}
                  </span>
                  <span>{formatDate(jobCard.date)}</span>
                  <span>{formatTime(jobCard.estimatedTime)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Email Button */}
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                title="Send email notification to generator owner"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </button>
            </div>
          </div>

          {/* Compact Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generator & Job Info */}
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Generator Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Name:</span>
                    <span className="font-medium">{jobCard.generator.name}</span>
                  </div>
                  {jobCard.generator.capacity && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Capacity:</span>
                      <span>{jobCard.generator.capacity} KW</span>
                    </div>
                  )}
                  {jobCard.generator.contactNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Contact:</span>
                      <span>{jobCard.generator.contactNumber}</span>
                    </div>
                  )}
                  {jobCard.generator.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span className="text-blue-600">{jobCard.generator.email}</span>
                    </div>
                  )}
                  {jobCard.generator.description && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Contact Person:</span>
                      <span>{jobCard.generator.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Employees */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Assigned Team ({jobCard.assignedEmployees.length})
                </h3>
                <div className="space-y-2">
                  {jobCard.assignedEmployees.map((employee) => (
                    <div key={employee.email} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        employee.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {employee.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Task Progress */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Task Progress ({miniJobCards.length})
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-slate-600">Loading...</span>
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-600 text-sm">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  <p>{error}</p>
                </div>
              ) : miniJobCards.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No tasks created yet</p>
                  <p className="text-xs mt-1">Tasks will appear once work begins</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {miniJobCards.map((miniJob) => (
                    <div key={miniJob.miniJobCardId} className="bg-white rounded-lg p-3 border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(miniJob.status)}
                          <span className="font-medium text-sm">{miniJob.employeeName}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(miniJob.status)}`}>
                          {miniJob.status.replace("_", " ")}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(miniJob.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(miniJob.updatedTime ?? "")}</span>
                        </div>
                        {miniJob.location && (
                          <div className="col-span-2">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              {getGoogleMapsUrl(miniJob.location) ? (
                                <a
                                  href={getGoogleMapsUrl(miniJob.location)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  View Location
                                </a>
                              ) : (
                                <span>Location Available</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Compact Footer Info */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Created: {formatDate(jobCard.createdAt)}</span>
              {jobCard.updatedAt !== jobCard.createdAt && (
                <span>Updated: {formatDate(jobCard.updatedAt)}</span>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Email Notification Modal */}
      <EmailNotificationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        jobCard={jobCard}
      />
    </>
  );
};