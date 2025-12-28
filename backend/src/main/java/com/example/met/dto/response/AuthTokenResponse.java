package com.example.met.dto.response;

import com.example.met.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for authentication endpoints (login, refresh).
 * Contains access token in response body and user information.
 * Refresh token is sent separately via HttpOnly cookie for security.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthTokenResponse {

    /**
     * Short-lived access token (JWT) used for API authentication.
     * Typically expires in 15 minutes.
     * Should be included in Authorization header: "Bearer {accessToken}"
     */
    private String accessToken;

    /**
     * Type of token (always "Bearer" for JWT).
     */
    private String tokenType = "Bearer";

    /**
     * Access token expiration time in milliseconds.
     */
    private Long expiresIn;

    /**
     * User email address.
     */
    private String email;

    /**
     * User's full name.
     */
    private String name;

    /**
     * User's role (ADMIN or EMPLOYEE).
     */
    private Role role;

    /**
     * User's contact number.
     */
    private String contactNumber;

    /**
     * Indicates if the user is authenticated.
     * This is always true in a successful auth response.
     */
    private boolean authenticated = true;
}
