package com.example.met.controller;

import com.example.met.dto.request.ForgotPasswordRequest;
import com.example.met.dto.request.LoginRequest;
import com.example.met.dto.request.RefreshTokenRequest;
import com.example.met.dto.request.RegisterRequest;
import com.example.met.dto.request.ResetPasswordRequest;
import com.example.met.dto.response.ApiResponse;
import com.example.met.dto.response.AuthTokenResponse;
import com.example.met.dto.response.EmployeeResponse;
import com.example.met.dto.response.LoginResponse;
import com.example.met.dto.response.RefreshTokenResponse;
import com.example.met.entity.Employee;
import com.example.met.entity.RefreshToken;
import com.example.met.security.JwtTokenProvider;
import com.example.met.service.AuthService;
import com.example.met.service.PasswordResetService;
import com.example.met.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Optional;

/**
 * Controller handling authentication endpoints.
 * Supports login, token refresh, logout, and password reset operations.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.refresh.cookie.name:refreshToken}")
    private String refreshTokenCookieName;

    @Value("${jwt.refresh.cookie.httpOnly:true}")
    private boolean cookieHttpOnly;

    @Value("${jwt.refresh.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${jwt.refresh.cookie.sameSite:Lax}")
    private String cookieSameSite;

    @Value("${jwt.refresh.expiration}")
    private long refreshTokenDurationMs;

    /**
     * Login endpoint with JWT access + refresh token support.
     * Returns access token in response body and refresh token in HttpOnly cookie.
     *
     * @param request Login credentials
     * @param httpRequest HTTP request for metadata
     * @param httpResponse HTTP response to set cookie
     * @return AuthTokenResponse with access token and user info
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (log.isDebugEnabled()) {
            log.debug("Login attempt for email: {}", request.getEmail());
        }

        try {
            // Authenticate and get tokens
            AuthService.LoginResult loginResult = authService.loginWithTokens(request, httpRequest);

            // Set refresh token in HttpOnly cookie
            setRefreshTokenCookie(httpResponse, loginResult.refreshTokenValue);

            ApiResponse<AuthTokenResponse> response = ApiResponse.success(
                    "Login successful", loginResult.authResponse);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.warn("Login failed for email: {}: {}", request.getEmail(), e.getMessage());
            ApiResponse<AuthTokenResponse> response = ApiResponse.error("Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * Legacy login endpoint for backward compatibility.
     * @deprecated Use the new /login endpoint that returns AuthTokenResponse
     */
    @Deprecated
    @PostMapping("/login/legacy")
    public ResponseEntity<ApiResponse<LoginResponse>> loginLegacy(@Valid @RequestBody LoginRequest request) {
        if (log.isDebugEnabled()) {
            log.debug("Legacy login attempt for email: {}", request.getEmail());
        }

        try {
            LoginResponse loginResponse = authService.login(request);
            ApiResponse<LoginResponse> response = ApiResponse.success("Login successful", loginResponse);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Login failed for email: {}: {}", request.getEmail(), e.getMessage());
            ApiResponse<LoginResponse> response = ApiResponse.error("Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * Refresh token endpoint.
     * Accepts refresh token from HttpOnly cookie or request body.
     * Returns new access token and rotates refresh token.
     *
     * @param refreshTokenRequest Optional refresh token in request body
     * @param httpRequest HTTP request to read cookie
     * @param httpResponse HTTP response to set new cookie
     * @return RefreshTokenResponse with new access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest refreshTokenRequest,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        try {
            // Try to get refresh token from cookie first, then from request body
            String refreshTokenString = extractRefreshTokenFromCookie(httpRequest);

            if (refreshTokenString == null && refreshTokenRequest != null) {
                refreshTokenString = refreshTokenRequest.getRefreshToken();
            }

            if (refreshTokenString == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Refresh token is missing"));
            }

            // Refresh the access token and rotate refresh token
            AuthService.RefreshResult refreshResult = authService.refreshAccessToken(refreshTokenString, httpRequest);

            // Set new refresh token in HttpOnly cookie
            setRefreshTokenCookie(httpResponse, refreshResult.newRefreshTokenValue);

            ApiResponse<RefreshTokenResponse> response = ApiResponse.success(
                    "Token refreshed successfully", refreshResult.refreshResponse);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            // Clear the invalid refresh token cookie
            clearRefreshTokenCookie(httpResponse);
            ApiResponse<RefreshTokenResponse> response = ApiResponse.error("Invalid or expired refresh token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * Logout endpoint.
     * Revokes all refresh tokens for the authenticated user and clears cookie.
     *
     * @param httpResponse HTTP response to clear cookie
     * @return Success message
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletResponse httpResponse) {
        try {
            // Get the currently authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();

                // Revoke all refresh tokens for this user
                authService.logout(email);

                // Clear the refresh token cookie
                clearRefreshTokenCookie(httpResponse);

                log.info("User logged out successfully: {}", email);
                return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }
        } catch (Exception e) {
            log.error("Logout failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Logout failed"));
        }
    }

    /**
     * Helper method to set refresh token in HttpOnly cookie.
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(refreshTokenCookieName, refreshToken);
        cookie.setHttpOnly(cookieHttpOnly);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) (refreshTokenDurationMs / 1000)); // Convert ms to seconds

        // SameSite attribute (not directly supported in older Servlet API)
        // We'll use the Set-Cookie header directly for full control
        String cookieHeader = String.format(
                "%s=%s; Path=/api/auth; Max-Age=%d; HttpOnly; SameSite=%s%s",
                refreshTokenCookieName,
                refreshToken,
                (int) (refreshTokenDurationMs / 1000),
                cookieSameSite,
                cookieSecure ? "; Secure" : ""
        );

        response.addHeader("Set-Cookie", cookieHeader);
        log.debug("Set refresh token cookie with SameSite={}, Secure={}", cookieSameSite, cookieSecure);
    }

    /**
     * Helper method to clear refresh token cookie.
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(refreshTokenCookieName, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        log.debug("Cleared refresh token cookie");
    }

    /**
     * Helper method to extract refresh token from cookies.
     */
    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            return Arrays.stream(request.getCookies())
                    .filter(cookie -> refreshTokenCookieName.equals(cookie.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<EmployeeResponse>> register(@Valid @RequestBody RegisterRequest request) {
        // Reduced logging frequency
        if (log.isDebugEnabled()) {
            log.debug("Registration attempt for email: {}", request.getEmail());
        }

        try {
            Employee employee = authService.register(request);

            EmployeeResponse employeeResponse = new EmployeeResponse();
            employeeResponse.setEmail(employee.getEmail());
            employeeResponse.setName(employee.getName());
            employeeResponse.setContactNumber(employee.getContactNumber());
            employeeResponse.setRole(employee.getRole());
            employeeResponse.setCreatedAt(employee.getCreatedAt());
            employeeResponse.setUpdatedAt(employee.getUpdatedAt());

            ApiResponse<EmployeeResponse> response = ApiResponse.success("Registration successful", employeeResponse);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.warn("Registration failed for email: {}: {}", request.getEmail(), e.getMessage());
            ApiResponse<EmployeeResponse> response = ApiResponse.error("Registration failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Reduce logging - only debug level for normal flow
        if (log.isDebugEnabled()) {
            log.debug("Password reset request for: {}", email);
        }

        try {
            // STEP 1: Check if email exists in database
            boolean emailExists = passwordResetService.isEmailRegistered(email);

            if (!emailExists) {
                // Removed detailed logging for security reasons
                ApiResponse<String> response = ApiResponse.success(
                        "If the email address is not registered with us, please double-check whether this email was used to log in before."
                );
                return ResponseEntity.ok(response);
            }

            // STEP 2: Get employee details for verification
            Optional<Employee> employeeOpt = passwordResetService.getEmployeeForVerification(email);
            if (employeeOpt.isEmpty()) {
                ApiResponse<String> response = ApiResponse.success(
                        "If the email address is registered with us, you will receive a password reset link shortly.",
                        "Password reset request processed"
                );
                return ResponseEntity.ok(response);
            }

            Employee employee = employeeOpt.get();
            // Reduced logging detail
            if (log.isDebugEnabled()) {
                log.debug("Processing password reset for verified employee: {}", employee.getEmail());
            }

            // STEP 3: Initiate password reset (this will send the email)
            String result = passwordResetService.initiatePasswordReset(email);

            ApiResponse<String> response = ApiResponse.success(result, "Password reset email sent");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Password reset error for: {}: {}", email, e.getMessage());
            ApiResponse<String> response = ApiResponse.error("Failed to process password reset request. Please try again later.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        // Reduced initial logging
        if (log.isDebugEnabled()) {
            log.debug("Password reset attempt with token");
        }

        try {
            // Validate that passwords match
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                ApiResponse<String> response = ApiResponse.error("Passwords do not match");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate password strength
            if (request.getNewPassword().length() < 6) {
                ApiResponse<String> response = ApiResponse.error("Password must be at least 6 characters long");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getNewPassword().length() > 20) {
                ApiResponse<String> response = ApiResponse.error("Password must be less than 20 characters long");
                return ResponseEntity.badRequest().body(response);
            }

            String result = passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            ApiResponse<String> response = ApiResponse.success(result, "Password reset successful");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            // Simplified error logging
            log.warn("Invalid password reset request: {}", e.getMessage());
            ApiResponse<String> response = ApiResponse.error(e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("Password reset error: {}", e.getMessage());
            ApiResponse<String> response = ApiResponse.error("Failed to reset password. Please try again later.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/verify-reset-token/{token}")
    public ResponseEntity<ApiResponse<String>> verifyResetToken(@PathVariable String token) {
        try {
            boolean isValid = passwordResetService.isValidToken(token);
            if (isValid) {
                ApiResponse<String> response = ApiResponse.success("Token is valid", "Token verified successfully");
                return ResponseEntity.ok(response);
            } else {
                ApiResponse<String> response = ApiResponse.error("Invalid or expired token");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            log.error("Token verification error: {}", e.getMessage());
            ApiResponse<String> response = ApiResponse.error("Failed to verify token. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Additional endpoint to check if email exists (optional, for frontend validation)
    @PostMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailExists(@RequestBody ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        try {
            boolean exists = passwordResetService.isEmailRegistered(email);
            ApiResponse<Boolean> response = ApiResponse.success("Email check completed", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Email check error for {}: {}", email, e.getMessage());
            ApiResponse<Boolean> response = ApiResponse.error("Failed to check email");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}