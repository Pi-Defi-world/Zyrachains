# API Structure Documentation

## Overview
This project has two distinct API structures that should not conflict:

## 1. External API Clients (`/api/` folder)
**Purpose**: External API clients for fetching data from third-party services
**Location**: `/api/` (root level)
**Files**:
- `horizon.ts` - Pi Network Horizon API client
- `okx.ts` - OKX exchange API client  
- `piscan.ts` - PiScan API client
- `socialchain.ts` - SocialChain API client

**Usage**: Import directly for external API calls
```typescript
import { horizon } from '@/api/horizon';
import { okx } from '@/api/okx';
```

## 2. Internal API Client (`/lib/api-client.ts`)
**Purpose**: Robust client for internal Next.js API routes with retry logic and error handling
**Location**: `/lib/api-client.ts`
**Functions**:
- `internalApiGet()` - GET requests to internal API routes
- `internalApiPost()` - POST requests to internal API routes  
- `createInternalEventSource()` - EventSource for real-time data

**Usage**: For internal API routes (Next.js API routes)
```typescript
import { internalApiGet, internalApiPost } from '@/lib/api-client';

// Example: Call internal API route
const response = await internalApiGet('/api/blog/posts', { 
  retries: 2, 
  timeout: 8000 
});
```

## 3. Next.js API Routes (`/app/api/` folder)
**Purpose**: Backend API endpoints for the application
**Location**: `/app/api/` (Next.js App Router structure)
**Examples**:
- `/app/api/blog/posts/` - Blog post endpoints
- `/app/api/addresses/` - Address management endpoints
- `/app/api/ecosystem/` - Ecosystem data endpoints
- `/app/api/realtime/` - Real-time data streaming

## Key Differences

| Aspect | External APIs (`/api/`) | Internal API Client (`/lib/api-client.ts`) |
|--------|------------------------|--------------------------------------------|
| **Purpose** | Third-party service calls | Internal Next.js API routes |
| **Error Handling** | Basic | Advanced retry logic & timeouts |
| **Retry Logic** | None | Exponential backoff |
| **Timeout** | Browser default | Configurable (10s default) |
| **Base URL** | External URLs | Local Next.js routes |

## Best Practices

1. **Use External APIs** (`/api/`) for:
   - Pi Network data fetching
   - Exchange price data
   - Third-party service integration

2. **Use Internal API Client** (`/lib/api-client.ts`) for:
   - Database operations
   - User authentication
   - Internal data processing
   - Real-time streaming

3. **Never mix them** - Keep external and internal API calls separate

## Error Handling

The internal API client provides:
- ✅ Automatic retries with exponential backoff
- ✅ Configurable timeouts
- ✅ Graceful error recovery
- ✅ Connection resilience for EventSource
- ✅ Detailed error logging

This structure ensures clean separation of concerns and prevents conflicts between external and internal API handling. 