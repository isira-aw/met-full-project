package com.example.met.repository;

import com.example.met.entity.Employee;
import com.example.met.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Find a refresh token by its token value.
     * @param token the token string
     * @return Optional containing the RefreshToken if found
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Find all refresh tokens for a specific employee.
     * @param employee the employee
     * @return list of refresh tokens
     */
    List<RefreshToken> findByEmployee(Employee employee);

    /**
     * Find all valid (non-revoked, non-expired) tokens for an employee.
     * @param employee the employee
     * @param now current timestamp
     * @return list of valid refresh tokens
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.employee = :employee AND rt.revoked = false AND rt.expiryDate > :now")
    List<RefreshToken> findValidTokensByEmployee(Employee employee, LocalDateTime now);

    /**
     * Revoke all tokens for a specific employee (used during logout or password reset).
     * @param employee the employee
     * @return number of tokens revoked
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.employee = :employee AND rt.revoked = false")
    int revokeAllUserTokens(Employee employee);

    /**
     * Delete expired refresh tokens (cleanup job).
     * @param now current timestamp
     * @return number of tokens deleted
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :now OR rt.revoked = true")
    int deleteExpiredAndRevokedTokens(LocalDateTime now);

    /**
     * Check if a valid token exists for an employee.
     * @param employee the employee
     * @param now current timestamp
     * @return true if at least one valid token exists
     */
    @Query("SELECT CASE WHEN COUNT(rt) > 0 THEN true ELSE false END FROM RefreshToken rt " +
           "WHERE rt.employee = :employee AND rt.revoked = false AND rt.expiryDate > :now")
    boolean hasValidToken(Employee employee, LocalDateTime now);
}
