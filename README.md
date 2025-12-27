# Metropolitan Generator Management System

A full-stack application for managing generator services, employee tasks, job cards, and overtime tracking.

## 🏗️ Project Structure

```
met-full-project/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Spring Boot 3.x + PostgreSQL
├── docs/              # Project documentation
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- **Frontend**: Node.js 18+, npm 9+
- **Backend**: Java 17+, Maven 3.8+
- **Database**: PostgreSQL 14+

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

### Environment Variables

**Backend** (`backend/src/main/resources/application.properties`):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/metdb
spring.datasource.username=your_username
spring.datasource.password=your_password

# JWT Configuration
jwt.secret=your-secret-key
jwt.access-token-expiration=900000    # 15 minutes
jwt.refresh-token-expiration=604800000 # 7 days

# Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 📋 Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with access + refresh tokens
- **Role-based access control** (ADMIN & EMPLOYEE)
- **Admin**: Persistent sessions with refresh tokens (7 days)
- **Employee**: Password required each session (no refresh tokens)
- Password reset with email verification

### 👥 User Management
- Employee registration and management
- Profile updates
- Role-based permissions

### ⚡ Generator Management
- CRUD operations for generators
- Generator information tracking
- Search and filtering

### 📝 Job Card System
- **Three job types**: SERVICE, REPAIR, VISIT
- Multi-employee assignment
- Date and time scheduling
- Email notifications

### ✅ Task Management (Mini Job Cards)
- Individual employee tasks
- Real-time status updates
- Location tracking
- Task ordering by time
- **Weight limits** (1-10 priority scale)
- **File attachments** for task completion

### 📊 Reports & Analytics
- **Time Tracking Reports**
  - On-hold time
  - In-progress time
  - Assigned time
  - Total time spent

- **Overtime Reports**
  - Morning overtime
  - Evening overtime
  - Daily location tracking
  - PDF export

### 📄 Activity Logs
- Complete audit trail
- Employee action tracking
- Date-based filtering

## 🎨 Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Date Handling**: date-fns-tz
- **Icons**: Lucide React
- **PDF Generation**: Client-side download

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA
- **Security**: Spring Security + JWT
- **PDF Generation**: iText
- **Email**: Jakarta Mail
- **Build Tool**: Maven

## 📁 Detailed Structure

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── ...
│   │   ├── Dashboard/       # Dashboard components
│   │   ├── JobCards/        # Job card components
│   │   ├── MyTasks/         # Task management components
│   │   └── Layout/          # Layout components
│   ├── pages/               # Page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Employees.tsx
│   │   ├── Generators.tsx
│   │   ├── JobCards.tsx
│   │   ├── MyTasks.tsx
│   │   ├── ActivityLogs.tsx
│   │   └── Report.tsx
│   ├── services/            # API services
│   │   ├── api.ts           # API methods
│   │   └── apiClient.ts     # Axios configuration
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication state
│   ├── hooks/               # Custom hooks
│   │   ├── useApi.ts        # API state management
│   │   └── useTheme.ts      # Theme management
│   ├── types/               # TypeScript types
│   │   └── api.ts           # API response types
│   └── utils/               # Utility functions
│       ├── downloadUtils.ts
│       └── errorHandler.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Backend Architecture

```
backend/
└── src/main/java/com/example/met/
    ├── controller/          # REST controllers
    │   ├── AuthController.java
    │   ├── EmployeeController.java
    │   ├── GeneratorController.java
    │   ├── JobCardController.java
    │   ├── MiniJobCardController.java
    │   ├── ReportController.java
    │   └── ...
    ├── service/             # Business logic
    │   ├── AuthService.java
    │   ├── EmployeeService.java
    │   ├── MiniJobCardService.java
    │   ├── FileStorageService.java
    │   ├── PdfGeneratorService.java
    │   └── ...
    ├── repository/          # Data access layer
    │   ├── EmployeeRepository.java
    │   ├── JobCardRepository.java
    │   └── ...
    ├── entity/              # JPA entities
    │   ├── Employee.java
    │   ├── Generator.java
    │   ├── JobCard.java
    │   ├── MiniJobCard.java
    │   └── ...
    ├── dto/                 # Data transfer objects
    │   ├── request/
    │   └── response/
    ├── security/            # Security configuration
    │   ├── JwtTokenProvider.java
    │   ├── JwtAuthenticationFilter.java
    │   └── ...
    ├── config/              # Application configuration
    └── exception/           # Exception handlers
```

## 🔑 API Endpoints

### Authentication
```
POST   /api/auth/login              # Login
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/logout             # Logout
POST   /api/auth/register           # Register employee
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password
```

### Employees
```
GET    /api/employees               # Get all employees
GET    /api/employees/{email}       # Get employee by email
PUT    /api/employees/{email}       # Update employee
DELETE /api/employees/{email}       # Delete employee
```

### Generators
```
GET    /api/generators              # Get all generators
POST   /api/generators              # Create generator
GET    /api/generators/{id}         # Get generator by ID
PUT    /api/generators/{id}         # Update generator
DELETE /api/generators/{id}         # Delete generator
GET    /api/generators/search       # Search generators
```

### Job Cards
```
GET    /api/jobcards                # Get all job cards
POST   /api/jobcards/service        # Create service job
POST   /api/jobcards/repair         # Create repair job
POST   /api/jobcards/visit          # Create visit job
GET    /api/jobcards/{id}           # Get job card by ID
PUT    /api/jobcards/{id}           # Update job card
DELETE /api/jobcards/{id}           # Delete job card
GET    /api/jobcards/by-date        # Get by date
GET    /api/jobcards/type/{type}    # Get by type
```

### Mini Job Cards (Tasks)
```
GET    /api/minijobcards                          # Get all tasks
POST   /api/minijobcards                          # Create task
GET    /api/minijobcards/{id}                     # Get task by ID
PUT    /api/minijobcards/{id}                     # Update task
PATCH  /api/minijobcards/{id}/weight              # Update weight (ADMIN)
POST   /api/minijobcards/{id}/attachment          # Upload attachment
GET    /api/minijobcards/{id}/attachment/download # Download attachment
DELETE /api/minijobcards/{id}/attachment          # Delete attachment (ADMIN)
```

### Reports
```
POST   /api/reports/employee-time-report      # Get time tracking data
POST   /api/reports/employee-time-report/pdf  # Download time tracking PDF
POST   /api/reports/employee-ot-report        # Get overtime data
POST   /api/reports/employee-ot-report/pdf    # Download overtime PDF
```

## 🛡️ Security

### JWT Authentication Flow

1. **Login**: User provides credentials → Server returns access token + sets refresh token in HttpOnly cookie
2. **API Calls**: Frontend includes access token in Authorization header
3. **Token Expiry**: When access token expires (15 min), axios automatically:
   - Intercepts 401 response
   - Calls refresh endpoint with HttpOnly cookie
   - Gets new access token
   - Retries original request
4. **Logout**: Clears tokens and revokes refresh token on server

### Role-Based Access

- **ADMIN**:
  - Full access to all features
  - Employee management
  - Job card assignment
  - Ticket weight management
  - Report generation
  - Refresh token enabled (persistent sessions)

- **EMPLOYEE**:
  - View assigned tasks
  - Update task status
  - View own reports
  - Location tracking
  - File upload on task completion
  - No refresh token (password required each session)

## 📦 Build & Deploy

### Frontend Production Build

```bash
cd frontend
npm run build
# Build output in frontend/dist/
```

### Backend Production Build

```bash
cd backend
mvn clean package
# JAR file in backend/target/met-0.0.1-SNAPSHOT.jar
```

### Run Production

```bash
# Backend
java -jar backend/target/met-0.0.1-SNAPSHOT.jar

# Frontend (serve with nginx, apache, or similar)
# Or use: npx serve -s frontend/dist
```

## 📚 Documentation

Detailed documentation available in the `docs/` folder:

- **ARCHITECTURE_DOCUMENTATION.md** - System architecture overview
- **ROLE_BASED_REFRESH_TOKEN_DOCUMENTATION.md** - Authentication system
- **TICKET_WEIGHT_ATTACHMENT_FEATURE.md** - Weight & attachment features
- **NEW_UI_ARCHITECTURE_GUIDE.md** - Frontend component guide
- **IMPLEMENTATION_SUMMARY.md** - Feature implementation details

## 🧪 Testing

```bash
# Backend tests
cd backend
mvn test

# Frontend tests (if configured)
cd frontend
npm test
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add some feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## 📝 License

This project is proprietary and confidential.

## 👨‍💻 Development Team

Metropolitan Generator Management System

---

**Version**: 1.0.0
**Last Updated**: December 2025
