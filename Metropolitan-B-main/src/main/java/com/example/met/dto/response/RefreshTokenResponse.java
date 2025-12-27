package com.example.met.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for token refresh endpoint.
 * Returns new access token when refresh token is valid.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenResponse {

    /**
     * New access token.
     */
    private String accessToken;

    /**
     * Token type (always "Bearer").
     */
    private String tokenType = "Bearer";

    /**
     * Expiration time in milliseconds.
     */
    private Long expiresIn;

    /**
     * User email for verification.
     */
    private String email;
}
