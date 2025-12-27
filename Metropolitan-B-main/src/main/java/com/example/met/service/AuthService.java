package com.example.met.service;

import com.example.met.dto.request.LoginRequest;
import com.example.met.dto.request.RegisterRequest;
import com.example.met.dto.response.AuthTokenResponse;
import com.example.met.dto.response.LoginResponse;
import com.example.met.dto.response.RefreshTokenResponse;
import com.example.met.entity.Employee;
import com.example.met.entity.RefreshToken;
import com.example.met.exception.UnauthorizedException;
import com.example.met.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for handling authentication operations including login, token refresh, and logout.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final EmployeeService employeeService;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;

    /**
     * Container class to hold both auth response and refresh token.
     */
    public static class LoginResult {
        public final AuthTokenResponse authResponse;
        public final String refreshTokenValue;

        public LoginResult(AuthTokenResponse authResponse, String refreshTokenValue) {
            this.authResponse = authResponse;
            this.refreshTokenValue = refreshTokenValue;
        }
    }

    /**
     * Authenticates user and generates access + refresh tokens.
     * Refresh tokens are ONLY issued to ADMIN users for persistent sessions.
     * EMPLOYEE users must re-authenticate with password on each session.
     *
     * @param request login credentials
     * @param httpRequest HTTP request for refresh token metadata
     * @return LoginResult containing both access token response and refresh token value (null for employees)
     */
    @Transactional
    public LoginResult loginWithTokens(LoginRequest request, HttpServletRequest httpRequest) {
        log.info("Login attempt for email: {}", request.getEmail());

        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            // Generate access token
            String accessToken = tokenProvider.generateAccessToken(authentication);

            // Get employee details
            Employee employee = employeeService.findByEmail(request.getEmail());

            // Only create refresh token for ADMIN users
            String refreshTokenValue = null;
            if (employee.getRole().name().equals("ADMIN")) {
                // Revoke any existing refresh tokens for this user (single device policy)
                // Comment out the line below if you want to allow multiple concurrent sessions
                // refreshTokenService.revokeAllUserTokens(employee);

                // Create new refresh token for admin
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(employee, httpRequest);
                refreshTokenValue = refreshToken.getToken();
                log.info("Refresh token created for ADMIN user: {}", request.getEmail());
            } else {
                log.info("Refresh token NOT created for EMPLOYEE user: {} (password required on each login)", request.getEmail());
            }

            log.info("Login successful for email: {} with role: {}", request.getEmail(), employee.getRole());

            // Build response
            AuthTokenResponse authResponse = AuthTokenResponse.builder()
                    .accessToken(accessToken)
                    .tokenType("Bearer")
                    .expiresIn(tokenProvider.getAccessTokenExpirationMs())
                    .email(employee.getEmail())
                    .name(employee.getName())
                    .role(employee.getRole())
                    .contactNumber(employee.getContactNumber())
                    .authenticated(true)
                    .build();

            return new LoginResult(authResponse, refreshTokenValue);
        } catch (AuthenticationException e) {
            log.error("Login failed for email: {}", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    /**
     * Legacy login method for backward compatibility.
     * @deprecated Use loginWithTokens() instead
     */
    @Deprecated
    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.info("Legacy login attempt for email: {}", request.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            String token = tokenProvider.generateAccessToken(authentication);
            Employee employee = employeeService.findByEmail(request.getEmail());

            log.info("Legacy login successful for email: {}", request.getEmail());

            return new LoginResponse(
                    token,
                    employee.getEmail(),
                    employee.getName(),
                    employee.getRole(),
                    employee.getContactNumber()
            );
        } catch (AuthenticationException e) {
            log.error("Login failed for email: {}", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    /**
     * Container class to hold refresh response and new refresh token.
     */
    public static class RefreshResult {
        public final RefreshTokenResponse refreshResponse;
        public final String newRefreshTokenValue;

        public RefreshResult(RefreshTokenResponse refreshResponse, String newRefreshTokenValue) {
            this.refreshResponse = refreshResponse;
            this.newRefreshTokenValue = newRefreshTokenValue;
        }
    }

    /**
     * Refreshes access token using a valid refresh token.
     *
     * @param refreshTokenString the refresh token
     * @param httpRequest HTTP request for new refresh token metadata
     * @return RefreshResult with new access token and new refresh token value
     */
    @Transactional
    public RefreshResult refreshAccessToken(String refreshTokenString, HttpServletRequest httpRequest) {
        // Find refresh token
        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenString)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        // Verify token is not expired or revoked
        refreshToken = refreshTokenService.verifyExpiration(refreshToken);

        // Get employee from refresh token
        Employee employee = refreshToken.getEmployee();

        // Rotate refresh token (revoke old, create new) - Security best practice
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(refreshToken, httpRequest);

        // Generate new access token
        String newAccessToken = tokenProvider.generateAccessTokenFromEmail(employee.getEmail());

        log.info("Access token refreshed successfully for user: {}", employee.getEmail());

        RefreshTokenResponse response = RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getAccessTokenExpirationMs())
                .email(employee.getEmail())
                .build();

        return new RefreshResult(response, newRefreshToken.getToken());
    }

    /**
     * Logs out user by revoking all their refresh tokens.
     *
     * @param email user's email
     */
    @Transactional
    public void logout(String email) {
        log.info("Logout request for email: {}", email);
        refreshTokenService.revokeAllUserTokensByEmail(email);
        log.info("Logout successful for email: {}", email);
    }

    /**
     * Registers a new employee.
     *
     * @param request registration details
     * @return created Employee entity
     */
    @Transactional
    public Employee register(RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.getEmail());
        Employee employee = employeeService.createEmployee(request);
        log.info("Registration successful for email: {}", request.getEmail());
        return employee;
    }
}