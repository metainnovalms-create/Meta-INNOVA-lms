# Meta-INNOVA LMS - Backend API Documentation

## Overview
- **Base URL**: `http://localhost:3000/api` (development)
- **Authentication**: JWT Bearer Token
- **Multi-tenancy**: Path-based with tenant_id in JWT payload
- **Database**: PostgreSQL (Neon)

## Authentication Flow
1. User submits email/password to `/api/auth/login`
2. Backend validates credentials, checks role from `user_roles` table
3. Backend generates JWT with payload: `{ user_id, email, role, tenant_id }`
4. Frontend stores JWT in localStorage
5. All subsequent requests include `Authorization: Bearer <token>` header

---

## 🔐 AUTHENTICATION ENDPOINTS

### POST /api/auth/login
**Purpose**: Authenticate user and return JWT token

**Request Body**:
```json
{
  "email": "admin@school1.com",
  "password": "SecurePassword123"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-123",
    "email": "admin@school1.com",
    "name": "John Doe",
    "avatar": "https://cdn.example.com/avatars/john.jpg",
    "role": "institution_admin",
    "tenant_id": "tenant-456",
    "institution_id": "inst-789",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "tenant": {
    "id": "tenant-456",
    "name": "Delhi Public School",
    "slug": "dps-delhi"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Email or password is incorrect"
}
```

**JWT Payload Structure**:
```typescript
{
  user_id: string;
  email: string;
  role: UserRole;
  tenant_id?: string; // null for super_admin
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}
```

### POST /api/auth/logout
**Purpose**: Invalidate token (optional - can be client-side only)

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/auth/me
**Purpose**: Get current authenticated user details

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "email": "student@school1.com",
    "name": "Jane Smith",
    "role": "student",
    "tenant_id": "tenant-456",
    "institution_id": "inst-789"
  }
}
```

---

## 🗄️ DATABASE SCHEMA DESIGN

### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
```

### 2. user_roles (CRITICAL - Prevents privilege escalation)
```sql
CREATE TYPE app_role AS ENUM (
  'super_admin',
  'system_admin', 
  'institution_admin',
  'management',
  'officer',
  'teacher',
  'student'
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- null for super_admin
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role, tenant_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
```

### 3. tenants (For System Admin - HQ level)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- for path-based routing
  logo TEXT,
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
```

### 4. institutions (Schools/Colleges under a tenant)
```sql
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  logo TEXT,
  academic_year VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_institutions_tenant_id ON institutions(tenant_id);
```

---

## 🔒 SECURITY IMPLEMENTATION

### Password Hashing
```javascript
const bcrypt = require('bcrypt');

// Hash password before storing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password during login
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### JWT Generation
```javascript
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user, role, tenant_id) => {
  const payload = {
    user_id: user.id,
    email: user.email,
    role: role,
    tenant_id: tenant_id
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};
```

### Middleware for Protected Routes
```javascript
// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based access middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
app.get('/api/super-admin/stats', 
  authenticateToken, 
  requireRole('super_admin'), 
  (req, res) => {
    // Handler logic
  }
);
```

### Tenant Isolation
```javascript
// Middleware to validate tenant access
const validateTenantAccess = (req, res, next) => {
  const { tenantId } = req.params;
  const userTenantId = req.user.tenant_id;
  
  // Super admin can access all tenants
  if (req.user.role === 'super_admin') {
    return next();
  }
  
  // Check if user belongs to requested tenant
  if (userTenantId !== tenantId) {
    return res.status(403).json({ error: 'Access denied to this tenant' });
  }
  
  next();
};
```

---

## 📋 REQUIRED PACKAGES

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  }
}
```

---

## 🌐 ENVIRONMENT VARIABLES

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
```

---

## 🚀 NEXT STEPS FOR BACKEND DEVELOPMENT

1. **Phase 1**: 
   - Set up Express server
   - Configure PostgreSQL connection (Neon)
   - Create database tables (users, user_roles, tenants, institutions)
   - Implement authentication endpoints (/auth/login, /auth/logout, /auth/me)
   - Set up JWT middleware
   - Test login flow with frontend

2. **Phase 2**: Super Admin Endpoints
3. **Phase 3**: Student Endpoints
4. **Phase 4**: Innovation Officer Endpoints
5. **Phase 5**: Institution Admin Endpoints
6. **Phase 6**: System Admin & Teacher Endpoints

---

## 📞 SUPPORT

For questions or clarifications on the API design, refer to the complete implementation plan document or contact the frontend development team.
