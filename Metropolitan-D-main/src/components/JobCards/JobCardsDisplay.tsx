// components/JobCards/JobCardsDisplay.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Calendar,
  Clock,
  Users,
  Wrench,
  Settings,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Search,
  ChevronDown,
  X,
  Eye,
  MapPin,
  Loader2,
  Edit,
} from "lucide-react";
import {
  JobCardResponse,
  GeneratorResponse,
  EmployeeResponse,
  CreateJobCardRequest,
} from "../../types/api";
import { Modal } from "../UI/Modal";
import { JobCardDetailView } from "./JobCardDetailView";
import { EditJobCardModal } from "./EditJobCardModal";
import { apiService } from "../../services/api";

// Enhanced Searchable Generator Select Component with API Integration
interface SearchableGeneratorSelectProps {
  generators: GeneratorResponse[]; // Keep for initial load/fallback
  value: string;
  onChange: (generatorId: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchableGeneratorSelect: React.FC<SearchableGeneratorSelectProps> = ({
  generators: initialGenerators,
  value,
  onChange,
  placeholder = "Search Generator",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGenerators, setFilteredGenerators] = useState<
    GeneratorResponse[]
  >([]);
  const [selectedGenerator, setSelectedGenerator] =
    useState<GeneratorResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Handle search term changes with debouncing
  const performSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setFilteredGenerators([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await apiService.searchGenerators(term.trim());

      if (response.status && response.data) {
        setFilteredGenerators(response.data);
        setSearchError(null);
      } else {
        setSearchError(response.message || "Search failed");
        setFilteredGenerators([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Failed to search generators");
      setFilteredGenerators([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim() === "") {
      setFilteredGenerators([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = window.setTimeout(() => {
      performSearch(searchTerm);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, performSearch]);

  // Find selected generator when value changes
  useEffect(() => {
    const selected =
      initialGenerators.find((gen) => gen.generatorId === value) ||
      filteredGenerators.find((gen) => gen.generatorId === value);
    setSelectedGenerator(selected || null);
  }, [value, initialGenerators, filteredGenerators]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const selected =
      initialGenerators.find((gen) => gen.generatorId === value) ||
      filteredGenerators.find((gen) => gen.generatorId === value);

    if (selected) {
      setSelectedGenerator(selected);
    } else if (value) {
      // fetch single generator if not in local lists
      apiService.getGenerator(value).then((res) => {
        if (res.status && res.data) {
          setSelectedGenerator(res.data);
        }
      });
    } else {
      setSelectedGenerator(null);
    }
  }, [value, initialGenerators, filteredGenerators]);

  const handleSelect = (generator: GeneratorResponse) => {
    onChange(generator.generatorId);
    setSelectedGenerator(generator);
    setIsOpen(false);
    setSearchTerm("");
    setSearchError(null);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSelectedGenerator(null);
    setSearchTerm("");
    setSearchError(null);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
      setFilteredGenerators([]);
      setSearchError(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);

    // Show loading immediately for better UX
    if (newTerm.trim().length >= 2) {
      setIsSearching(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Select Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between hover:border-slate-400 transition-colors"
      >
        <span
          className={selectedGenerator ? "text-slate-900" : "text-slate-500"}
        >
          {selectedGenerator
            ? `${selectedGenerator.name} - ${selectedGenerator.capacity} KW`
            : placeholder}
        </span>
        <div className="flex items-center space-x-2">
          {selectedGenerator && (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-1"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-blue-500 absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Type at least 2 characters to search..."
                className={`w-full pl-10 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  isSearching ? "pr-10" : "pr-3"
                }`}
              />
            </div>
            {/* Search status messages */}
            {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
              <p className="text-xs text-amber-600 mt-1">
                Type at least 2 characters to search
              </p>
            )}
            {searchError && (
              <p className="text-xs text-red-600 mt-1">{searchError}</p>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {isSearching ? (
              <div className="px-3 py-4 text-slate-500 text-center">
                <Loader2 className="w-5 h-5 text-slate-400 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Searching generators...</p>
              </div>
            ) : searchError ? (
              <div className="px-3 py-4 text-red-500 text-center">
                <p className="text-sm">{searchError}</p>
                <button
                  onClick={() => {
                    setSearchError(null);
                    if (searchTerm.trim().length >= 2) {
                      performSearch(searchTerm);
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                >
                  Try again
                </button>
              </div>
            ) : filteredGenerators.length > 0 ? (
              <>
                {/* Clear selection option */}
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setSelectedGenerator(null);
                    setIsOpen(false);
                    setSearchTerm("");
                    setSearchError(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-500 border-b border-slate-100"
                >
                  Clear selection
                </button>
                {filteredGenerators.map((generator) => (
                  <button
                    key={generator.generatorId}
                    type="button"
                    onClick={() => handleSelect(generator)}
                    className={`w-full px-3 py-3 text-left hover:bg-blue-50 border-b border-slate-100 last:border-b-0 transition-colors ${
                      selectedGenerator?.generatorId === generator.generatorId
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-900"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{generator.name}</span>
                      <span className="text-sm text-slate-500">
                        {generator.capacity} KW
                        {generator.contactNumber &&
                          ` • ${generator.contactNumber}`}
                      </span>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="px-3 py-4 text-slate-500 text-center">
                <p className="text-sm">
                  {searchTerm.trim()
                    ? `No generators found matching "${searchTerm}"`
                    : "No generators available"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface JobCardsDisplayProps {
  filteredJobCards: JobCardResponse[];
  dateFilterLoading: boolean;
  showDropdown: string | null;
  setShowDropdown: (id: string | null) => void;
  openDeleteModal: (job: JobCardResponse) => void;
  formatDate: (dateString: string) => string;
  filterDate: string;
  filterType: "ALL" | "SERVICE" | "REPAIR" | "VISIT";
  clearAllFilters: () => Promise<void>;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  jobToDelete: JobCardResponse | null;
  setJobToDelete: (job: JobCardResponse | null) => void;
  deleting: boolean;
  handleDeleteJob: () => Promise<void>;
  jobType: "SERVICE" | "REPAIR" | "VISIT";
  setJobType: (type: "SERVICE" | "REPAIR" | "VISIT") => void;
  formData: CreateJobCardRequest;
  setFormData: React.Dispatch<React.SetStateAction<CreateJobCardRequest>>;
  generators: GeneratorResponse[];
  employees: EmployeeResponse[];
  filteredEmployees: EmployeeResponse[];
  employeeSearchTerm: string;
  setEmployeeSearchTerm: (term: string) => void;
  handleEmployeeToggle: (email: string) => void;
  handleCreateJob: () => Promise<void>;
  resetForm: () => void;
  creating?: boolean;
  // Add this new prop for handling job updates
  onJobUpdated?: (updatedJobCard: JobCardResponse) => void;
}

export const JobCardsDisplay: React.FC<JobCardsDisplayProps> = ({
  filteredJobCards,
  dateFilterLoading,
  showDropdown,
  setShowDropdown,
  openDeleteModal,
  formatDate,
  showCreateModal,
  setShowCreateModal,
  showDeleteModal,
  setShowDeleteModal,
  jobToDelete,
  setJobToDelete,
  deleting,
  handleDeleteJob,
  jobType,
  setJobType,
  formData,
  setFormData,
  generators,
  employees,
  filteredEmployees,
  employeeSearchTerm,
  setEmployeeSearchTerm,
  handleEmployeeToggle,
  handleCreateJob,
  resetForm,
  creating = false, // Default to false if not provided
  onJobUpdated, // Add the new prop
}) => {
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedJobCard, setSelectedJobCard] =
    useState<JobCardResponse | null>(null);
  const [isInternalCreating, setIsInternalCreating] = useState(false);

  // Add edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobCardResponse | null>(null);

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDetailView = (jobCard: JobCardResponse) => {
    setSelectedJobCard(jobCard);
    setShowDetailView(true);
    setShowDropdown(null);
  };

  const closeDetailView = () => {
    setShowDetailView(false);
    setSelectedJobCard(null);
  };

  // Add edit modal functions
  const openEditModal = (job: JobCardResponse) => {
    setJobToEdit(job);
    setShowEditModal(true);
    setShowDropdown(null);
  };

  const handleJobUpdated = (updatedJobCard: JobCardResponse) => {
    if (onJobUpdated) {
      onJobUpdated(updatedJobCard);
    }
  };

  // Handle create job with 4 second loading
  const handleCreateJobWithLoading = async () => {
    if (isInternalCreating) return; // Prevent multiple clicks

    setIsInternalCreating(true);

    try {
      await handleCreateJob();
    } catch (error) {
      console.error("Error creating job:", error);
    }

    // Ensure minimum 4 second loading time
    setTimeout(() => {
      setIsInternalCreating(false);
    }, 4000);
  };

  // Helper function to get job type styling
  const getJobTypeStyle = (jobType: string) => {
    switch (jobType) {
      case "SERVICE":
        return {
          background: "bg-green-100",
          text: "text-green-800",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
        };
      case "REPAIR":
        return {
          background: "bg-orange-100",
          text: "text-orange-800",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
        };
      case "VISIT":
        return {
          background: "bg-purple-100",
          text: "text-purple-800",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
        };
      default:
        return {
          background: "bg-gray-100",
          text: "text-gray-800",
          iconBg: "bg-gray-100",
          iconColor: "text-gray-600",
        };
    }
  };

  // Helper function to get job type icon
  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case "SERVICE":
        return <Settings className="w-6 h-6" />;
      case "REPAIR":
        return <Wrench className="w-6 h-6" />;
      case "VISIT":
        return <MapPin className="w-6 h-6" />;
      default:
        return <Settings className="w-6 h-6" />;
    }
  };

  return (
    <>
      {/* Job Cards Grid */}
      {!dateFilterLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobCards.map((job) => {
            const typeStyle = getJobTypeStyle(job.jobType);
            return (
              <div
                key={job.jobCardId}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative"
              >
                {/* Actions Dropdown */}
                <div className="absolute top-4 right-4">
                  <div className="relative">
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(
                            showDropdown === job.jobCardId
                              ? null
                              : job.jobCardId
                          );
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label="More actions"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDetailView(job)}
                        className=" px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    {showDropdown === job.jobCardId && (
                      <div
                        className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openDetailView(job)}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => openEditModal(job)}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit Job Card</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(job)}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Job Card</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-between mb-4 pr-8">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeStyle.iconBg}`}
                    >
                      <div className={typeStyle.iconColor}>
                        {getJobTypeIcon(job.jobType)}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {job.generator.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {job.generator.capacity} KW
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle.background} ${typeStyle.text}`}
                    >
                      {job.jobType}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(job.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(job.estimatedTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {job.assignedEmployees.length} employees assigned
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Assigned Employees:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {job.assignedEmployees.map((employee) => (
                      <span
                        key={employee.email}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {employee.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Created {formatDate(job.createdAt)}
                    {job.updatedAt !== job.createdAt && (
                      <span className="block">
                        Updated {formatDate(job.updatedAt)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Card Detail View Modal */}
      {showDetailView && selectedJobCard && (
        <JobCardDetailView
          jobCard={selectedJobCard}
          onClose={closeDetailView}
        />
      )}

      {/* Edit Job Card Modal */}
      {showEditModal && jobToEdit && (
        <EditJobCardModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setJobToEdit(null);
          }}
          jobCard={jobToEdit}
          generators={generators}
          employees={employees}
          onJobUpdated={handleJobUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setJobToDelete(null);
        }}
        title="Delete Job Card"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Are you sure you want to delete this job card?
              </h3>
              {jobToDelete && (
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Generator:</span>{" "}
                      {jobToDelete.generator.name}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {jobToDelete.jobType}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(jobToDelete.date)}
                    </p>
                    <p>
                      <span className="font-medium">Employees:</span>{" "}
                      {jobToDelete.assignedEmployees.length} assigned
                    </p>
                  </div>
                </div>
              )}
              <p className="text-sm text-slate-600">
                This action cannot be undone. This will permanently delete the
                job card and all related mini job card tasks assigned to
                employees.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setJobToDelete(null);
              }}
              disabled={deleting}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteJob}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Job Card</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Job Modal - Simplified */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Job Card"
        size="xl"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left Column */}
          <div className="flex-1 p-4 rounded-lg space-y-6">
            {/* Job Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Job Type
              </label>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setJobType("SERVICE")}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-colors justify-center ${
                    jobType === "SERVICE"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Service</span>
                </button>
                <button
                  onClick={() => setJobType("REPAIR")}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-colors justify-center ${
                    jobType === "REPAIR"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span className="text-sm">Repair</span>
                </button>
                <button
                  onClick={() => setJobType("VISIT")}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-colors justify-center ${
                    jobType === "VISIT"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Visit</span>
                </button>
              </div>
            </div>

            {/* Generator Selection - NOW WITH API SEARCH */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Generator
              </label>
              <SearchableGeneratorSelect
                generators={generators}
                value={formData.generatorId}
                onChange={(generatorId) =>
                  setFormData((prev) => ({
                    ...prev,
                    generatorId,
                  }))
                }
                placeholder="Search Generator"
                className="w-full"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estimated Time
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.estimatedTime.split(":")[0] || ""}
                  onChange={(e) => {
                    const hour = e.target.value;
                    const minute = formData.estimatedTime.split(":")[1] || "00";
                    setFormData((prev) => ({
                      ...prev,
                      estimatedTime: `${hour}:${minute}`,
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
                  value={formData.estimatedTime.split(":")[1] || ""}
                  onChange={(e) => {
                    const minute = e.target.value;
                    const hour = formData.estimatedTime.split(":")[0] || "00";
                    setFormData((prev) => ({
                      ...prev,
                      estimatedTime: `${hour}:${minute}`,
                    }));
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="00">Min</option>
                  {Array.from({ length: 60 / 5 }, (_, i) => {
                    const val = (i * 5).toString().padStart(2, "0");
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 p-4 rounded-lg">
            {/* Employee Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Assign Employees (max 5) - {formData.employeeEmails.length}{" "}
                selected
              </label>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={employeeSearchTerm}
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {employeeSearchTerm && (
                  <button
                    onClick={() => setEmployeeSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Selected Employees */}
              {formData.employeeEmails.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {formData.employeeEmails.map((email) => {
                      const employee = employees.find(
                        (emp) => emp.email === email
                      );
                      return employee ? (
                        <span
                          key={email}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {employee.name}
                          <button
                            onClick={() => handleEmployeeToggle(email)}
                            className="ml-1.5 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Employee List */}
              <div className="max-h-64 overflow-y-auto border border-slate-300 rounded-lg">
                {filteredEmployees.length > 0 ? (
                  <div className="p-2">
                    {filteredEmployees.map((employee) => (
                      <label
                        key={employee.email}
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          formData.employeeEmails.includes(employee.email)
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.employeeEmails.includes(
                            employee.email
                          )}
                          onChange={() => handleEmployeeToggle(employee.email)}
                          disabled={
                            !formData.employeeEmails.includes(employee.email) &&
                            formData.employeeEmails.length >= 5
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {employee.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {employee.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    <Users className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">
                      {employeeSearchTerm
                        ? `No employees found matching "${employeeSearchTerm}"`
                        : "No employees available"}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {formData.employeeEmails.length > 0 && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, employeeEmails: [] }))
                    }
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All ({formData.employeeEmails.length})
                  </button>
                  {formData.employeeEmails.length >= 5 && (
                    <span className="text-xs text-orange-600">
                      Maximum reached
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-4">
          <button
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            disabled={creating}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateJobWithLoading}
            disabled={
              isInternalCreating ||
              creating ||
              !formData.generatorId ||
              !formData.date ||
              !formData.estimatedTime ||
              formData.employeeEmails.length === 0
            }
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors flex items-center space-x-2 min-w-[140px] justify-center"
          >
            {isInternalCreating || creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Job Card</span>
            )}
          </button>
        </div>
      </Modal>
    </>
  );
};