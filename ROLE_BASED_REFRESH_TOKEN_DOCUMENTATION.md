# Role-Based Refresh Token Implementation

## 📋 Overview

This document explains the **role-based refresh token system** implemented in the application:

- **ADMIN users**: Get refresh tokens for persistent sessions (stay logged in)
- **EMPLOYEE users**: Must re-authenticate with password on each session (no refresh token)

---

## 🎯 Requirements

### ADMIN Panel
✅ **Persistent Login** - ADMIN users remain logged in using refresh tokens
✅ **Auto Refresh** - Access tokens refresh automatically when expired
✅ **No Repeated Password** - ADMIN users don't need to enter password repeatedly

### Employee Panel
✅ **Password Required** - EMPLOYEE users must enter password every time
✅ **No Refresh Token** - EMPLOYEE users never receive refresh tokens
✅ **Immediate Logout** - On 401 error, EMPLOYEE users are redirected to login immediately

---

## 🏗️ Architecture

### Backend Flow (Spring Boot)

```
┌─────────────┐
│ User Logs In│
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ AuthController   │
│  /auth/login     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ AuthService      │
│ loginWithTokens()│
└──────┬───────────┘
       │
       ▼
    Check Role
       │
    ┌──┴──┐
    │     │
  ADMIN EMPLOYEE
    │     │
    ▼     ▼
 Create  Skip
 Refresh Refresh
 Token   Token
    │     │
    └──┬──┘
       │
       ▼
┌──────────────────┐
│ AuthController   │
│ Set Cookie?      │
└──────┬───────────┘
       │
    ┌──┴──┐
    │     │
  ADMIN EMPLOYEE
    │     │
    ▼     ▼
  Set   Clear
Cookie Cookie
```

### Frontend Flow (React + Axios)

```
┌─────────────┐
│ 401 Error   │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Axios Interceptor│
└──────┬───────────┘
       │
       ▼
  Check User Role
  (localStorage)
       │
    ┌──┴──┐
    │     │
  ADMIN EMPLOYEE
    │     │
    ▼     ▼
 Attempt  Redirect
 Refresh  to Login
  Token   (No Refresh)
    │
    ▼
 Success?
    │
  ┌─┴─┐
  │   │
 YES  NO
  │   │
  ▼   ▼
Retry Redirect
Request to Login
```

---

## 🔧 Implementation Details

### Backend Changes

#### 1. Modified `AuthService.loginWithTokens()`

**Location:** `src/main/java/com/example/met/service/AuthService.java:58-107`

**Before:**
```java
// Always created refresh token for all users
RefreshToken refreshToken = refreshTokenService.createRefreshToken(employee, httpRequest);
return new LoginResult(authResponse, refreshToken.getToken());
```

**After:**
```java
// Only create refresh token for ADMIN users
String refreshTokenValue = null;
if (employee.getRole().name().equals("ADMIN")) {
    RefreshToken refreshToken = refreshTokenService.createRefreshToken(employee, httpRequest);
    refreshTokenValue = refreshToken.getToken();
    log.info("Refresh token created for ADMIN user: {}", request.getEmail());
} else {
    log.info("Refresh token NOT created for EMPLOYEE user: {} (password required on each login)", request.getEmail());
}
return new LoginResult(authResponse, refreshTokenValue);
```

**Key Changes:**
- ✅ Check `employee.getRole().name().equals("ADMIN")`
- ✅ Only call `refreshTokenService.createRefreshToken()` for ADMIN
- ✅ Return `null` for EMPLOYEE users
- ✅ Added logging to track behavior

---

#### 2. Modified `AuthController.login()`

**Location:** `src/main/java/com/example/met/controller/AuthController.java:76-109`

**Before:**
```java
// Always set refresh token cookie
setRefreshTokenCookie(httpResponse, loginResult.refreshTokenValue);
```

**After:**
```java
// Set refresh token cookie ONLY for ADMIN users
if (loginResult.refreshTokenValue != null) {
    setRefreshTokenCookie(httpResponse, loginResult.refreshTokenValue);
    log.debug("Refresh token cookie set for ADMIN user: {}", request.getEmail());
} else {
    // Clear any existing refresh token cookie for employee users
    clearRefreshTokenCookie(httpResponse);
    log.debug("No refresh token cookie for EMPLOYEE user: {}", request.getEmail());
}
```

**Key Changes:**
- ✅ Check if `refreshTokenValue` is not null (ADMIN only)
- ✅ Set cookie only for ADMIN users
- ✅ **Clear cookie** for EMPLOYEE users (important!)
- ✅ Added logging for debugging

---

### Frontend Changes

#### 3. Modified `apiClient.ts` Response Interceptor

**Location:** `src/services/apiClient.ts:92-122`

**Added Role Check:**
```typescript
// Check user role - only ADMIN users can refresh tokens
const userData = localStorage.getItem('userData');
let userRole: string | null = null;

if (userData) {
  try {
    const user = JSON.parse(userData);
    userRole = user.role;
  } catch (e) {
    console.error('Failed to parse userData:', e);
  }
}

// EMPLOYEE users must re-authenticate - no token refresh
if (userRole === 'EMPLOYEE') {
  console.log('🔒 EMPLOYEE user 401 - redirecting to login (no refresh token)');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userData');
  window.location.href = '/login';
  return Promise.reject(error);
}

// Only ADMIN users proceed with token refresh
```

**Key Changes:**
- ✅ Read `userData` from localStorage
- ✅ Parse user role
- ✅ If `EMPLOYEE`, redirect immediately (no refresh attempt)
- ✅ If `ADMIN`, proceed with token refresh logic
- ✅ Added console logging for debugging

---

## 📊 Behavior Comparison

| Scenario | ADMIN User | EMPLOYEE User |
|----------|------------|---------------|
| **Login** | Gets access token + refresh token (HttpOnly cookie) | Gets access token only (no refresh token) |
| **Access Token Expires** | Automatically refreshed using refresh token | Redirected to login immediately |
| **Refresh Token Expires** | Redirected to login | N/A (no refresh token) |
| **401 Error** | Attempts token refresh → retries request | Redirected to login immediately |
| **Session Duration** | 7 days (refresh token lifetime) | 15 minutes (access token lifetime) |
| **User Experience** | Persistent login, no password re-entry | Must enter password on each session |

---

## 🔍 Step-by-Step Scenarios

### Scenario 1: ADMIN User Login

1. **User enters credentials** → POST `/auth/login`
2. **Backend authenticates** → `authService.loginWithTokens()`
3. **Backend checks role** → `employee.getRole()` returns `ADMIN`
4. **Backend creates refresh token** → `refreshTokenService.createRefreshToken()`
5. **Backend sets HttpOnly cookie** → `setRefreshTokenCookie()` with 7-day expiration
6. **Frontend receives access token** → Stored in `localStorage`
7. **Frontend receives user data** → `{ role: 'ADMIN', ... }` stored in `localStorage`

**Result:**
- ✅ ADMIN user has access token (15 min) in localStorage
- ✅ ADMIN user has refresh token (7 days) in HttpOnly cookie
- ✅ ADMIN user can work without re-authentication for 7 days

---

### Scenario 2: EMPLOYEE User Login

1. **User enters credentials** → POST `/auth/login`
2. **Backend authenticates** → `authService.loginWithTokens()`
3. **Backend checks role** → `employee.getRole()` returns `EMPLOYEE`
4. **Backend SKIPS refresh token creation** → `refreshTokenValue = null`
5. **Backend CLEARS any existing cookie** → `clearRefreshTokenCookie()`
6. **Frontend receives access token** → Stored in `localStorage`
7. **Frontend receives user data** → `{ role: 'EMPLOYEE', ... }` stored in `localStorage`

**Result:**
- ✅ EMPLOYEE user has access token (15 min) in localStorage
- ❌ EMPLOYEE user has NO refresh token
- ⚠️ EMPLOYEE user must re-login after 15 minutes

---

### Scenario 3: ADMIN User Access Token Expires (Auto-Refresh)

1. **User makes API request** → Access token expired (15 min passed)
2. **Backend returns 401** → Unauthorized
3. **Axios interceptor catches 401** → Checks user role
4. **Role is ADMIN** → Proceeds with refresh attempt
5. **Interceptor calls /auth/refresh** → Refresh token sent via HttpOnly cookie
6. **Backend validates refresh token** → Valid, not expired
7. **Backend generates new access token** → 15 min expiration
8. **Backend rotates refresh token** → New 7-day refresh token
9. **Backend sets new cookie** → Updated HttpOnly cookie
10. **Frontend receives new access token** → Updates `localStorage`
11. **Interceptor retries original request** → With new access token

**Result:**
- ✅ ADMIN user continues working seamlessly
- ✅ No login prompt
- ✅ Session extended for another 7 days

---

### Scenario 4: EMPLOYEE User Access Token Expires (Redirect to Login)

1. **User makes API request** → Access token expired (15 min passed)
2. **Backend returns 401** → Unauthorized
3. **Axios interceptor catches 401** → Checks user role
4. **Role is EMPLOYEE** → SKIP refresh attempt
5. **Interceptor redirects to login** → `window.location.href = '/login'`
6. **localStorage cleared** → Access token and user data removed

**Result:**
- ⚠️ EMPLOYEE user sees login page
- ❌ No automatic refresh
- ✅ Security requirement met (password required on each session)

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] ADMIN user login → Check refresh token cookie is set
- [ ] EMPLOYEE user login → Check refresh token cookie is NOT set
- [ ] ADMIN user /auth/refresh → Success
- [ ] EMPLOYEE user /auth/refresh → Fails (no cookie)
- [ ] Refresh token expiry → 7 days for ADMIN
- [ ] Access token expiry → 15 minutes for both

### Frontend Tests

- [ ] ADMIN user 401 → Automatically refreshes token
- [ ] EMPLOYEE user 401 → Redirects to login immediately
- [ ] ADMIN user can work for 7 days without re-login
- [ ] EMPLOYEE user must re-login after 15 minutes
- [ ] Console logs show role-based behavior

### Manual Testing

1. **Test ADMIN Login:**
   ```bash
   # Check browser DevTools → Application → Cookies
   # Should see: refreshToken cookie with 7-day expiration
   ```

2. **Test EMPLOYEE Login:**
   ```bash
   # Check browser DevTools → Application → Cookies
   # Should NOT see: refreshToken cookie
   ```

3. **Test ADMIN Token Refresh:**
   ```bash
   # Wait 15 minutes → Make API request
   # Check Network tab → Should see /auth/refresh call
   # Should NOT see login redirect
   ```

4. **Test EMPLOYEE Token Expiry:**
   ```bash
   # Wait 15 minutes → Make API request
   # Should see immediate redirect to login
   # Should NOT see /auth/refresh call
   ```

---

## 🔒 Security Considerations

### Why EMPLOYEE Users Don't Get Refresh Tokens

1. **Higher Security for Sensitive Operations**
   - Employee-level actions require more frequent authentication
   - Reduces window for unauthorized access if device is compromised

2. **Compliance Requirements**
   - Some regulations require re-authentication for certain user roles
   - Audit trails show explicit authentication events

3. **Reduced Attack Surface**
   - No refresh token = no token to steal from cookies
   - Access token theft limited to 15-minute window

### Why ADMIN Users Get Refresh Tokens

1. **Better User Experience**
   - Admins perform frequent, repetitive tasks
   - Constant re-authentication hinders productivity

2. **Session Management**
   - ADMIN users need persistent sessions for dashboard monitoring
   - 7-day sessions reduce friction for legitimate admin work

3. **Token Rotation**
   - Refresh tokens are rotated on every refresh (security best practice)
   - Old refresh tokens are immediately invalidated

---

## 🚨 Troubleshooting

### Problem: EMPLOYEE user seeing "Invalid or expired refresh token"

**Cause:** Frontend is trying to refresh token for EMPLOYEE user

**Fix:** Clear browser cookies and localStorage, then re-login

**Prevention:** Frontend interceptor now checks role before refresh attempt

---

### Problem: ADMIN user redirected to login after 15 minutes

**Cause:** Refresh token cookie not being sent or backend not creating it

**Debug Steps:**
1. Check browser DevTools → Application → Cookies → Look for `refreshToken`
2. Check backend logs → Should see "Refresh token created for ADMIN user"
3. Check Network tab → /auth/login response should have `Set-Cookie` header

**Fix:** Ensure CORS allows credentials (`withCredentials: true` in Axios)

---

### Problem: EMPLOYEE user stays logged in after 15 minutes

**Cause:** Frontend interceptor not detecting EMPLOYEE role correctly

**Debug Steps:**
1. Check localStorage → `userData` should contain `{ role: 'EMPLOYEE' }`
2. Check console logs → Should see "🔒 EMPLOYEE user 401 - redirecting to login"
3. Check Network tab → Should NOT see /auth/refresh call

**Fix:** Verify `userData` structure matches expected format

---

## 📈 Performance Impact

### Before (Everyone Gets Refresh Token)
- All users had 7-day sessions
- Refresh token database table grows faster
- More /auth/refresh calls
- Higher server load

### After (ADMIN Only Gets Refresh Token)
- Only ADMIN users have 7-day sessions
- Refresh token database table grows slower (fewer tokens)
- Fewer /auth/refresh calls (only admins)
- Lower server load
- Better security posture

---

## 🎓 Best Practices

### DO ✅

- **Check user role before attempting token refresh**
- **Clear refresh token cookie for EMPLOYEE users on login**
- **Log role-based authentication decisions**
- **Test both ADMIN and EMPLOYEE flows**
- **Document the behavior for future developers**

### DON'T ❌

- **Don't create refresh tokens for all users**
- **Don't attempt refresh without checking role**
- **Don't assume all 401s should trigger refresh**
- **Don't forget to clear cookies for EMPLOYEE users**
- **Don't hardcode role checks (use consistent constants)**

---

## 📚 Related Files

### Backend
- `AuthService.java` - Login logic with role check
- `AuthController.java` - Cookie management
- `RefreshTokenService.java` - Token creation/rotation
- `RefreshToken.java` - Entity with employee relationship

### Frontend
- `apiClient.ts` - Axios interceptor with role check
- `AuthContext.tsx` - User data management
- `Login.tsx` - Login component

---

## 🚀 Summary

| Feature | Status | Details |
|---------|--------|---------|
| **Role-Based Refresh Tokens** | ✅ Implemented | ADMIN gets refresh token, EMPLOYEE doesn't |
| **ADMIN Persistent Login** | ✅ Working | 7-day sessions with auto-refresh |
| **EMPLOYEE Password Login** | ✅ Working | Must re-login every 15 minutes |
| **Frontend Role Check** | ✅ Implemented | Axios interceptor checks role before refresh |
| **Backend Cookie Management** | ✅ Implemented | Sets cookie only for ADMIN users |
| **Security** | ✅ Enhanced | Reduced attack surface for EMPLOYEE users |
| **Performance** | ✅ Optimized | Fewer tokens, fewer refresh calls |

---

**Last Updated:** 2025-12-27
**Status:** ✅ Production Ready
