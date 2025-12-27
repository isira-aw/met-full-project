package com.example.met.service;

import com.example.met.entity.Employee;
import com.example.met.entity.RefreshToken;
import com.example.met.exception.UnauthorizedException;
import com.example.met.repository.EmployeeRepository;
import com.example.met.repository.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing refresh tokens.
 * Handles creation, validation, revocation, and cleanup of refresh tokens.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${jwt.refresh.expiration}")
    private long refreshTokenDurationMs;

    /**
     * Creates a new refresh token for the given employee.
     *
     * @param employee the employee to create the token for
     * @param request HTTP request to extract user agent and IP
     * @return the created RefreshToken entity
     */
    @Transactional
    public RefreshToken createRefreshToken(Employee employee, HttpServletRequest request) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setEmployee(employee);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(LocalDateTime.now().plusSeconds(refreshTokenDurationMs / 1000));
        refreshToken.setRevoked(false);

        // Capture client information for security tracking
        if (request != null) {
            refreshToken.setUserAgent(extractUserAgent(request));
            refreshToken.setIpAddress(extractIpAddress(request));
        }

        RefreshToken savedToken = refreshTokenRepository.save(refreshToken);
        log.debug("Created refresh token for user: {} with expiry: {}",
                 employee.getEmail(), refreshToken.getExpiryDate());

        return savedToken;
    }

    /**
     * Finds a refresh token by its token string.
     *
     * @param token the token string
     * @return Optional containing the RefreshToken if found
     */
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    /**
     * Validates and verifies a refresh token.
     *
     * @param token the refresh token entity
     * @return the validated RefreshToken
     * @throws UnauthorizedException if token is invalid, expired, or revoked
     */
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isRevoked()) {
            log.warn("Attempt to use revoked refresh token: {}", token.getToken());
            throw new UnauthorizedException("Refresh token has been revoked. Please login again.");
        }

        if (token.isExpired()) {
            log.warn("Attempt to use expired refresh token: {}", token.getToken());
            refreshTokenRepository.delete(token);
            throw new UnauthorizedException("Refresh token has expired. Please login again.");
        }

        return token;
    }

    /**
     * Revokes a specific refresh token.
     *
     * @param token the token to revoke
     */
    @Transactional
    public void revokeToken(RefreshToken token) {
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        log.info("Revoked refresh token for user: {}", token.getEmployee().getEmail());
    }

    /**
     * Revokes all refresh tokens for a specific employee.
     * Used during logout or password reset.
     *
     * @param employee the employee whose tokens should be revoked
     */
    @Transactional
    public void revokeAllUserTokens(Employee employee) {
        int revokedCount = refreshTokenRepository.revokeAllUserTokens(employee);
        log.info("Revoked {} refresh tokens for user: {}", revokedCount, employee.getEmail());
    }

    /**
     * Revokes all tokens for a user by email.
     *
     * @param email the employee's email
     */
    @Transactional
    public void revokeAllUserTokensByEmail(String email) {
        Optional<Employee> employee = employeeRepository.findByEmail(email);
        employee.ifPresent(this::revokeAllUserTokens);
    }

    /**
     * Rotates a refresh token - revokes the old one and creates a new one.
     * This is a security best practice for refresh token rotation.
     *
     * @param oldToken the old refresh token
     * @param request HTTP request for new token metadata
     * @return new RefreshToken
     */
    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken oldToken, HttpServletRequest request) {
        // Revoke the old token
        revokeToken(oldToken);

        // Create a new token
        RefreshToken newToken = createRefreshToken(oldToken.getEmployee(), request);
        log.info("Rotated refresh token for user: {}", oldToken.getEmployee().getEmail());

        return newToken;
    }

    /**
     * Scheduled cleanup job that runs daily to remove expired and revoked tokens.
     * Runs at 2 AM every day.
     */
    @Transactional
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupExpiredTokens() {
        int deletedCount = refreshTokenRepository.deleteExpiredAndRevokedTokens(LocalDateTime.now());
        log.info("Cleanup job: Deleted {} expired/revoked refresh tokens", deletedCount);
    }

    /**
     * Extracts user agent from HTTP request.
     */
    private String extractUserAgent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > 100) {
            return userAgent.substring(0, 100);
        }
        return userAgent;
    }

    /**
     * Extracts IP address from HTTP request, considering proxy headers.
     */
    private String extractIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Handle multiple IPs (take the first one)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        if (ip != null && ip.length() > 45) {
            return ip.substring(0, 45);
        }
        return ip;
    }
}
