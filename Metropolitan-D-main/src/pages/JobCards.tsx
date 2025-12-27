// Updated src/pages/JobCards.tsx - Add these changes to your existing file

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Settings } from "lucide-react";
import { format } from "date-fns-tz";
import { apiService } from "../services/api";
import {
  JobCardResponse,
  GeneratorResponse,
  EmployeeResponse,
  CreateJobCardRequest,
} from "../types/api";
import { LoadingSpinner } from "../components/UI/LoadingSpinner";
import { JobCardsDisplay } from "../components/JobCards/JobCardsDisplay";
import { JobCardsFilters } from "../components/JobCards/JobCardsFilters";

export const JobCards: React.FC = () => {
  const [jobCards, setJobCards] = useState<JobCardResponse[]>([]);
  const [generators, ] = useState<GeneratorResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "SERVICE" | "REPAIR" | "VISIT">("ALL");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterGeneratorName, setFilterGeneratorName] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobCardResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [jobType, setJobType] = useState<"SERVICE" | "REPAIR" | "VISIT">("SERVICE");
  const [formData, setFormData] = useState<CreateJobCardRequest>({
    generatorId: "",
    date: "",
    estimatedTime: "",
    employeeEmails: [],
  });
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [dateFilterLoading, setDateFilterLoading] = useState(false);
  
  // New state for employee search
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeResponse[]>([]);

  // Get Sri Lankan today's date
  const getSriLankanToday = useCallback(() => {
    return format(new Date(), "yyyy-MM-dd", {
      timeZone: "Asia/Colombo",
    });
  }, []);

  // Extract unique generator names from job cards
  const availableGenerators = useMemo(() => {
    const generators = jobCards.map(card => card.generator.name);
    return [...new Set(generators)].sort();
  }, [jobCards]);

  // Apply all filters to job cards
  const filteredJobCards = useMemo(() => {
    return jobCards.filter(card => {
      // Filter by job type
      const matchesType = filterType === "ALL" || card.jobType === filterType;
      
      // Filter by generator name
      const matchesGenerator = !filterGeneratorName || 
        card.generator.name.toLowerCase().includes(filterGeneratorName.toLowerCase());
      
      return matchesType && matchesGenerator;
    });
  }, [jobCards, filterType, filterGeneratorName]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter employees based on search term
  useEffect(() => {
    const nonAdminEmployees = employees.filter((employee) => employee.role !== "ADMIN");
    
    if (employeeSearchTerm.trim() === '') {
      setFilteredEmployees(nonAdminEmployees);
    } else {
      const filtered = nonAdminEmployees.filter(employee =>
        employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(employeeSearchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [employeeSearchTerm, employees]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const employeesRes = await apiService.getAllEmployees();

      if (employeesRes.status && employeesRes.data) {
        setEmployees(employeesRes.data);
      }

      // Automatically load today's job cards on page load/reload
      const todayDate = getSriLankanToday();
      setFilterDate(todayDate);
      await loadJobCardsByDate(todayDate);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllJobCards = async () => {
    try {
      const jobCardsRes = await apiService.getAllJobCards();
      if (jobCardsRes.status && jobCardsRes.data) {
        setJobCards(jobCardsRes.data);
      }
    } catch (error) {
      console.error("Error loading job cards:", error);
    }
  };

  const loadJobCardsByDate = async (date: string) => {
    try {
      setDateFilterLoading(true);
      const jobCardsRes = await apiService.getJobCardsByDate(date);
      if (jobCardsRes.status && jobCardsRes.data) {
        setJobCards(jobCardsRes.data);
      }
    } catch (error) {
      console.error("Error loading job cards by date:", error);
    } finally {
      setDateFilterLoading(false);
    }
  };

  const handleDateFilterChange = async (date: string) => {
    setFilterDate(date);

    if (date) {
      await loadJobCardsByDate(date);
    } else {
      await loadAllJobCards();
    }
  };

  const handleCreateJob = async () => {
    try {
      let response;
      switch (jobType) {
        case "SERVICE":
          response = await apiService.createServiceJob(formData);
          break;
        case "REPAIR":
          response = await apiService.createRepairJob(formData);
          break;
        case "VISIT":
          response = await apiService.createVisitJob(formData);
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }

      if (response.status) {
        if (filterDate) {
          await loadJobCardsByDate(filterDate);
        } else {
          await loadAllJobCards();
        }
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating job:", error);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      setDeleting(true);
      const response = await apiService.deleteJobCard(jobToDelete.jobCardId);

      if (response.status) {
        if (filterDate) {
          await loadJobCardsByDate(filterDate);
        } else {
          await loadAllJobCards();
        }
        setShowDeleteModal(false);
        setJobToDelete(null);
      } else {
        alert("Failed to delete job card: " + (response.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job card. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Add this new function to handle job updates
  const handleJobUpdated = async (updatedJobCard: JobCardResponse) => {
    try {
      // Update the job card in the local state
      setJobCards(prevJobCards =>
        prevJobCards.map(job =>
          job.jobCardId === updatedJobCard.jobCardId ? updatedJobCard : job
        )
      );
      console.log('Job card updated successfully');
    } catch (error) {
      console.error('Error handling job card update:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      generatorId: "",
      date: "",
      estimatedTime: "",
      employeeEmails: [],
    });
    setEmployeeSearchTerm('');
  };

  const handleEmployeeToggle = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      employeeEmails: prev.employeeEmails.includes(email)
        ? prev.employeeEmails.filter((e) => e !== email)
        : [...prev.employeeEmails, email].slice(0, 5),
    }));
  };

  const clearAllFilters = async () => {
    setFilterType("ALL");
    setFilterDate("");
    setFilterGeneratorName("");
    await loadAllJobCards();
  };

  const setTodayFilter = async () => {
    const today = getSriLankanToday();
    setFilterDate(today);
    await loadJobCardsByDate(today);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openDeleteModal = (job: JobCardResponse) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
    setShowDropdown(null);
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
          <h1 className="text-3xl font-bold text-slate-900 ml-4">Job Cards</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Job</span>
        </button>
      </div>

      {/* Filters Component */}
      <JobCardsFilters 
        filterType={filterType}
        setFilterType={setFilterType}
        filterDate={filterDate}
        handleDateFilterChange={handleDateFilterChange}
        filterGeneratorName={filterGeneratorName}
        setFilterGeneratorName={setFilterGeneratorName}
        setTodayFilter={setTodayFilter}
        clearAllFilters={clearAllFilters}
        dateFilterLoading={dateFilterLoading}
        filteredJobCards={filteredJobCards}
        formatDate={formatDate}
        availableGenerators={availableGenerators}
      />

      {/* Loading state for date filtering */}
      {dateFilterLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-slate-600">Loading job cards...</span>
        </div>
      )}

      {/* Job Cards Display Component */}
      <JobCardsDisplay
        filteredJobCards={filteredJobCards}
        dateFilterLoading={dateFilterLoading}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        openDeleteModal={openDeleteModal}
        formatDate={formatDate}
        filterDate={filterDate}
        filterType={filterType}
        clearAllFilters={clearAllFilters}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        jobToDelete={jobToDelete}
        setJobToDelete={setJobToDelete}
        deleting={deleting}
        handleDeleteJob={handleDeleteJob}
        jobType={jobType}
        setJobType={setJobType}
        formData={formData}
        setFormData={setFormData}
        generators={generators}
        employees={employees}
        filteredEmployees={filteredEmployees}
        employeeSearchTerm={employeeSearchTerm}
        setEmployeeSearchTerm={setEmployeeSearchTerm}
        handleEmployeeToggle={handleEmployeeToggle}
        handleCreateJob={handleCreateJob}
        resetForm={resetForm}
        // Add the new prop for handling job updates
        onJobUpdated={handleJobUpdated}
      />

      {!dateFilterLoading && filteredJobCards.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            {filterDate && filterType !== "ALL" && filterGeneratorName
              ? `No ${filterType.toLowerCase()} job cards for ${formatDate(filterDate)} with generator "${filterGeneratorName}"`
              : filterDate && filterType !== "ALL"
              ? `No ${filterType.toLowerCase()} job cards for ${formatDate(filterDate)}`
              : filterDate && filterGeneratorName
              ? `No job cards for ${formatDate(filterDate)} with generator "${filterGeneratorName}"`
              : filterDate
              ? `No job cards for ${formatDate(filterDate)}`
              : filterType !== "ALL" && filterGeneratorName
              ? `No ${filterType.toLowerCase()} job cards with generator "${filterGeneratorName}"`
              : filterType !== "ALL"
              ? `No ${filterType.toLowerCase()} job cards found`
              : filterGeneratorName
              ? `No job cards with generator "${filterGeneratorName}"`
              : "No job cards found"}
          </p>
          {(filterType !== "ALL" || filterDate || filterGeneratorName) && (
            <button
              onClick={clearAllFilters}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};