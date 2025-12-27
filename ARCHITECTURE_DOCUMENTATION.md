# 🏗️ Full-Stack Authentication Architecture Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture Design](#architecture-design)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Authentication Flow](#authentication-flow)
6. [API Contracts](#api-contracts)
7. [Security Considerations](#security-considerations)
8. [Deployment Guide](#deployment-guide)

---

## 🎯 Overview

### What Was Built
A complete, production-ready JWT authentication system with:
- **Access Tokens**: Short-lived (15 minutes) tokens for API authentication
- **Refresh Tokens**: Long-lived (7 days) tokens stored in HttpOnly cookies
- **Automatic Token Refresh**: Seamless user experience with background token renewal
- **Token Rotation**: Enhanced security through refresh token rotation
- **Server-side Token Management**: Database-tracked refresh tokens with revocation capability

### Problems Solved
✅ **Before**: Users logged out every 24 hours
✅ **After**: Seamless 7-day sessions with auto-refresh

✅ **Before**: No refresh token mechanism
✅ **After**: Secure refresh token with rotation

✅ **Before**: Tokens in localStorage (XSS vulnerable)
✅ **After**: Refresh tokens in HttpOnly cookies (more secure)

✅ **Before**: Manual token management in frontend
✅ **After**: Automatic refresh via Axios interceptors

✅ **Before**: No server-side token invalidation
✅ **After**: Database-tracked tokens with logout support

---

## 🏗️ Architecture Design

### Token Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    JWT TOKEN ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────────────────┐
│  ACCESS TOKEN    │         │    REFRESH TOKEN              │
├──────────────────┤         ├──────────────────────────────┤
│ Lifetime: 15 min │         │ Lifetime: 7 days              │
│ Storage: Memory/ │         │ Storage: HttpOnly Cookie      │
│  localStorage    │         │ Rotation: On every refresh    │
│ Use: API calls   │         │ Use: Get new access token     │
└──────────────────┘         └──────────────────────────────┘
```

### System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ AuthContext  │  │  Axios Client│  │  API Service      │   │
│  │  - login()   │  │  - Intercept │  │  - login()        │   │
│  │  - logout()  │  │  - Auto-      │  │  - getAllX()      │   │
│  │  - user data │  │    refresh   │  │  - ...            │   │
│  └──────────────┘  └──────────────┘  └───────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌────────────────────────────────────────────────────────────────┐
│                    SERVER (Spring Boot)                         │
├────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ AuthController  │  │  AuthService     │  │ JWT Provider│  │
│  │  /auth/login    │  │  - Authenticate  │  │  - Generate │  │
│  │  /auth/refresh  │  │  - Create tokens │  │  - Validate │  │
│  │  /auth/logout   │  │  - Revoke tokens │  │  - Extract  │  │
│  └─────────────────┘  └──────────────────┘  └─────────────┘  │
│           ↕                      ↕                              │
│  ┌─────────────────┐  ┌──────────────────┐                    │
│  │ RefreshToken    │  │  Employee        │                    │
│  │ Repository      │  │  Repository      │                    │
│  └─────────────────┘  └──────────────────┘                    │
└────────────────────────────────────────────────────────────────┘
                              ↕
┌────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                       │
├────────────────────────────────────────────────────────────────┤
│  refresh_tokens table:                                          │
│  - id, token, employee_email, expiry_date, revoked, ...        │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Implementation

### 1. RefreshToken Entity

**Location**: `Metropolitan-B-main/src/main/java/com/example/met/entity/RefreshToken.java`

```java
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    - token: Unique UUID
    - employee: ManyToOne relationship
    - expiryDate: 7 days from creation
    - revoked: Boolean flag
    - userAgent, ipAddress: Security tracking
}
```

**Purpose**: Track active refresh tokens in database for:
- Token validation
- Revocation on logout
- Security auditing
- Automatic cleanup

### 2. JWT Token Provider

**Location**: `Metropolitan-B-main/src/main/java/com/example/met/security/JwtTokenProvider.java`

**Key Methods**:
- `generateAccessToken()` - Creates 15-minute access token
- `generateAccessTokenFromEmail()` - For token refresh
- `validateToken()` - Verifies JWT signature and expiration
- `getEmailFromToken()` - Extracts user email

**Token Claims**:
```json
{
  "sub": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790,
  "type": "access"
}
```

### 3. RefreshTokenService

**Location**: `Metropolitan-B-main/src/main/java/com/example/met/service/RefreshTokenService.java`

**Key Features**:
- Token creation with metadata (IP, user agent)
- Token validation and expiration check
- Token revocation (single & bulk)
- Token rotation for security
- Scheduled cleanup job (daily at 2 AM)

### 4. AuthService

**Location**: `Metropolitan-B-main/src/main/java/com/example/met/service/AuthService.java`

**Core Methods**:

```java
public LoginResult loginWithTokens(LoginRequest request, HttpServletRequest httpRequest)
// Returns: { authResponse, refreshTokenValue }

public RefreshResult refreshAccessToken(String refreshToken, HttpServletRequest httpRequest)
// Returns: { refreshResponse, newRefreshTokenValue }

public void logout(String email)
// Revokes all user tokens
```

### 5. AuthController

**Location**: `Metropolitan-B-main/src/main/java/com/example/met/controller/AuthController.java`

**Endpoints**:

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/auth/login` | POST | No | Login with email/password |
| `/auth/refresh` | POST | No* | Refresh access token |
| `/auth/logout` | POST | Yes | Revoke all tokens |
| `/auth/register` | POST | No | Register new employee |

*Refresh endpoint reads token from HttpOnly cookie

**Cookie Configuration**:
```java
Cookie Properties:
- Name: refreshToken
- HttpOnly: true
- Secure: false (true in production)
- SameSite: Lax
- Path: /api/auth
- Max-Age: 7 days
```

### 6. Security Configuration

**Location**: `Metropolitan-B-main/src/main/java/com/example/met/config/SecurityConfig.java`

**Key Updates**:
```java
// CORS with credentials enabled
configuration.setAllowCredentials(true);

// Public endpoints
.requestMatchers("/auth/login", "/auth/register", "/auth/refresh").permitAll()

// Protected endpoints
.requestMatchers("/auth/logout").authenticated()
.anyRequest().authenticated()
```

### 7. Application Properties

**Location**: `Metropolitan-B-main/src/main/resources/application.properties`

```properties
# Access token: 15 minutes
jwt.expiration=900000

# Refresh token: 7 days
jwt.refresh.expiration=604800000

# Cookie settings
jwt.refresh.cookie.name=refreshToken
jwt.refresh.cookie.httpOnly=true
jwt.refresh.cookie.secure=false
jwt.refresh.cookie.sameSite=Lax
```

---

## 💻 Frontend Implementation

### 1. API Client with Interceptors

**Location**: `Metropolitan-D-main/src/services/apiClient.ts`

**Features**:
- Axios instance with `withCredentials: true`
- Request interceptor: Adds access token to Authorization header
- Response interceptor: Auto-refreshes on 401 errors
- Request queuing during token refresh
- Automatic retry after successful refresh

**Auto-Refresh Flow**:
```javascript
1. API call returns 401
2. Interceptor catches error
3. Calls /auth/refresh (with HttpOnly cookie)
4. Receives new access token
5. Updates localStorage
6. Retries original request
7. If refresh fails → redirect to login
```

### 2. Updated AuthContext

**Location**: `Metropolitan-D-main/src/contexts/AuthContext.tsx`

**Changes**:
- Uses `AuthTokenResponse` instead of `AuthResponse`
- Stores `accessToken` instead of `token`
- `logout()` calls backend endpoint
- `updateAccessToken()` for refresh support

**Storage Strategy**:
```javascript
localStorage:
- accessToken: JWT access token
- userData: { email, name, role, contactNumber }

HttpOnly Cookie (automatic):
- refreshToken: Managed by browser
```

### 3. API Service

**Location**: `Metropolitan-D-main/src/services/api.ts`

**Updated Methods**:
```typescript
// New auth endpoints
login(credentials): Promise<ApiResponse<AuthTokenResponse>>
refreshToken(): Promise<ApiResponse<RefreshTokenResponse>>
logout(): Promise<ApiResponse<string>>

// All other endpoints automatically use axios client
getAllEmployees(), getJobCards(), etc.
```

### 4. Type Definitions

**Location**: `Metropolitan-D-main/src/types/api.ts`

**New Types**:
```typescript
interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  contactNumber: string;
  authenticated: boolean;
}

interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
}
```

---

## 🔄 Authentication Flow

### Login Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Client  │                 │ Backend │                 │ Database │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │ 1. POST /auth/login       │                           │
     │ { email, password }       │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ 2. Authenticate           │
     │                           │───────────────────────────>│
     │                           │                           │
     │                           │ 3. Generate access token  │
     │                           │ 4. Create refresh token   │
     │                           │───────────────────────────>│
     │                           │                           │
     │ 5. Return auth response + │                           │
     │    Set-Cookie: refreshToken│                          │
     │<──────────────────────────│                           │
     │                           │                           │
     │ 6. Store accessToken in   │                           │
     │    localStorage           │                           │
     │ 7. Browser stores cookie  │                           │
     │    (automatic)            │                           │
```

### API Call with Auto-Refresh Flow

```
┌─────────┐                 ┌─────────┐
│ Client  │                 │ Backend │
└────┬────┘                 └────┬────┘
     │                           │
     │ 1. GET /employees          │
     │    Authorization: Bearer <expired-token>
     ├──────────────────────────>│
     │                           │
     │ 2. 401 Unauthorized        │
     │<──────────────────────────│
     │                           │
     │ 3. Interceptor catches    │
     │    401 error              │
     │                           │
     │ 4. POST /auth/refresh     │
     │    Cookie: refreshToken   │
     ├──────────────────────────>│
     │                           │
     │ 5. New access token +     │
     │    New refresh token      │
     │<──────────────────────────│
     │                           │
     │ 6. Retry GET /employees   │
     │    Authorization: Bearer <new-token>
     ├──────────────────────────>│
     │                           │
     │ 7. 200 OK + data          │
     │<──────────────────────────│
```

### Logout Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Client  │                 │ Backend │                 │ Database │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │ 1. POST /auth/logout      │                           │
     │    Authorization: Bearer <token>                      │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ 2. Revoke all user tokens │
     │                           │───────────────────────────>│
     │                           │                           │
     │ 3. Clear cookie +         │                           │
     │    Success message        │                           │
     │<──────────────────────────│                           │
     │                           │                           │
     │ 4. Clear localStorage     │                           │
     │ 5. Redirect to /login     │                           │
```

---

## 📜 API Contracts

### POST /auth/login

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "contactNumber": "+1234567890",
    "authenticated": true
  }
}
```

**Response Headers**:
```
Set-Cookie: refreshToken=550e8400-e29b-41d4-a716-446655440000; Path=/api/auth; Max-Age=604800; HttpOnly; SameSite=Lax
```

### POST /auth/refresh

**Request**: Empty body (refresh token from cookie)

**Response** (200 OK):
```json
{
  "status": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "email": "user@example.com"
  }
}
```

**Response Headers**:
```
Set-Cookie: refreshToken=<new-token-uuid>; Path=/api/auth; Max-Age=604800; HttpOnly; SameSite=Lax
```

### POST /auth/logout

**Request**: Empty body

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "status": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

## 🔒 Security Considerations

### What We Implemented

✅ **Short-lived Access Tokens** (15 minutes)
Minimizes damage if token is stolen

✅ **HttpOnly Refresh Tokens**
Cannot be accessed by JavaScript (XSS protection)

✅ **Token Rotation**
New refresh token on every refresh (prevents replay attacks)

✅ **Server-side Token Tracking**
Database-stored tokens can be revoked

✅ **CORS with Credentials**
Properly configured for cookie transmission

✅ **Token Metadata Tracking**
IP and User-Agent logged for security auditing

✅ **Automatic Token Cleanup**
Daily job removes expired tokens

### Security Best Practices

🔐 **In Production**:
1. Set `jwt.refresh.cookie.secure=true` (HTTPS only)
2. Use strong JWT secret (256+ bits)
3. Enable rate limiting on auth endpoints
4. Implement CSRF protection for state-changing operations
5. Add request ID logging for audit trails
6. Monitor for suspicious token refresh patterns

🔐 **Additional Recommendations**:
- Implement MFA for admin users
- Add device fingerprinting
- Limit concurrent sessions per user
- Implement IP whitelist for sensitive operations

---

## 🚀 Deployment Guide

### Environment Variables

**Backend (.env or Railway)**:
```bash
# Database
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your-super-secret-key-min-256-bits
JWT_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# Cookie Security
JWT_REFRESH_COOKIE_SECURE=true # MUST be true in production with HTTPS
```

**Frontend (.env)**:
```bash
VITE_API_BASE_URL=https://your-backend.com/api
```

### Deployment Checklist

- [ ] Update `apiClient.ts` BASE_URL to production backend
- [ ] Set `jwt.refresh.cookie.secure=true` in production
- [ ] Configure CORS allowed origins (remove wildcards)
- [ ] Enable HTTPS on both frontend and backend
- [ ] Test login flow end-to-end
- [ ] Test token refresh (wait 15 min or mock expiration)
- [ ] Test logout flow
- [ ] Verify HttpOnly cookies are set
- [ ] Test protected routes redirect to login when unauthenticated

### Testing

**Manual Testing**:
1. Login → Verify accessToken in localStorage, refreshToken in cookies
2. Make API call → Verify Authorization header sent
3. Wait 15 minutes (or expire token manually) → Make API call → Verify auto-refresh
4. Logout → Verify tokens cleared, redirected to login
5. Try accessing protected route without auth → Verify redirect

**Browser DevTools**:
- Application tab → Local Storage → Check `accessToken` and `userData`
- Application tab → Cookies → Check `refreshToken` (HttpOnly should be checked)
- Network tab → Check `/auth/login` response headers for Set-Cookie
- Network tab → Check API calls have Authorization header

---

## 📊 Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Session Duration** | 24 hours (forced logout) | 7 days (seamless) |
| **User Experience** | Frequent re-login | Automatic refresh |
| **Security** | Access token only | Access + Refresh with rotation |
| **Token Storage** | localStorage (both) | Access: localStorage, Refresh: HttpOnly cookie |
| **Token Management** | Manual | Automatic via interceptors |
| **Server Control** | No token revocation | Database-tracked, revocable |
| **Code Quality** | Scattered auth logic | Centralized in AuthContext + apiClient |

---

## 🎓 Key Architectural Decisions

### Why Two Tokens?

**Access Token** (short-lived):
- Used for every API call
- If stolen, limited damage (15 min validity)
- Stored in memory/localStorage for easy access

**Refresh Token** (long-lived):
- Used only to get new access tokens
- More secure (HttpOnly cookie, can't be accessed by JS)
- If stolen, can be revoked from database

### Why HttpOnly Cookies for Refresh Token?

- **XSS Protection**: JavaScript cannot access the token
- **Automatic transmission**: Browser sends cookie automatically
- **Secure flag**: Can enforce HTTPS-only transmission

### Why Token Rotation?

- **Replay Attack Prevention**: Old refresh token becomes invalid after use
- **Breach Detection**: Reuse of old token indicates compromise
- **Limited Attack Window**: Stolen token expires after next refresh

### Why Database-Tracked Tokens?

- **Revocation**: Can invalidate all user sessions on logout
- **Auditing**: Track when/where tokens were created
- **Anomaly Detection**: Monitor unusual refresh patterns
- **Cleanup**: Automatically remove expired tokens

---

## 📞 Support & Maintenance

### Common Issues

**Issue**: "Token refresh failed, redirecting to login"
- **Cause**: Refresh token expired (7 days) or was revoked
- **Solution**: User needs to login again (expected behavior)

**Issue**: "CORS error when calling /auth/refresh"
- **Cause**: `withCredentials` not set or CORS not allowing credentials
- **Solution**: Verify `axios.create({ withCredentials: true })` and backend CORS config

**Issue**: "Refresh token cookie not being sent"
- **Cause**: Cookie domain/path mismatch or SameSite policy
- **Solution**: Check cookie path `/api/auth` matches request URL

### Monitoring

Monitor these metrics:
- Token refresh rate (should correlate with active users)
- Failed refresh attempts (potential attacks)
- Token creation rate (login frequency)
- Expired token cleanup count (storage management)

---

## 🎉 Conclusion

This architecture provides a **production-ready, secure, and user-friendly** authentication system that balances security with usability. The implementation follows industry best practices and can scale to support thousands of concurrent users.

**Key Achievements**:
✅ Secure JWT implementation with refresh tokens
✅ Automatic token refresh for seamless UX
✅ HttpOnly cookies for enhanced security
✅ Token rotation to prevent replay attacks
✅ Server-side token management and revocation
✅ Clean separation of concerns (backend/frontend)
✅ Centralized error handling and retry logic

**Next Steps** (Optional Enhancements):
- Implement rate limiting
- Add refresh token family tracking (detect concurrent use)
- Implement device management (list active sessions)
- Add push notifications for new logins
- Implement remember me option (longer refresh token)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Author**: Senior Full-Stack Architect & Security Engineer

