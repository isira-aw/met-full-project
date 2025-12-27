// API Response Types
export interface ApiResponse<T> {
  success: GeneratorResponse[];
  employeeEmail: ApiResponse<EmployeeTimeReportResponse>;
  status: boolean;
  message: string;
  data: T;
  error?: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  contactNumber: string;
  role: 'ADMIN' | 'EMPLOYEE';
  password: string;
}

// Legacy auth response - kept for backward compatibility
export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  contactNumber: string;
}

// New auth response with access token and refresh token support
export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  contactNumber: string;
  authenticated: boolean;
}

// Refresh token request
export interface RefreshTokenRequest {
  refreshToken?: string; // Optional, as it can come from HttpOnly cookie
}

// Refresh token response
export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
}

// Forgot Password Types
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  email?: string;
  message: string;
}

// Employee Types
export interface EmployeeResponse {
  email: string;
  name: string;
  contactNumber: string;
  role: 'ADMIN' | 'EMPLOYEE';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEmployeeRequest {
  name: string;
  contactNumber: string;
  role: 'ADMIN' | 'EMPLOYEE';
  password?: string;
}

// Generator Types
export interface GeneratorResponse {
  generatorId: string;
  name: string;
  capacity: string;
  contactNumber: string;
  email: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGeneratorRequest {
  name: string;
  capacity: string;
  contactNumber: string;
  email: string;
  description: string;
}

// Job Card Types - Updated to include VISIT
export interface JobCardResponse {
  title: string;
  description: string;
  assignedTo: string;
  priority: string;
  scheduledDate: string;
  status: string;
  jobCardId: string;
  jobId: string;
  generator: GeneratorResponse;
  jobType: 'SERVICE' | 'REPAIR' | 'VISIT';
  date: string;
  estimatedTime: string;
  employeeEmails: string[];
  assignedEmployees: EmployeeResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobCardRequest {
  generatorId: string;
  date: string;
  estimatedTime: string;
  employeeEmails: string[];
}

// Mini Job Card Types
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD' | 'ASSIGNED' | 'TRAVELING';

export interface MiniJobCardResponse {
  updatedTime?: string;
  generatorName?: string;
  estimatedTime: string;
  miniJobCardId: string;
  jobCardId: string;
  employeeEmail: string;
  employeeName: string;
  status: TaskStatus;
  date: string;
  location: string;
  time: string;
  createdAt: string;
  updatedAt: string;
  // Weight and attachment fields
  weightLimit: number;
  hasAttachment: boolean;
  attachmentOriginalName: string | null;
}

export interface UpdateMiniJobCardRequest {
  estimatedTime?: string;
  status?: TaskStatus;
  location?: string;
  time?: string;
  date?: string;
}

export interface CreateMiniJobCardRequest {
  jobCardId: string;
  employeeEmail: string;
  date: string;
  location?: string;
  time?: string;
}

// Activity Log Types
export interface LogResponse {
  generatorName: string;
  logId: string;
  employeeEmail: string;
  employeeName: string;
  action: string;
  date: string;
  time: string;
  status: string;
  location: string;
  createdAt: string;
}

// Health Check Types
export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

// Report request interface
export interface ReportRequest {
  employeeEmail: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string;   // Format: YYYY-MM-DD
}

export interface EmployeeTimeReportResponse {
  employeeEmail: string;
  employeeName: string;
  reportStartDate: string;
  reportEndDate: string;
  totalJobCards: number;
  totalTimeSpent: TimeSpentSummary;
  jobCards: JobCardTimeDetails[];
  generatedAt: string;
}

export interface TimeSpentSummary {
  totalOnHoldTime: string;
  totalInProgressTime: string;
  totalAssignedTime: string;
  totalCombinedTime: string;
  totalOnHoldMinutes: number;
  totalInProgressMinutes: number;
  totalAssignedMinutes: number;
  totalCombinedMinutes: number;
}

export interface JobCardTimeDetails {
  miniJobCardId: string;
  jobCardId: string;
  jobCardTitle: string;
  currentStatus: string;
  date: string;
  location: string;
  timeSpentOnHold: string;
  timeSpentInProgress: string;
  timeSpentAssigned: string;
  onHoldMinutes: number;
  inProgressMinutes: number;
  assignedMinutes: number;
  totalMinutes: number;
  createdAt: string;
  updatedAt: string;
}
// Daily report data interface
export interface ReportDataResponse {
  date: string;
  generatorNames: string;
  firstActionLocation: string;
  lastActionLocation: string;
  fullWorkingTime: number;
  morningOTTime: number;
  eveningOTTime: number;
  totalOTTime: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// Pagination types
export interface PaginationParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Filter types - Updated to include VISIT
export interface EmployeeFilter {
  role?: 'ADMIN' | 'EMPLOYEE';
  search?: string;
}

export interface JobCardFilter {
  jobType?: 'SERVICE' | 'REPAIR' | 'VISIT';
  dateFrom?: string;
  dateTo?: string;
  generatorId?: string;
  employeeEmail?: string;
}

export interface LogFilter {
  employeeEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  action?: string;
  status?: string;
}

//gen email sending
export interface SendJobCardEmailRequest {
  jobCardId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
}

export interface EmailResponse {
  emailId: string;
  jobCardId: string;
  recipientEmail: string;
  subject: string;
  sentAt: string;
  status: "SENT" | "FAILED" | "PENDING";
}

export interface OTReportRequest {
  employeeEmail: string;
  startDate: string;
  endDate: string;
}

// Updated interfaces to match the backend response with location arrays

export interface OTRecord {
  date: string;
  firstTime: string;
  lastTime: string;
  firstLocation: string;
  lastLocation: string;
  morningOT: string;
  eveningOT: string;
  dailyTotalOT: string;
  onHoldTime: string;
  assignedTime: string;
  inProgressTime: string;
  currentStatus: string;
  lastStatus: string;
  allLocations: string[];
  locationsSummary: string;
}

export interface OTReportResponse {
  data: OTReportResponse;
  employeeEmail: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  otRecords: OTRecord[];
  totalMorningOT: string;
  totalEveningOT: string;
  totalOT: string;
  totalOnHoldTime: string;
  totalAssignedTime: string;
  totalInProgressTime: string;
}

// end section button

export interface EndSessionRequest {
  employeeEmail: string;
  date: string;
  endTime: string;
  endLocation: string;
}

export interface EndSessionResponse {
  success: boolean;
  message: string;
  morningOT?: string;
  eveningOT?: string;
}