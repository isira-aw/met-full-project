// components/JobCards/JobCardsFilters.tsx
import React, { useState } from "react";
import { 
  Filter, 
  Calendar, 
  X, 
  Settings, 
  Wrench, 
  MapPin,
  RotateCcw,
  ChevronDown,
  Zap
} from "lucide-react";
import { format } from "date-fns-tz";
import { JobCardResponse } from "../../types/api";

interface JobCardsFiltersProps {
  filterType: "ALL" | "SERVICE" | "REPAIR" | "VISIT";
  setFilterType: (type: "ALL" | "SERVICE" | "REPAIR" | "VISIT") => void;
  filterDate: string;
  handleDateFilterChange: (date: string) => void;
  filterGeneratorName: string;
  setFilterGeneratorName: (name: string) => void;
  setTodayFilter: () => Promise<void>;
  clearAllFilters: () => Promise<void>;
  dateFilterLoading: boolean;
  filteredJobCards: JobCardResponse[];
  formatDate: (dateString: string) => string;
  availableGenerators?: string[]; // Optional list of generator names for suggestions
}

export const JobCardsFilters: React.FC<JobCardsFiltersProps> = ({
  filterType,
  setFilterType,
  filterDate,
  handleDateFilterChange,
  filterGeneratorName,
  setFilterGeneratorName,
  clearAllFilters,
  dateFilterLoading,
  filteredJobCards,
  formatDate,
  availableGenerators = [],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGeneratorDropdownOpen, setIsGeneratorDropdownOpen] = useState(false);

  const getFilterTypeDisplay = () => {
    switch (filterType) {
      case "SERVICE":
        return { label: "Service", icon: <Settings className="w-4 h-4 text-green-600" /> };
      case "REPAIR":
        return { label: "Repair", icon: <Wrench className="w-4 h-4 text-orange-600" /> };
      case "VISIT":
        return { label: "Visit", icon: <MapPin className="w-4 h-4 text-purple-600" /> };
      default:
        return { label: "All Types", icon: null };
    }
  };

  // Fixed Today function that uses proper Sri Lanka timezone
  const handleTodayClick = () => {
    const today = format(new Date(), "yyyy-MM-dd", {
      timeZone: "Asia/Colombo",
    });
    handleDateFilterChange(today);
  };

  // Filter available generators based on search input
  const filteredGenerators = availableGenerators.filter(generator =>
    generator.toLowerCase().includes(filterGeneratorName.toLowerCase())
  );

  const currentFilter = getFilterTypeDisplay();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {filteredJobCards.length} {filteredJobCards.length === 1 ? "result" : "results"}
          </span>
        </div>
        {(filterType !== "ALL" || filterDate || filterGeneratorName) && (
          <button
            onClick={clearAllFilters}
            disabled={dateFilterLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Job Type Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Job Type
          </label>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg hover:border-slate-400 bg-white text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <div className="flex items-center space-x-2">
              {currentFilter.icon}
              <span className="text-slate-900">{currentFilter.label}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-20">
              <button
                onClick={() => {setFilterType("ALL"); setIsDropdownOpen(false);}}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg transition-colors ${
                  filterType === "ALL" ? "bg-blue-50 text-blue-700" : "text-slate-700"
                }`}
              >
                <span>All Types</span>
                {filterType === "ALL" && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
              </button>
              
              <button
                onClick={() => {setFilterType("SERVICE"); setIsDropdownOpen(false);}}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  filterType === "SERVICE" ? "bg-green-50 text-green-700" : "text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Service</span>
                </div>
                {filterType === "SERVICE" && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
              </button>
              
              <button
                onClick={() => {setFilterType("REPAIR"); setIsDropdownOpen(false);}}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  filterType === "REPAIR" ? "bg-orange-50 text-orange-700" : "text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4" />
                  <span>Repair</span>
                </div>
                {filterType === "REPAIR" && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
              </button>
              
              <button
                onClick={() => {setFilterType("VISIT"); setIsDropdownOpen(false);}}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 last:rounded-b-lg transition-colors ${
                  filterType === "VISIT" ? "bg-purple-50 text-purple-700" : "text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Visit</span>
                </div>
                {filterType === "VISIT" && <div className="w-2 h-2 bg-purple-500 rounded-full"></div>}
              </button>
            </div>
          )}
        </div>

        {/* Generator Name Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Generator Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={filterGeneratorName}
              onChange={(e) => {
                setFilterGeneratorName(e.target.value);
                setIsGeneratorDropdownOpen(true);
              }}
              onFocus={() => setIsGeneratorDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsGeneratorDropdownOpen(false), 150)}
              placeholder="Type to search generators..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
            />
            <Zap className="absolute inset-y-0 right-0 pr-3 flex items-center w-4 h-4 text-slate-400 pointer-events-none" />
            {filterGeneratorName && (
              <button
                onClick={() => setFilterGeneratorName("")}
                className="absolute inset-y-0 right-6 pr-2 flex items-center text-slate-400 hover:text-slate-600"
                title="Clear generator filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Generator Suggestions Dropdown */}
          {isGeneratorDropdownOpen && availableGenerators.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
              {filteredGenerators.length > 0 ? (
                filteredGenerators.slice(0, 10).map((generator, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setFilterGeneratorName(generator);
                      setIsGeneratorDropdownOpen(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-left first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span className="text-slate-700">{generator}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500">
                  No generators found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Filter by Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              disabled={dateFilterLoading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm pr-8"
            />
            {filterDate && (
              <button
                onClick={() => handleDateFilterChange("")}
                disabled={dateFilterLoading}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
                title="Clear date"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Today Button */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Quick Filter
          </label>
          <button
            onClick={handleTodayClick}
            disabled={dateFilterLoading}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-4 h-4" />
            <span>Today</span>
          </button>
        </div>

        {/* Loading Indicator / Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <div className="flex items-center justify-center h-10">
            {dateFilterLoading ? (
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                Filters ready
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filterType !== "ALL" || filterDate || filterGeneratorName) && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-medium text-slate-700">Active Filters:</span>
            {filterType !== "ALL" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <span className="mr-2">{filterType}</span>
                <button
                  onClick={() => setFilterType("ALL")}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterGeneratorName && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                <Zap className="w-3 h-3 mr-1" />
                <span className="mr-2">{filterGeneratorName}</span>
                <button
                  onClick={() => setFilterGeneratorName("")}
                  className="text-amber-600 hover:text-amber-800 transition-colors"
                  title="Remove generator filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterDate && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <span className="mr-2">{formatDate(filterDate)}</span>
                <button
                  onClick={() => handleDateFilterChange("")}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};