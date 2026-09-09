# Admin API Integration Guide

This guide provides comprehensive instructions for connecting an admin application to the Pi Clubhouse server using the existing admin routes.

## Table of Contents

1. [Server Setup](#server-setup)
2. [Authentication](#authentication)
3. [API Client Configuration](#api-client-configuration)
4. [CRUD Operations](#crud-operations)
5. [Specialized Endpoints](#specialized-endpoints)
6. [Error Handling](#error-handling)
7. [Security Considerations](#security-considerations)
8. [Usage Examples](#usage-examples)

## Server Setup

### Prerequisites

- Node.js 18+ 
- MongoDB
- TypeScript
- pnpm package manager

### Installation

```bash
cd server
pnpm install
```

### Environment Configuration

Create a `.env.local` file in the server directory:

```env
# Server Configuration
SERVER_PORT=4000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/pi-clubhouse

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Email Whitelist
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# CORS Origins
FRONTEND_URL=http://localhost:3000
```

### Starting the Server

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## Authentication

### Admin Authentication Flow

The admin API uses a two-step authentication process:

1. **Request OTP**: Send email and role to receive a 6-digit OTP
2. **Verify OTP**: Submit the OTP to get a JWT token

### Authentication Endpoints

```typescript
// Step 1: Request OTP
POST /api/admin/auth
{
  "email": "admin@example.com",
  "role": "admin" // super_admin, admin, editor_admin
}

// Response
{
  "success": true,
  "message": "OTP sent to your email",
  "requiresOTP": true
}

// Step 2: Verify OTP
POST /api/admin/auth
{
  "email": "admin@example.com",
  "role": "admin",
  "otp": "123456"
}

// Response
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "permissions": ["manage_users", "manage_blog", ...]
  }
}
```

### Role-Based Permissions

| Role | Permissions |
|------|-------------|
| `super_admin` | All permissions including user management |
| `admin` | Content management, analytics, revenue |
| `editor_admin` | Content review, basic analytics |

## API Client Configuration

### Basic Setup

```typescript
import { AdminApiClient, createAdminApiClient } from './lib/admin-api-client';

// Create client instance
const adminApi = createAdminApiClient('http://localhost:4000');

// Or with custom configuration
const adminApi = new AdminApiClient({
  baseURL: 'http://localhost:4000',
  timeout: 30000,
  headers: {
    'X-Client': 'admin-app',
  },
});
```

### Authentication

```typescript
// Step 1: Request OTP
const otpResponse = await adminApi.authenticate('admin@example.com', 'admin');

if (otpResponse.success) {
  console.log('OTP sent to email');
} else {
  console.error('Failed to send OTP:', otpResponse.message);
}

// Step 2: Verify OTP (after user enters the code)
const authResponse = await adminApi.authenticate('admin@example.com', 'admin', '123456');

if (authResponse.success && authResponse.token) {
  console.log('Authenticated successfully');
  console.log('User:', authResponse.user);
} else {
  console.error('Authentication failed:', authResponse.message);
}

// Check if still authenticated
const checkResponse = await adminApi.checkAuth();
if (checkResponse.success) {
  console.log('Still authenticated');
} else {
  console.log('Need to re-authenticate');
}

// Logout
adminApi.logout();
```

## CRUD Operations

### User Management

```typescript
// Get users with pagination and filtering
const users = await adminApi.getUsers({ 
  page: 1, 
  limit: 20, 
  search: 'john',
  status: 'active'
});

// Response includes:
// - users array
// - pagination info
// - success status
```

### Blog Management

```typescript
// Get blog posts
const posts = await adminApi.getBlogPosts({ 
  page: 1, 
  limit: 20, 
  status: 'published',
  search: 'blockchain'
});

// Get single blog post
const post = await adminApi.getBlogPost('post-slug');

// Create new blog post
const newPost = await adminApi.createBlogPost({
  title: 'New Post',
  content: 'Content...',
  status: 'draft',
  categories: ['technology'],
  tags: ['blockchain', 'pi-network']
});

// Update blog post
const updatedPost = await adminApi.updateBlogPost('post-slug', {
  status: 'published',
  content: 'Updated content...'
});

// Delete blog post
await adminApi.deleteBlogPost('post-slug');

// Get blog categories
const categories = await adminApi.getBlogCategories();

// Get blog tags
const tags = await adminApi.getBlogTags();
```

### Listings Management

```typescript
// Get business listings
const businessListings = await adminApi.getBusinessListings({ 
  status: 'pending',
  limit: 10 
});

// Get startup listings
const startupListings = await adminApi.getStartupListings({ 
  status: 'approved' 
});

// Get community listings
const communityListings = await adminApi.getCommunityListings({ 
  status: 'active' 
});

// Get influencer listings
const influencerListings = await adminApi.getInfluencerListings({ 
  status: 'pending' 
});

// Review listings (approve/reject)
const reviewResult = await adminApi.reviewListing('listing-id', 'approve', 'Great listing!');
```

### Ecosystem Management

```typescript
// Get ecosystem events
const events = await adminApi.getEcosystemEvents({ 
  status: 'upcoming',
  limit: 20 
});

// Get ecosystem hackathons
const hackathons = await adminApi.getEcosystemHackathons({ 
  status: 'active' 
});

// Get ecosystem communities
const communities = await adminApi.getEcosystemCommunities({ 
  status: 'approved' 
});
```

### Address Management

```typescript
// Generated Addresses
const generatedAddresses = await adminApi.getGeneratedAddresses();
const newGeneratedAddress = await adminApi.createGeneratedAddress({
  identifier: 'GALAXY123',
  Name: 'Galaxy Wallet',
  Category: 'Wallet',
  Description: 'Popular Pi wallet',
  Logo: 'https://example.com/logo.png',
  Rank: 1,
  Website: 'https://galaxy.com'
});

// CEX Addresses
const cexAddresses = await adminApi.getCexAddresses();
const newCexAddress = await adminApi.createCexAddress({
  identifier: 'BINANCE123',
  name: 'Binance',
  category: 'Exchange',
  description: 'Major cryptocurrency exchange',
  logo: 'https://example.com/binance.png',
  buy: 'https://binance.com/buy/pi',
  website: 'https://binance.com'
});

// Core Team Addresses
const coreTeamAddresses = await adminApi.getCoreTeamAddresses();
const newCoreTeamAddress = await adminApi.createCoreTeamAddress({
  identifier: 'CORE123',
  name: 'Dr. Nicolas Kokkalis',
  description: 'Pi Network Co-Founder',
  role: 'Co-Founder'
});
```

## Specialized Endpoints

### Analytics

```typescript
// Get analytics for different time periods
const analytics24h = await adminApi.getAnalytics('24h');
const analytics7d = await adminApi.getAnalytics('7d');
const analytics30d = await adminApi.getAnalytics('30d');

// Response includes:
// - User statistics
// - Activity statistics
// - Period information
```

### Combined Data

```typescript
// Get combined communities data
const combinedCommunities = await adminApi.getCombinedCommunities({
  status: 'approved',
  limit: 50
});

// Get combined influencers data
const combinedInfluencers = await adminApi.getCombinedInfluencers({
  status: 'active',
  limit: 50
});
```

### Protected Data

```typescript
// Get protected data
const protectedData = await adminApi.getProtectedData('sensitive-info');
```

### File Upload

```typescript
// Upload images or documents
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const file = fileInput.files[0];

if (file) {
  const uploadResult = await adminApi.uploadFile(file, 'image');
  
  if (uploadResult.success) {
    console.log('File uploaded:', uploadResult.data);
  } else {
    console.error('Upload failed:', uploadResult.error);
  }
}
```

### Health Check

```typescript
// Check server health
const health = await adminApi.checkHealth();
console.log('Server status:', health.data);
```

## Error Handling

### Response Structure

All API responses follow this structure:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### Error Handling Examples

```typescript
// Generic error handling
async function handleApiCall<T>(apiCall: Promise<ApiResponse<T>>): Promise<T | null> {
  try {
    const response = await apiCall;
    
    if (response.success) {
      return response.data;
    } else {
      console.error('API Error:', response.error || response.message);
      return null;
    }
  } catch (error) {
    console.error('Network Error:', error);
    return null;
  }
}

// Usage
const users = await handleApiCall(adminApi.getUsers());
if (users) {
  console.log('Users loaded:', users);
} else {
  console.log('Failed to load users');
}

// Specific error handling
const response = await adminApi.getUsers();
if (!response.success) {
  if (response.error?.includes('authentication')) {
    // Re-authenticate
    await adminApi.authenticate('admin@example.com', 'admin', 'otp');
  } else if (response.error?.includes('permission')) {
    // Show permission error
    alert('You do not have permission to perform this action');
  } else {
    // Show generic error
    alert('An error occurred: ' + response.error);
  }
}
```

## Security Considerations

### Authentication Security

1. **JWT Token Management**
   - Tokens expire after 24 hours
   - Store tokens securely (not in localStorage for production)
   - Implement automatic token refresh

2. **OTP Security**
   - OTPs expire after 10 minutes
   - Rate limiting on OTP requests
   - Email whitelist for admin accounts

3. **Role-Based Access Control**
   - Verify permissions before operations
   - Log all admin activities
   - Audit trail for sensitive operations

### API Security

1. **CORS Configuration**
   - Whitelist specific origins
   - Enable credentials
   - Proper headers configuration

2. **Rate Limiting**
   - Implement rate limiting on all endpoints
   - Different limits for different operations
   - IP-based and user-based limits

3. **Input Validation**
   - Validate all input data
   - Sanitize user inputs
   - Prevent injection attacks

### Best Practices

```typescript
// Secure token storage (for browser environments)
class SecureTokenStorage {
  private static readonly TOKEN_KEY = 'admin_token';
  
  static setToken(token: string): void {
    // Use httpOnly cookies in production
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }
  
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
  
  static removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}

// Automatic token refresh
setInterval(async () => {
  const checkResponse = await adminApi.checkAuth();
  if (!checkResponse.success) {
    // Token expired, redirect to login
    window.location.href = '/login';
  }
}, 5 * 60 * 1000); // Check every 5 minutes
```

## Usage Examples

### Complete Admin Dashboard Example

```typescript
import { AdminApiClient } from './lib/admin-api-client';

class AdminDashboard {
  private api: AdminApiClient;
  
  constructor() {
    this.api = new AdminApiClient({
      baseURL: 'http://localhost:4000',
      timeout: 30000,
    });
  }
  
  async initialize() {
    // Check authentication
    const authCheck = await this.api.checkAuth();
    if (!authCheck.success) {
      await this.showLoginForm();
    } else {
      await this.loadDashboard();
    }
  }
  
  async showLoginForm() {
    const email = prompt('Enter admin email:');
    const role = prompt('Enter role (admin/super_admin/editor_admin):');
    
    if (email && role) {
      const otpResponse = await this.api.authenticate(email, role);
      if (otpResponse.success) {
        const otp = prompt('Enter OTP sent to your email:');
        if (otp) {
          const authResponse = await this.api.authenticate(email, role, otp);
          if (authResponse.success) {
            await this.loadDashboard();
          }
        }
      }
    }
  }
  
  async loadDashboard() {
    // Load analytics
    const analytics = await this.api.getAnalytics('7d');
    this.displayAnalytics(analytics);
    
    // Load recent users
    const users = await this.api.getUsers({ limit: 10 });
    this.displayRecentUsers(users);
    
    // Load pending listings
    const listings = await this.api.getListings();
    this.displayPendingListings(listings);
  }
  
  async approveListing(listingId: string) {
    const result = await this.api.reviewListing(listingId, 'approve', 'Approved by admin');
    
    if (result.success) {
      alert('Listing approved successfully');
      await this.loadDashboard(); // Refresh dashboard
    } else {
      alert('Failed to approve listing: ' + result.error);
    }
  }
  
  private displayAnalytics(analytics: any) {
    console.log('Analytics:', analytics);
    // Update UI with analytics data
  }
  
  private displayRecentUsers(users: any) {
    console.log('Recent Users:', users);
    // Update UI with user data
  }
  
  private displayPendingListings(listings: any) {
    console.log('Pending Listings:', listings);
    // Update UI with listing data
  }
}

// Initialize dashboard
const dashboard = new AdminDashboard();
dashboard.initialize();
```

### React/Vue/Angular Integration

```typescript
// React Hook Example
import { useState, useEffect } from 'react';
import { AdminApiClient } from './lib/admin-api-client';

export function useAdminApi() {
  const [api] = useState(() => new AdminApiClient({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000'
  }));
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    const response = await api.checkAuth();
    setIsAuthenticated(response.success);
    setUser(response.user || null);
  };
  
  const login = async (email: string, role: string, otp?: string) => {
    const response = await api.authenticate(email, role, otp);
    if (response.success) {
      setIsAuthenticated(true);
      setUser(response.user);
    }
    return response;
  };
  
  const logout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
  };
  
  return {
    api,
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth
  };
}
```

## Production Deployment

### Environment Variables

```env
# Production Configuration
NODE_ENV=production
SERVER_PORT=4000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-admin-app.com

# Security
CORS_ORIGINS=https://your-admin-app.com,https://your-backup-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your-production-email
SMTP_PASS=your-production-password

# Admin Configuration
ADMIN_EMAILS=admin1@yourdomain.com,admin2@yourdomain.com
```

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure JWT secret
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security audits
- [ ] Backup database regularly
- [ ] Use environment variables for secrets
- [ ] Implement proper error handling
- [ ] Set up SSL certificates

### Monitoring

```typescript
// Health check monitoring
setInterval(async () => {
  const health = await adminApi.checkHealth();
  if (!health.success) {
    // Alert administrators
    console.error('System health check failed:', health.error);
  }
}, 5 * 60 * 1000); // Check every 5 minutes
```

## API Endpoints Summary

### Authentication
```
POST /api/admin/auth - Request OTP or verify OTP
GET  /api/admin/auth/check - Check authentication status
```

### User Management
```
GET /api/admin/users - Get users with pagination/filtering
```

### Blog Management
```
GET    /api/blog/posts - Get blog posts
GET    /api/blog/posts/{slug} - Get single blog post
POST   /api/blog/posts - Create blog post
PUT    /api/blog/posts/{slug} - Update blog post
DELETE /api/blog/posts/{slug} - Delete blog post
GET    /api/blog/categories - Get categories
GET    /api/blog/tags - Get tags
```

### Listings Management
```
GET /api/admin/listings - Get all listings for review
POST /api/admin/listings/{id} - Approve/reject listing
GET /api/listings/business - Get business listings
GET /api/listings/startup - Get startup listings
GET /api/listings/community - Get community listings
GET /api/listings/influencer - Get influencer listings
```

### Analytics & Reporting
```
GET /api/admin/analytics - Get analytics data
GET /api/admin/communities/combined - Get combined communities
GET /api/admin/influencers/combined - Get combined influencers
```

### Address Management
```
GET    /api/admin/addresses/generated - Get generated addresses
POST   /api/admin/addresses/generated - Create generated address
PUT    /api/admin/addresses/generated/{id} - Update generated address
DELETE /api/admin/addresses/generated/{id} - Delete generated address

GET    /api/admin/addresses/cex - Get CEX addresses
POST   /api/admin/addresses/cex - Create CEX address
PUT    /api/admin/addresses/cex/{id} - Update CEX address
DELETE /api/admin/addresses/cex/{id} - Delete CEX address

GET    /api/admin/addresses/core-team - Get core team addresses
POST   /api/admin/addresses/core-team - Create core team address
PUT    /api/admin/addresses/core-team/{id} - Update core team address
DELETE /api/admin/addresses/core-team/{id} - Delete core team address
```

### Ecosystem Management
```
GET /api/ecosystem/events - Get ecosystem events
GET /api/ecosystem/hackathons - Get ecosystem hackathons
GET /api/ecosystem/communities - Get ecosystem communities
```

### File Upload
```
POST /api/upload/image - Upload images
```

### Health Check
```
GET /health - Server health check
```

This guide provides everything needed to integrate an admin application with the Pi Clubhouse server using the existing admin routes. The API is designed to be secure, scalable, and easy to use across different frontend frameworks. 