import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Zap,
  Loader2,
  AlertTriangle,
  X,
  Eye,
  FileText,
  Calendar,
  User,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { apiService } from "../services/api";
import {
  GeneratorResponse,
  CreateGeneratorRequest,
  JobCardResponse,
} from "../types/api";
import { LoadingSpinner } from "../components/UI/LoadingSpinner";
import { Modal } from "../components/UI/Modal";

export const Generators: React.FC = () => {
  const [generators, setGenerators] = useState<GeneratorResponse[]>([]);
  const [filteredGenerators, setFilteredGenerators] = useState<
    GeneratorResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJobCardsModal, setShowJobCardsModal] = useState(false);
  const [editingGenerator, setEditingGenerator] =
    useState<GeneratorResponse | null>(null);
  const [selectedGenerator, setSelectedGenerator] =
    useState<GeneratorResponse | null>(null);
  const [jobCards, setJobCards] = useState<JobCardResponse[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(false);
  const [jobCardsError, setJobCardsError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateGeneratorRequest>({
    name: "",
    capacity: "",
    contactNumber: "",
    email: "",
    description: "",
  });

  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    loadGenerators();
  }, []);

  // Enhanced search with API integration
  const performSearch = useCallback(
    async (term: string) => {
      if (term.trim().length === 0) {
        setFilteredGenerators(generators);
        setIsSearching(false);
        setSearchError(null);
        return;
      }

      if (term.trim().length < 2) {
        setFilteredGenerators([]);
        setIsSearching(false);
        setSearchError(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        // Use the search API endpoint
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
    },
    [generators]
  );

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
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

  const loadGenerators = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllGenerators();
      if (response.status && response.data) {
        setGenerators(response.data);
        setFilteredGenerators(response.data); // Show all initially
      }
    } catch (error) {
      console.error("Error loading generators:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobCards = async (generatorId: string) => {
    try {
      setLoadingJobCards(true);
      setJobCardsError(null);
      const response = await apiService.getJobCardsByGenerator(generatorId);
      if (response.status && response.data) {
        setJobCards(response.data);
      } else {
        setJobCardsError(response.message || "Failed to load job cards");
        setJobCards([]);
      }
    } catch (error) {
      console.error("Error loading job cards:", error);
      setJobCardsError("Failed to load job cards");
      setJobCards([]);
    } finally {
      setLoadingJobCards(false);
    }
  };

  const handleViewJobCards = async (generator: GeneratorResponse) => {
    setSelectedGenerator(generator);
    setShowJobCardsModal(true);
    await loadJobCards(generator.generatorId);
  };

  const handleCreate = async () => {
    try {
      const response = await apiService.createGenerator(formData);
      if (response.status) {
        await loadGenerators();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating generator:", error);
    }
  };

  const handleEdit = (generator: GeneratorResponse) => {
    setEditingGenerator(generator);
    setFormData({
      name: generator.name,
      capacity: generator.capacity,
      contactNumber: generator.contactNumber,
      email: generator.email,
      description: generator.description,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGenerator) return;

    try {
      const response = await apiService.updateGenerator(
        editingGenerator.generatorId,
        formData
      );
      if (response.status) {
        await loadGenerators();
        setShowEditModal(false);
        setEditingGenerator(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error updating generator:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this generator?")) return;

    try {
      const response = await apiService.deleteGenerator(id);
      if (response.status) {
        await loadGenerators();
      }
    } catch (error) {
      console.error("Error deleting generator:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      capacity: "",
      contactNumber: "",
      email: "",
      description: "",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (timeString: string) => {
    // Convert "01:00:00" format to "1 hour" readable format
    const [hours, minutes] = timeString.split(":");
    const h = parseInt(hours);
    const m = parseInt(minutes);

    if (h > 0 && m > 0) {
      return `${h}h ${m}m`;
    } else if (h > 0) {
      return `${h}h`;
    } else if (m > 0) {
      return `${m}m`;
    } else {
      return timeString;
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

  const clearSearch = () => {
    setSearchTerm("");
    setSearchError(null);
    setFilteredGenerators(generators);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 ml-4">Generators</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Generator</span>
        </button>
      </div>

      {/* Enhanced Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          {isSearching && (
            <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
          )}
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <input
            type="text"
            placeholder="Search generators by name (type at least 2 characters)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`w-full pl-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isSearching ? "pr-16" : searchTerm ? "pr-10" : "pr-4"
            }`}
          />
        </div>

        {/* Search Status Messages */}
        {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
          <p className="text-sm text-amber-600 mt-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
            Type at least 2 characters to search
          </p>
        )}
        {searchError && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-red-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
              {searchError}
            </p>
            <button
              onClick={() => {
                setSearchError(null);
                if (searchTerm.trim().length >= 2) {
                  performSearch(searchTerm);
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
        {isSearching && (
          <p className="text-sm text-blue-600 mt-2 flex items-center">
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            Searching generators...
          </p>
        )}
      </div>

      {/* Generators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGenerators.map((generator) => (
          <div
            key={generator.generatorId}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {generator.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {generator.capacity} KW
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleViewJobCards(generator)}
                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="View Job Cards"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(generator)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Generator"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(generator.generatorId)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Generator"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
              {generator.description}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{generator.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{generator.contactNumber}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Added {formatDate(generator.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Empty State */}
      {!isSearching && filteredGenerators.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchTerm.trim()
              ? "No generators found"
              : "No generators available"}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchTerm.trim()
              ? `No generators match "${searchTerm}"`
              : "Start by adding your first generator"}
          </p>
          {searchTerm.trim() ? (
            <button
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search to see all generators
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Generator</span>
            </button>
          )}
        </div>
      )}

      {/* Job Cards Modal */}
      <Modal
        isOpen={showJobCardsModal}
        onClose={() => {
          setShowJobCardsModal(false);
          setSelectedGenerator(null);
          setJobCards([]);
          setJobCardsError(null);
        }}
        title={`Job Cards - ${selectedGenerator?.name || ""}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Generator Info Header */}
          {selectedGenerator && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {selectedGenerator.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedGenerator.capacity} KW
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingJobCards && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-slate-600">Loading job cards...</span>
            </div>
          )}

          {/* Error State */}
          {jobCardsError && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Failed to load job cards
              </h3>
              <p className="text-slate-500 mb-4">{jobCardsError}</p>
              <button
                onClick={() =>
                  selectedGenerator &&
                  loadJobCards(selectedGenerator.generatorId)
                }
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {/* Job Cards List */}
          {!loadingJobCards && !jobCardsError && (
            <>
              {jobCards.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No job cards found
                  </h3>
                  <p className="text-slate-500">
                    No job cards have been created for this generator yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-slate-900">
                      {jobCards.length} Job Card
                      {jobCards.length !== 1 ? "s" : ""}
                    </h4>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {jobCards.map((jobCard) => (
                      <div
                        key={jobCard.jobCardId}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-medium text-slate-900">
                                {jobCard.jobType || "Job Card"} -{" "}
                                {jobCard.jobCardId.slice(-8)}
                              </h5>
                              <p className="text-sm text-slate-500">
                                Job ID: {jobCard.jobId}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {jobCard.jobType}
                            </span>
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">Date:</span>
                              <span className="font-medium">
                                {formatDate(jobCard.date)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">
                                Estimated Time:
                              </span>
                              <span className="font-medium">
                                {formatTime(jobCard.estimatedTime)}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-slate-500">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-3 h-3" />
                              <span>
                                Created: {formatDateTime(jobCard.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assigned Employees */}
                        {jobCard.assignedEmployees &&
                          jobCard.assignedEmployees.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                                Assigned Employees (
                                {jobCard.assignedEmployees.length})
                              </h6>
                              <div className="space-y-2">
                                {jobCard.assignedEmployees.map((employee) => (
                                  <div
                                    key={employee.email}
                                    className="bg-white shadow-sm rounded-xl p-4 border border-slate-200 hover:shadow-md transition"
                                  >
                                    {/* Header - Name + Email */}
                                    <div className="flex items-center space-x-2 mb-2">
                                      <User className="w-5 h-5 text-slate-500" />
                                      <p className="font-semibold text-slate-900 text-sm">
                                        {employee.name}{" "}
                                        <span className="text-slate-500 font-normal">
                                          ({employee.email})
                                        </span>
                                      </p>
                                    </div>

                                    {/* Contact Number */}
                                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                                      <Phone className="w-4 h-4 text-slate-500" />
                                      <span>{employee.contactNumber}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Employee Emails (if different from assigned employees) */}
                        {/* {jobCard.employeeEmails &&
                          jobCard.employeeEmails.length > 0 && (
                            <div className="text-xs text-slate-500">
                              <span className="font-medium">
                                Notified Emails:{" "}
                              </span>
                              <span>{jobCard.employeeEmails.join(", ")}</span>
                            </div>
                          )} */}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => {
                setShowJobCardsModal(false);
                setSelectedGenerator(null);
                setJobCards([]);
                setJobCardsError(null);
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Add New Generator"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Generator Unit 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Capacity (KW)
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, capacity: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="500KW"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="gen1@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactNumber: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1234567890"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Main backup generator for building A"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Generator
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingGenerator(null);
          resetForm();
        }}
        title="Edit Generator"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Capacity (KW)
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, capacity: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactNumber: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingGenerator(null);
                resetForm();
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
