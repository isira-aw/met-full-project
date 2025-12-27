package com.example.met.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * JWT Token Provider for generating and validating both access and refresh tokens.
 *
 * Access Token: Short-lived (15 minutes) token used for API authentication
 * Refresh Token: Long-lived (7 days) token used to obtain new access tokens
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationInMs;

    @Value("${jwt.refresh.expiration}")
    private long refreshTokenExpirationMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Generates an access token from Authentication object.
     * Used during login with Spring Security authentication.
     *
     * @param authentication Spring Security authentication
     * @return JWT access token
     */
    public String generateAccessToken(Authentication authentication) {
        String userPrincipal = authentication.getName();
        return generateAccessTokenFromEmail(userPrincipal);
    }

    /**
     * Generates an access token from email address.
     * Used during token refresh when we only have the email.
     *
     * @param email user's email
     * @return JWT access token
     */
    public String generateAccessTokenFromEmail(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        String token = Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .claim("type", "access")
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();

        log.debug("Generated access token for user: {} (expires in {}ms)", email, jwtExpirationInMs);
        return token;
    }

    /**
     * Legacy method for backward compatibility.
     * @deprecated Use generateAccessToken() instead
     */
    @Deprecated
    public String generateToken(Authentication authentication) {
        return generateAccessToken(authentication);
    }

    /**
     * Legacy method for backward compatibility.
     * @deprecated Use generateAccessTokenFromEmail() instead
     */
    @Deprecated
    public String generateTokenFromEmail(String email) {
        return generateAccessTokenFromEmail(email);
    }

    /**
     * Gets expiration time in milliseconds for access token.
     *
     * @return expiration time in ms
     */
    public long getAccessTokenExpirationMs() {
        return jwtExpirationInMs;
    }

    /**
     * Gets expiration time in milliseconds for refresh token.
     *
     * @return expiration time in ms
     */
    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    /**
     * Extracts email from JWT token.
     *
     * @param token JWT token
     * @return email address
     */
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    /**
     * Validates JWT token.
     *
     * @param authToken JWT token to validate
     * @return true if valid, false otherwise
     */
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.debug("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * Checks if a token is expired.
     *
     * @param token JWT token
     * @return true if expired, false otherwise
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (JwtException e) {
            log.error("Error checking token expiration: {}", e.getMessage());
            return true;
        }
    }
}