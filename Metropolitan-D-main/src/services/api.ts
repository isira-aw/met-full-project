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

  // Generators
  async getAllGenerators(): Promise<ApiResponse<GeneratorResponse[]>> {
    const response = await fetch(`${BASE_URL}/generators`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<GeneratorResponse[]>(response);
  }

  async getAllGeneratorsCount(): Promise<ApiResponse<number>> {
    const response = await fetch(`${BASE_URL}/generators/count`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<number>(response);
  }

  async getGenerator(id: string): Promise<ApiResponse<GeneratorResponse>> {
    const response = await fetch(`${BASE_URL}/generators/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<GeneratorResponse>(response);
  }

  async createGenerator(
    data: CreateGeneratorRequest
  ): Promise<ApiResponse<GeneratorResponse>> {
    const response = await fetch(`${BASE_URL}/generators`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<GeneratorResponse>(response);
  }

  async updateGenerator(
    id: string,
    data: CreateGeneratorRequest
  ): Promise<ApiResponse<GeneratorResponse>> {
    const response = await fetch(`${BASE_URL}/generators/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<GeneratorResponse>(response);
  }

  async deleteGenerator(id: string): Promise<ApiResponse<null>> {
    const response = await fetch(`${BASE_URL}/generators/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<null>(response);
  }

  async searchGenerators(
    name: string
  ): Promise<ApiResponse<GeneratorResponse[]>> {
    const response = await fetch(
      `${BASE_URL}/generators/search?name=${encodeURIComponent(name)}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<GeneratorResponse[]>(response);
  }

  async generateEmployeeOTReport(
    request: OTReportRequest
  ): Promise<OTReportResponse> {
    try {
      const response = await fetch(`${BASE_URL}/reports/employee-ot-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            errorData.message || "Failed to generate OT report"
          }`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error generating OT report:", error);
      throw error;
    }
  }

  // End Session
  async endWorkSession(
    request: EndSessionRequest
  ): Promise<EndSessionResponse> {
    try {
      const params = new URLSearchParams({
        employeeEmail: request.employeeEmail,
        date: request.date,
        endTime: request.endTime,
        endLocation: request.endLocation,
      });

      const response = await fetch(
        `${BASE_URL}/ot-time/end-session?${params}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.getAuthHeaders(),
          },
        }
      );

      if (response.ok) {
        const message = await response.text();
        return {
          success: true,
          message: message,
        };
      } else {
        const errorMessage = await response.text();
        return {
          success: false,
          message: errorMessage || "Failed to end session",
        };
      }
    } catch (error) {
      console.error("Error ending work session:", error);
      return {
        success: false,
        message: "Network error occurred. Please try again.",
      };
    }
  }

  // Job Cards
  async getAllJobCards(): Promise<ApiResponse<JobCardResponse[]>> {
    const response = await fetch(`${BASE_URL}/jobcards`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<JobCardResponse[]>(response);
  }

  async getJobCard(id: string): Promise<ApiResponse<JobCardResponse>> {
    const response = await fetch(`${BASE_URL}/jobcards/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<JobCardResponse>(response);
  }

  async createServiceJob(
    data: CreateJobCardRequest
  ): Promise<ApiResponse<JobCardResponse>> {
    const response = await fetch(`${BASE_URL}/jobcards/service`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<JobCardResponse>(response);
  }

  async getJobCardsByDate(
    date: string
  ): Promise<ApiResponse<JobCardResponse[]>> {
    try {
      const response = await fetch(
        `${BASE_URL}/jobcards/by-date?date=${date}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      return this.handleResponse<JobCardResponse[]>(response);
    } catch (error) {
      console.error("Error fetching job cards by date:", error);
      throw error;
    }
  }
  async deleteJobCard(jobCardId: string) {
    const response = await fetch(`${BASE_URL}/jobcards/${jobCardId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    return {
      status: response.ok,
      message: response.ok
        ? "Job card deleted successfully"
        : "Failed to delete job card",
    };
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
    try {
      const response = await fetch(`${BASE_URL}/jobcards/${jobCardId}`, {
        method: "PUT",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      return this.handleResponse<JobCardResponse>(response);
    } catch (error) {
      console.error("Error updating job card:", error);
      throw error;
    }
  }

  async createRepairJob(
    data: CreateJobCardRequest
  ): Promise<ApiResponse<JobCardResponse>> {
    const response = await fetch(`${BASE_URL}/jobcards/repair`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<JobCardResponse>(response);
  }

  async getJobCardsByType(
    type: "SERVICE" | "REPAIR"
  ): Promise<ApiResponse<JobCardResponse[]>> {
    const response = await fetch(`${BASE_URL}/jobcards/type/${type}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<JobCardResponse[]>(response);
  }

  async getJobCardsByEmployee(
    email: string
  ): Promise<ApiResponse<JobCardResponse[]>> {
    const response = await fetch(
      `${BASE_URL}/jobcards/employee/${encodeURIComponent(email)}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<JobCardResponse[]>(response);
  }

  async getJobCardsByGenerator(
    generatorId: string
  ): Promise<ApiResponse<JobCardResponse[]>> {
    const response = await fetch(
      `${BASE_URL}/jobcards/generator/${generatorId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<JobCardResponse[]>(response);
  }

  // Mini Job Cards
  async getMiniJobCardsByJobCard(
    jobCardId: string
  ): Promise<ApiResponse<MiniJobCardResponse[]>> {
    const response = await fetch(
      `${BASE_URL}/minijobcards/jobcard/${jobCardId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<MiniJobCardResponse[]>(response);
  }
  async getAllMiniJobCards(): Promise<ApiResponse<MiniJobCardResponse[]>> {
    const response = await fetch(`${BASE_URL}/minijobcards`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<MiniJobCardResponse[]>(response);
  }

  async getMiniJobCard(id: string): Promise<ApiResponse<MiniJobCardResponse>> {
    const response = await fetch(`${BASE_URL}/minijobcards/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<MiniJobCardResponse>(response);
  }

  // async getMiniJobCardsByEmployee(email: string): Promise<ApiResponse<MiniJobCardResponse[]>> {
  //   const response = await fetch(`${BASE_URL}/minijobcards/employee/${encodeURIComponent(email)}`, {
  //     headers: this.getAuthHeaders()
  //   });
  //   return this.handleResponse<MiniJobCardResponse[]>(response);
  // }

  // async getMiniJobCardsByJobCard(jobCardId: string): Promise<ApiResponse<MiniJobCardResponse[]>> {
  //   const response = await fetch(`${BASE_URL}/minijobcards/jobcard/${jobCardId}`, {
  //     headers: this.getAuthHeaders()
  //   });
  //   return this.handleResponse<MiniJobCardResponse[]>(response);
  // }

  async canEditStatus(): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${BASE_URL}/minijobcards/can-edit-status`, {
        method: "GET",
        headers: this.getAuthHeaders(), // This includes the JWT token
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking edit status eligibility:", error);
      throw error;
    }
  }
  async getMiniJobCardsByStatus(
    status: string
  ): Promise<ApiResponse<MiniJobCardResponse[]>> {
    const response = await fetch(`${BASE_URL}/minijobcards/status/${status}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<MiniJobCardResponse[]>(response);
  }

  async updateMiniJobCard(
    id: string,
    data: UpdateMiniJobCardRequest
  ): Promise<ApiResponse<MiniJobCardResponse>> {
    const response = await fetch(`${BASE_URL}/minijobcards/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<MiniJobCardResponse>(response);
  }

  async createMiniJobCard(
    data: CreateMiniJobCardRequest
  ): Promise<ApiResponse<MiniJobCardResponse>> {
    const response = await fetch(`${BASE_URL}/minijobcards`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<MiniJobCardResponse>(response);
  }

  // Activity Logs
  async getAllLogs(): Promise<ApiResponse<LogResponse[]>> {
    const response = await fetch(`${BASE_URL}/logs`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<LogResponse[]>(response);
  }

  async getLog(id: string): Promise<ApiResponse<LogResponse>> {
    const response = await fetch(`${BASE_URL}/logs/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<LogResponse>(response);
  }

  async getLogsByEmployee(email: string): Promise<ApiResponse<LogResponse[]>> {
    const response = await fetch(
      `${BASE_URL}/logs/employee/${encodeURIComponent(email)}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<LogResponse[]>(response);
  }

  async getLogsByDate(date: string): Promise<ApiResponse<LogResponse[]>> {
    const response = await fetch(`${BASE_URL}/logs/date/${date}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<LogResponse[]>(response);
  }

  async getLogsByEmployeeAndDate(
    email: string,
    date: string
  ): Promise<ApiResponse<LogResponse[]>> {
    const response = await fetch(
      `${BASE_URL}/logs/employee/${encodeURIComponent(email)}/date/${date}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<LogResponse[]>(response);
  }

  async getRecentLogs(hours: number = 24): Promise<ApiResponse<LogResponse[]>> {
    const response = await fetch(`${BASE_URL}/logs/recent?hours=${hours}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<LogResponse[]>(response);
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<HealthResponse>> {
    const response = await fetch(`${BASE_URL}/health`);
    return this.handleResponse<HealthResponse>(response);
  }

  // ============================================================================
  // REPORTS SECTION
  // ============================================================================

  async generateEmployeeTimeReport(
    request: ReportRequest
  ): Promise<ApiResponse<EmployeeTimeReportResponse>> {
    const response = await fetch(`${BASE_URL}/reports/employee-time-report`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });
    return this.handleResponse<EmployeeTimeReportResponse>(response);
  }

  // Keep the old method as deprecated (for backward compatibility)
  async previewReportData(
    request: ReportRequest
  ): Promise<ApiResponse<EmployeeTimeReportResponse>> {
    return this.generateEmployeeTimeReport(request);
  }

  async getEmployeesForReports(): Promise<ApiResponse<EmployeeResponse[]>> {
    const response = await fetch(`${BASE_URL}/reports/employees`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<EmployeeResponse[]>(response);
  }

  // Forgot Password Methods
  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ApiResponse<string>> {
    const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<string>(response);
  }

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<ApiResponse<string>> {
    const response = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<string>(response);
  }

  async verifyResetToken(token: string): Promise<ApiResponse<string>> {
    const response = await fetch(
      `${BASE_URL}/auth/verify-reset-token/${encodeURIComponent(token)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    return this.handleResponse<string>(response);
  }

  async getMiniJobCardsByEmployeeAndDate(
    email: string,
    date: string
  ): Promise<ApiResponse<MiniJobCardResponse[]>> {
    const response = await fetch(
      `${BASE_URL}/minijobcards/employee/${encodeURIComponent(
        email
      )}/date/${date}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(), // Use the same auth headers as other methods
      }
    );
    return this.handleResponse<MiniJobCardResponse[]>(response);
  }

  // async getMiniJobCardsByEmployee(email: string): Promise<ApiResponse<MiniJobCardResponse[]>> {
  //   const response = await fetch(`${BASE_URL}/minijobcards/employee/${encodeURIComponent(email)}`, {
  //     headers: this.getAuthHeaders()
  //   });
  //   return this.handleResponse<MiniJobCardResponse[]>(response);
  // }

  // Add this method to your apiService.ts file
  async sendJobCardEmail(
    emailData: SendJobCardEmailRequest
  ): Promise<ApiResponse<EmailResponse>> {
    const response = await fetch(`${BASE_URL}/emails/jobcard`, {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });
    return this.handleResponse<EmailResponse>(response);
  }

  // Get email history for a job card
  async getJobCardEmails(
    jobCardId: string
  ): Promise<ApiResponse<EmailResponse[]>> {
    const response = await fetch(`${BASE_URL}/emails/jobcard/${jobCardId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<EmailResponse[]>(response);
  }
  // Create Visit Job
  async createVisitJob(
    data: CreateJobCardRequest
  ): Promise<ApiResponse<JobCardResponse>> {
    try {
      const response = await fetch(`${BASE_URL}/jobcards/visit`, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating visit job:", error);
      throw error;
    }
  }

  // If you have separate endpoints, you might also need to update the generic job creation method
  async createJobCard(
    jobType: "SERVICE" | "REPAIR" | "VISIT",
    data: CreateJobCardRequest
  ): Promise<ApiResponse<JobCardResponse>> {
    const endpoint = jobType.toLowerCase(); // 'service', 'repair', or 'visit'

    try {
      const response = await fetch(`${BASE_URL}/jobcards/${endpoint}`, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error creating ${jobType} job:`, error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
