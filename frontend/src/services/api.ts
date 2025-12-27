import apiClient from './apiClient';
import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthTokenResponse,
  RefreshTokenResponse,
  EmployeeResponse,
  UpdateEmployeeRequest,
  GeneratorResponse,
  CreateGeneratorRequest,
  JobCardResponse,
  CreateJobCardRequest,
  MiniJobCardResponse,
  UpdateMiniJobCardRequest,
  CreateMiniJobCardRequest,
  LogResponse,
  HealthResponse,
  ReportRequest,
  ResetPasswordRequest,
  ForgotPasswordRequest,
  SendJobCardEmailRequest,
  EmailResponse,
  EmployeeTimeReportResponse,
  OTReportRequest,
  OTReportResponse,
  EndSessionRequest,
  EndSessionResponse,
} from "../types/api";

/**
 * API Service Class
 *
 * Centralized service for all API calls using Axios.
 * All methods automatically include:
 * - Access token in Authorization header
 * - Automatic token refresh on 401 errors
 * - Error handling
 */

class ApiService {
  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================

  /**
   * Login with email and password.
   * Returns access token in response and refresh token in HttpOnly cookie.
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthTokenResponse>> {
    const response = await apiClient.post<ApiResponse<AuthTokenResponse>>(
      '/auth/login',
      credentials
    );
    return response.data;
  }

  /**
   * Legacy login endpoint (kept for backward compatibility).
   * @deprecated Use login() instead
   */
  async loginLegacy(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login/legacy',
      credentials
    );
    return response.data;
  }

  /**
   * Refresh access token using refresh token from HttpOnly cookie.
   * This is automatically called by axios interceptor on 401 errors.
   */
  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      '/auth/refresh',
      {} // Empty body, refresh token comes from HttpOnly cookie
    );
    return response.data;
  }

  /**
   * Logout - revokes refresh token on server.
   */
  async logout(): Promise<ApiResponse<string>> {
    const response = await apiClient.post<ApiResponse<string>>('/auth/logout');
    return response.data;
  }

  /**
   * Register a new employee.
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<EmployeeResponse>> {
    const response = await apiClient.post<ApiResponse<EmployeeResponse>>(
      '/auth/register',
      userData
    );
    return response.data;
  }

  // ============================================================================
  // EMPLOYEE ENDPOINTS
  // ============================================================================

  async getAllEmployees(): Promise<ApiResponse<EmployeeResponse[]>> {
    const response = await apiClient.get<ApiResponse<EmployeeResponse[]>>('/employees');
    return response.data;
  }

  async getEmployee(email: string): Promise<ApiResponse<EmployeeResponse>> {
    const response = await apiClient.get<ApiResponse<EmployeeResponse>>(
      `/employees/${encodeURIComponent(email)}`
    );
    return response.data;
  }

  async updateEmployee(
    email: string,
    data: UpdateEmployeeRequest
  ): Promise<ApiResponse<EmployeeResponse>> {
    const response = await apiClient.put<ApiResponse<EmployeeResponse>>(
      `/employees/${encodeURIComponent(email)}`,
      data
    );
    return response.data;
  }

  async deleteEmployee(email: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/employees/${encodeURIComponent(email)}`
    );
    return response.data;
  }

  // ============================================================================
  // GENERATOR ENDPOINTS
  // ============================================================================

  async getAllGenerators(): Promise<ApiResponse<GeneratorResponse[]>> {
    const response = await apiClient.get<ApiResponse<GeneratorResponse[]>>('/generators');
    return response.data;
  }

  async getAllGeneratorsCount(): Promise<ApiResponse<number>> {
    const response = await apiClient.get<ApiResponse<number>>('/generators/count');
    return response.data;
  }

  async getGenerator(id: string): Promise<ApiResponse<GeneratorResponse>> {
    const response = await apiClient.get<ApiResponse<GeneratorResponse>>(`/generators/${id}`);
    return response.data;
  }

  async createGenerator(data: CreateGeneratorRequest): Promise<ApiResponse<GeneratorResponse>> {
    const response = await apiClient.post<ApiResponse<GeneratorResponse>>('/generators', data);
    return response.data;
  }

  async updateGenerator(id: string, data: CreateGeneratorRequest): Promise<ApiResponse<GeneratorResponse>> {
    const response = await apiClient.put<ApiResponse<GeneratorResponse>>(`/generators/${id}`, data);
    return response.data;
  }

  async deleteGenerator(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/generators/${id}`);
    return response.data;
  }

  async searchGenerators(name: string): Promise<ApiResponse<GeneratorResponse[]>> {
    const response = await apiClient.get<ApiResponse<GeneratorResponse[]>>(
      `/generators/search?name=${encodeURIComponent(name)}`
    );
    return response.data;
  }

  // ============================================================================
  // REPORTS & OT ENDPOINTS
  // ============================================================================

  async generateEmployeeOTReport(request: OTReportRequest): Promise<OTReportResponse> {
    const response = await apiClient.post<OTReportResponse>('/reports/employee-ot-report', request);
    return response.data;
  }

  async endWorkSession(request: EndSessionRequest): Promise<EndSessionResponse> {
    try {
      const params = new URLSearchParams({
        employeeEmail: request.employeeEmail,
        date: request.date,
        endTime: request.endTime,
        endLocation: request.endLocation,
      });

      const response = await apiClient.post<string>(
        `/ot-time/end-session?${params}`,
        null,
        { responseType: 'text' as 'json' }
      );

      return {
        success: true,
        message: response.data,
      };
    } catch (error: any) {
      console.error("Error ending work session:", error);
      return {
        success: false,
        message: error.response?.data || "Network error occurred. Please try again.",
      };
    }
  }

  // ============================================================================
  // JOB CARD ENDPOINTS
  // ============================================================================

  async getAllJobCards(): Promise<ApiResponse<JobCardResponse[]>> {
    const response = await apiClient.get<ApiResponse<JobCardResponse[]>>('/jobcards');
    return response.data;
  }

  async getJobCard(id: string): Promise<ApiResponse<JobCardResponse>> {
    const response = await apiClient.get<ApiResponse<JobCardResponse>>(`/jobcards/${id}`);
    return response.data;
  }

  async createServiceJob(data: CreateJobCardRequest): Promise<ApiResponse<JobCardResponse>> {
    const response = await apiClient.post<ApiResponse<JobCardResponse>>('/jobcards/service', data);
    return response.data;
  }

  async getJobCardsByDate(date: string): Promise<ApiResponse<JobCardResponse[]>> {
    const response = await apiClient.get<ApiResponse<JobCardResponse[]>>(
      `/jobcards/by-date?date=${date}`
    );
    return response.data;
  }

  async deleteJobCard(jobCardId: string) {
    try {
      await apiClient.delete(`/jobcards/${jobCardId}`);
      return {
        status: true,
        message: "Job card deleted successfully",
      };
    } catch (error) {
      return {
        status: false,
        message: "Failed to delete job card",
      };
    }
  }

  async updateJobCard(
    jobCardId: string,
    updateData: {
      generatorId: string;
      jobType: "SERVICE" | "REPAIR" | "VISIT";
      date: string;
      estimatedTime: string;
      employeeEmails: string[];
    }
  ): Promise<ApiResponse<JobCardResponse>> {
    const response = await apiClient.put<ApiResponse<JobCardResponse>>(
      `/jobcards/${jobCardId}`,
      updateData
    );
    return response.data;
  }

  async createRepairJob(data: CreateJobCardRequest): Promise<ApiResponse<JobCardResponse>> {
    const response = await apiClient.post<ApiResponse<JobCardResponse>>('/jobcards/repair', data);
    return response.data;
  }

  async getJobCardsByType(type: "SERVICE" | "REPAIR"): Promise<ApiResponse<JobCardResponse[]>> {
    const response = await apiClient.get<ApiResponse<JobCardResponse[]>>(`/jobcards/type/${type}`);
    return response.data;
  }

  async getJobCardsByEmployee(email: string): Promise<ApiResponse<JobCardResponse[]>> {
    const response = await apiClient.get<ApiResponse<JobCardResponse[]>>(
      `/jobcards/employee/${encodeURIComponent(email)}`
    );
    return response.data;
  }

  async getJobCardsByGenerator(generatorId: string): Promise<ApiResponse<JobCardResponse[]>> {
    const response = await apiClient.get<ApiResponse<JobCardResponse[]>>(
      `/jobcards/generator/${generatorId}`
    );
    return response.data;
  }

  // ============================================================================
  // MINI JOB CARD ENDPOINTS
  // ============================================================================

  async getMiniJobCardsByJobCard(jobCardId: string): Promise<ApiResponse<MiniJobCardResponse[]>> {
    const response = await apiClient.get<ApiResponse<MiniJobCardResponse[]>>(
      `/minijobcards/jobcard/${jobCardId}`
    );
    return response.data;
  }

  async getAllMiniJobCards(): Promise<ApiResponse<MiniJobCardResponse[]>> {
    const response = await apiClient.get<ApiResponse<MiniJobCardResponse[]>>('/minijobcards');
    return response.data;
  }

  async getMiniJobCard(id: string): Promise<ApiResponse<MiniJobCardResponse>> {
    const response = await apiClient.get<ApiResponse<MiniJobCardResponse>>(`/minijobcards/${id}`);
    return response.data;
  }

  async canEditStatus(): Promise<ApiResponse<boolean>> {
    const response = await apiClient.get<ApiResponse<boolean>>('/minijobcards/can-edit-status');
    return response.data;
  }

  async getMiniJobCardsByStatus(status: string): Promise<ApiResponse<MiniJobCardResponse[]>> {
    const response = await apiClient.get<ApiResponse<MiniJobCardResponse[]>>(
      `/minijobcards/status/${status}`
    );
    return response.data;
  }

  async updateMiniJobCard(
    id: string,
    data: UpdateMiniJobCardRequest
  ): Promise<ApiResponse<MiniJobCardResponse>> {
    const response = await apiClient.put<ApiResponse<MiniJobCardResponse>>(
      `/minijobcards/${id}`,
      data
    );
    return response.data;
  }

  async createMiniJobCard(data: CreateMiniJobCardRequest): Promise<ApiResponse<MiniJobCardResponse>> {
    const response = await apiClient.post<ApiResponse<MiniJobCardResponse>>('/minijobcards', data);
    return response.data;
  }

  async getMiniJobCardsByEmployeeAndDate(
    email: string,
    date: string
  ): Promise<ApiResponse<MiniJobCardResponse[]>> {
    const response = await apiClient.get<ApiResponse<MiniJobCardResponse[]>>(
      `/minijobcards/employee/${encodeURIComponent(email)}/date/${date}`
    );
    return response.data;
  }

  // ============================================================================
  // MINI JOB CARD - WEIGHT & ATTACHMENT MANAGEMENT
  // ============================================================================

  /**
   * Update ticket weight (1-10).
   * ADMIN only - requires admin role.
   */
  async updateTicketWeight(ticketId: string, weight: number): Promise<ApiResponse<MiniJobCardResponse>> {
    const response = await apiClient.patch<ApiResponse<MiniJobCardResponse>>(
      `/minijobcards/${ticketId}/weight`,
      { weightLimit: weight }
    );
    return response.data;
  }

  /**
   * Upload attachment to a ticket.
   * ADMIN can upload to any ticket.
   * EMPLOYEE can only upload to their own tickets.
   */
  async uploadTicketAttachment(ticketId: string, file: File): Promise<ApiResponse<MiniJobCardResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<MiniJobCardResponse>>(
      `/minijobcards/${ticketId}/attachment`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Download attachment from a ticket.
   * Returns a Blob for file download.
   */
  async downloadTicketAttachment(ticketId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/minijobcards/${ticketId}/attachment/download`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  /**
   * Delete attachment from a ticket.
   * ADMIN only - requires admin role.
   */
  async deleteTicketAttachment(ticketId: string): Promise<ApiResponse<MiniJobCardResponse>> {
    const response = await apiClient.delete<ApiResponse<MiniJobCardResponse>>(
      `/minijobcards/${ticketId}/attachment`
    );
    return response.data;
  }

  // ============================================================================
  // ACTIVITY LOG ENDPOINTS
  // ============================================================================

  async getAllLogs(): Promise<ApiResponse<LogResponse[]>> {
    const response = await apiClient.get<ApiResponse<LogResponse[]>>('/logs');
    return response.data;
  }

  async getLog(id: string): Promise<ApiResponse<LogResponse>> {
    const response = await apiClient.get<ApiResponse<LogResponse>>(`/logs/${id}`);
    return response.data;
  }

  async getLogsByEmployee(email: string): Promise<ApiResponse<LogResponse[]>> {
    const response = await apiClient.get<ApiResponse<LogResponse[]>>(
      `/logs/employee/${encodeURIComponent(email)}`
    );
    return response.data;
  }

  async getLogsByDate(date: string): Promise<ApiResponse<LogResponse[]>> {
    const response = await apiClient.get<ApiResponse<LogResponse[]>>(`/logs/date/${date}`);
    return response.data;
  }

  async getLogsByEmployeeAndDate(email: string, date: string): Promise<ApiResponse<LogResponse[]>> {
    const response = await apiClient.get<ApiResponse<LogResponse[]>>(
      `/logs/employee/${encodeURIComponent(email)}/date/${date}`
    );
    return response.data;
  }

  async getRecentLogs(hours: number = 24): Promise<ApiResponse<LogResponse[]>> {
    const response = await apiClient.get<ApiResponse<LogResponse[]>>(`/logs/recent?hours=${hours}`);
    return response.data;
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<HealthResponse>> {
    const response = await apiClient.get<ApiResponse<HealthResponse>>('/health');
    return response.data;
  }

  // ============================================================================
  // REPORTS SECTION
  // ============================================================================

  async generateEmployeeTimeReport(
    request: ReportRequest
  ): Promise<ApiResponse<EmployeeTimeReportResponse>> {
    const response = await apiClient.post<ApiResponse<EmployeeTimeReportResponse>>(
      '/reports/employee-time-report',
      request
    );
    return response.data;
  }

  // Keep the old method as deprecated (for backward compatibility)
  async previewReportData(
    request: ReportRequest
  ): Promise<ApiResponse<EmployeeTimeReportResponse>> {
    return this.generateEmployeeTimeReport(request);
  }

  async getEmployeesForReports(): Promise<ApiResponse<EmployeeResponse[]>> {
    const response = await apiClient.get<ApiResponse<EmployeeResponse[]>>('/reports/employees');
    return response.data;
  }

  // Forgot Password Methods
  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ApiResponse<string>> {
    const response = await apiClient.post<ApiResponse<string>>(
      '/auth/forgot-password',
      data
    );
    return response.data;
  }

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<ApiResponse<string>> {
    const response = await apiClient.post<ApiResponse<string>>(
      '/auth/reset-password',
      data
    );
    return response.data;
  }

  async verifyResetToken(token: string): Promise<ApiResponse<string>> {
    const response = await apiClient.get<ApiResponse<string>>(
      `/auth/verify-reset-token/${encodeURIComponent(token)}`
    );
    return response.data;
  }

  // ============================================================================
  // EMAIL ENDPOINTS
  // ============================================================================
  async sendJobCardEmail(
    emailData: SendJobCardEmailRequest
  ): Promise<ApiResponse<EmailResponse>> {
    const response = await apiClient.post<ApiResponse<EmailResponse>>(
      '/emails/jobcard',
      emailData
    );
    return response.data;
  }

  // Get email history for a job card
  async getJobCardEmails(
    jobCardId: string
  ): Promise<ApiResponse<EmailResponse[]>> {
    const response = await apiClient.get<ApiResponse<EmailResponse[]>>(
      `/emails/jobcard/${jobCardId}`
    );
    return response.data;
  }
  // Create Visit Job
  async createVisitJob(
    data: CreateJobCardRequest
  ): Promise<ApiResponse<JobCardResponse>> {
    const response = await apiClient.post<ApiResponse<JobCardResponse>>(
      '/jobcards/visit',
      data
    );
    return response.data;
  }

  // If you have separate endpoints, you might also need to update the generic job creation method
  async createJobCard(
    jobType: "SERVICE" | "REPAIR" | "VISIT",
    data: CreateJobCardRequest
  ): Promise<ApiResponse<JobCardResponse>> {
    const endpoint = jobType.toLowerCase(); // 'service', 'repair', or 'visit'
    const response = await apiClient.post<ApiResponse<JobCardResponse>>(
      `/jobcards/${endpoint}`,
      data
    );
    return response.data;
  }

  // ============================================================================
  // PDF DOWNLOAD ENDPOINTS (ADMIN ONLY)
  // ============================================================================

  /**
   * Download Employee Time Tracking Report as PDF.
   * ADMIN only - requires authentication.
   *
   * @param request Report parameters (employeeEmail, startDate, endDate)
   * @returns Blob containing the PDF file
   */
  async downloadEmployeeTimeReportPdf(request: ReportRequest): Promise<Blob> {
    const response = await apiClient.post(
      '/reports/employee-time-report/pdf',
      request,
      {
        responseType: 'blob', // CRITICAL: Tell Axios to expect binary data
      }
    );
    return response.data;
  }

  /**
   * Download Employee Overtime Report as PDF.
   * ADMIN only - requires authentication.
   *
   * @param request Report parameters (employeeEmail, startDate, endDate)
   * @returns Blob containing the PDF file
   */
  async downloadOvertimeReportPdf(request: OTReportRequest): Promise<Blob> {
    const response = await apiClient.post(
      '/reports/employee-ot-report/pdf',
      request,
      {
        responseType: 'blob', // CRITICAL: Tell Axios to expect binary data
      }
    );
    return response.data;
  }
}

export const apiService = new ApiService();
