// src/components/JobCards/EditJobCardModal.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Calendar,
  Clock,
  Users,
  Wrench,
  Settings,
  Search,
  ChevronDown,
  X,
  MapPin,
  Loader2,
  Save,
} from "lucide-react";
import {
  JobCardResponse,
  GeneratorResponse,
  EmployeeResponse,
} from "../../types/api";
import Modal from "../ui/Modal";
import { apiService } from "../../services/api";

// Enhanced Searchable Generator Select Component
interface SearchableGeneratorSelectProps {
  generators: GeneratorResponse[];
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
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim() === "") {
      setFilteredGenerators([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, performSearch]);

  useEffect(() => {
    const selected =
      initialGenerators.find((gen) => gen.generatorId === value) ||
      filteredGenerators.find((gen) => gen.generatorId === value);

    if (selected) {
      setSelectedGenerator(selected);
    } else if (value) {
      apiService.getGenerator(value).then((res) => {
        if (res.status && res.data) {
          setSelectedGenerator(res.data);
        }
      });
    } else {
      setSelectedGenerator(null);
    }
  }, [value, initialGenerators, filteredGenerators]);

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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

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

    if (newTerm.trim().length >= 2) {
      setIsSearching(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
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

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
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
            {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
              <p className="text-xs text-amber-600 mt-1">
                Type at least 2 characters to search
              </p>
            )}
            {searchError && (
              <p className="text-xs text-red-600 mt-1">{searchError}</p>
            )}
          </div>

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

interface EditJobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: JobCardResponse;
  generators: GeneratorResponse[];
  employees: EmployeeResponse[];
  onJobUpdated: (updatedJobCard: JobCardResponse) => void;
}

export const EditJobCardModal: React.FC<EditJobCardModalProps> = ({
  isOpen,
  onClose,
  jobCard,
  generators,
  employees,
  onJobUpdated,
}) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    generatorId: "",
    jobType: "SERVICE" as "SERVICE" | "REPAIR" | "VISIT",
    date: "",
    estimatedTime: "",
    employeeEmails: [] as string[],
  });

  // Initialize form data when modal opens or jobCard changes
  useEffect(() => {
    if (jobCard && isOpen) {
      setFormData({
        generatorId: jobCard.generator.generatorId,
        jobType: jobCard.jobType,
        date: jobCard.date,
        estimatedTime: jobCard.estimatedTime,
        employeeEmails: jobCard.employeeEmails || [],
      });
      setError(null);
    }
  }, [jobCard, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmployeeSearchTerm("");
      setError(null);
      setUpdating(false);
    }
  }, [isOpen]);

  // Filter employees based on search term (excluding admins)
  const filteredEmployees = employees
    .filter((employee) => employee.role !== "ADMIN")
    .filter((employee) =>
      employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    );

  const handleEmployeeToggle = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      employeeEmails: prev.employeeEmails.includes(email)
        ? prev.employeeEmails.filter((e) => e !== email)
        : prev.employeeEmails.length < 20
        ? [...prev.employeeEmails, email]
        : prev.employeeEmails,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.generatorId || !formData.date || !formData.estimatedTime) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.employeeEmails.length === 0) {
      setError("At least one employee must be assigned");
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const response = await apiService.updateJobCard(jobCard.jobCardId, {
        generatorId: formData.generatorId,
        jobType: formData.jobType,
        date: formData.date,
        estimatedTime: formData.estimatedTime,
        employeeEmails: formData.employeeEmails,
      });

      if (response.status && response.data) {
        onJobUpdated(response.data);
        onClose();
      } else {
        setError(response.message || "Failed to update job card");
      }
    } catch (error) {
      console.error("Error updating job card:", error);
      setError("Failed to update job card. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to get job type styling
  const getJobTypeStyle = (jobType: string, isSelected: boolean) => {
    const baseClasses = "flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-colors justify-center";
    
    switch (jobType) {
      case "SERVICE":
        return isSelected
          ? `${baseClasses} border-green-500 bg-green-50 text-green-700`
          : `${baseClasses} border-slate-200 hover:border-green-300`;
      case "REPAIR":
        return isSelected
          ? `${baseClasses} border-orange-500 bg-orange-50 text-orange-700`
          : `${baseClasses} border-slate-200 hover:border-orange-300`;
      case "VISIT":
        return isSelected
          ? `${baseClasses} border-purple-500 bg-purple-50 text-purple-700`
          : `${baseClasses} border-slate-200 hover:border-purple-300`;
      default:
        return `${baseClasses} border-slate-200 hover:border-slate-300`;
    }
  };

  const isFormValid = 
    formData.generatorId &&
    formData.date &&
    formData.estimatedTime &&
    formData.employeeEmails.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Job Card" size="xl">
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
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, jobType: "SERVICE" }))}
                className={getJobTypeStyle("SERVICE", formData.jobType === "SERVICE")}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Service</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, jobType: "REPAIR" }))}
                className={getJobTypeStyle("REPAIR", formData.jobType === "REPAIR")}
              >
                <Wrench className="w-4 h-4" />
                <span className="text-sm">Repair</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, jobType: "VISIT" }))}
                className={getJobTypeStyle("VISIT", formData.jobType === "VISIT")}
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Visit</span>
              </button>
            </div>
          </div>

          {/* Generator Selection */}
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

        {/* Right Column - Employee Selection */}
        <div className="flex-1 p-4 rounded-lg">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Assign Employees (max 20) - {formData.employeeEmails.length} selected
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
                    const employee = employees.find((emp) => emp.email === email);
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
                        checked={formData.employeeEmails.includes(employee.email)}
                        onChange={() => handleEmployeeToggle(employee.email)}
                        disabled={
                          !formData.employeeEmails.includes(employee.email) &&
                          formData.employeeEmails.length >= 20
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
                {formData.employeeEmails.length >= 20 && (
                  <span className="text-xs text-orange-600">Maximum reached</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-4">
        <button
          onClick={onClose}
          disabled={updating}
          className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={updating || !isFormValid}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors flex items-center space-x-2 min-w-[140px] justify-center"
        >
          {updating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Update Job Card</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};