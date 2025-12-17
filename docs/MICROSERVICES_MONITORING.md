# Microservices Monitoring System

This document describes the microservices monitoring system implemented in the personal dashboard application.

## Overview

The system allows tracking and monitoring multiple services within a project. Each project can have multiple services (frontend, backend, API, AI workers, gateways, etc.) with comprehensive health monitoring, performance tracking, and availability statistics.

## Database Schema

### Services
Each service represents a component of a microservice architecture.

```typescript
{
  id: ObjectId,
  projectId: ObjectId,              // Reference to Project
  name: string,                     // Service name (e.g., "Frontend", "Auth API")
  type: "FRONTEND | API | AI | WORKER | GATEWAY",
  baseUrl: string,                  // Base URL of the service
  probePath: string,                // Health check endpoint (default: "/health")
  expectedHttpStatus: number,       // Expected status code (default: 200)
  timeoutMs: number,                // Request timeout (default: 5000ms)
  isCritical: boolean,              // Whether service is critical to project
  isPublic: boolean,                // Whether service is publicly accessible
  isActive: boolean,                // Whether service is actively monitored
  createdAt: Date,
  updatedAt: Date
}
```

### Service Health Checks
Real-time health status of each service.

```typescript
{
  id: ObjectId,
  serviceId: ObjectId,              // Reference to Service
  status: "UP | DEGRADED | DOWN",
  httpStatus: number | null,        // HTTP status code received
  responseTimeMs: number | null,    // Response time in milliseconds
  dnsResolved: boolean,             // Whether DNS resolved successfully
  sslValid: boolean,                // Whether SSL certificate is valid
  errorMessage: string | null,      // Error details if check failed
  checkedAt: Date                   // When check was performed
}
```

### Service Availability Stats
Uptime statistics over different time periods.

```typescript
{
  id: ObjectId,
  serviceId: ObjectId,
  period: "24h | 7d | 30d",
  uptimePercentage: number,         // Percentage of uptime (0-100)
  downtimeMinutes: number,          // Total downtime in minutes
  lastCalculatedAt: Date
}
```

### Service Performance Metrics
Performance statistics based on recent health checks.

```typescript
{
  id: ObjectId,
  serviceId: ObjectId,
  avgLatencyMs: number,             // Average response time
  p95LatencyMs: number,             // 95th percentile latency
  errorRate: number,                // Error rate percentage (0-100)
  sampleSize: number,               // Number of samples used
  calculatedAt: Date
}
```

### Project Health Snapshots
Overall health status of entire project based on all services.

```typescript
{
  id: ObjectId,
  projectId: ObjectId,
  status: "UP | DEGRADED | DOWN",
  reason: string | null,            // Explanation of status
  checkedAt: Date
}
```

### Monitoring Tasks
Scheduled tasks for monitoring services.

```typescript
{
  id: ObjectId,
  serviceId: ObjectId,
  type: "HEALTH | PERFORMANCE | SEO | SSL | DNS",
  intervalSeconds: number,          // How often to run (in seconds)
  lastRunAt: Date | null,
  nextRunAt: Date,                  // When to run next
  isActive: boolean
}
```

### SEO Reports
SEO analysis for project URLs.

```typescript
{
  id: ObjectId,
  projectId: ObjectId,
  url: string,
  title: string | null,
  metaDescription: string | null,
  hasRobotsTxt: boolean,
  hasSitemap: boolean,
  canonicalUrl: string | null,
  indexable: boolean,
  checkedAt: Date
}
```

### SSL Reports
SSL certificate validation for HTTPS services.

```typescript
{
  id: ObjectId,
  serviceId: ObjectId,
  issuer: string | null,            // Certificate issuer
  validFrom: Date | null,
  validTo: Date | null,
  isValid: boolean,
  checkedAt: Date
}
```

### DNS Reports
DNS resolution checks for services.

```typescript
{
  id: ObjectId,
  serviceId: ObjectId,
  domain: string,
  resolved: boolean,
  resolutionTimeMs: number | null,
  recordType: "A | AAAA | CNAME" | null,
  checkedAt: Date
}
```

## Relationships

```
projects.id ───▶ services.projectId
services.id ───▶ service_health_checks.serviceId
services.id ───▶ service_performance_metrics.serviceId
services.id ───▶ service_availability_stats.serviceId
services.id ───▶ monitoring_tasks.serviceId
services.id ───▶ ssl_reports.serviceId
services.id ───▶ dns_reports.serviceId
projects.id ───▶ project_health_snapshots.projectId
projects.id ───▶ seo_reports.projectId
```

## API Endpoints

### Service Management

#### Create Service
```http
POST /api/services
Authorization: Bearer <token>

{
  "projectId": "string",
  "name": "string",
  "type": "FRONTEND | API | AI | WORKER | GATEWAY",
  "baseUrl": "string",
  "probePath": "string (optional, default: /health)",
  "expectedHttpStatus": "number (optional, default: 200)",
  "timeoutMs": "number (optional, default: 5000)",
  "isCritical": "boolean (optional, default: true)",
  "isPublic": "boolean (optional, default: false)",
  "isActive": "boolean (optional, default: true)"
}
```

#### Get Project Services
```http
GET /api/services/project/:projectId
Authorization: Bearer <token>
```

#### Get Service Details
```http
GET /api/services/:serviceId
Authorization: Bearer <token>
```

#### Update Service
```http
PUT /api/services/:serviceId
Authorization: Bearer <token>

{
  "name": "string (optional)",
  "baseUrl": "string (optional)",
  "probePath": "string (optional)",
  "isActive": "boolean (optional)",
  ...
}
```

#### Delete Service
```http
DELETE /api/services/:serviceId
Authorization: Bearer <token>
```

### Monitoring Data

#### Get Service Health History
```http
GET /api/services/:serviceId/health-history?limit=100
Authorization: Bearer <token>
```

#### Get Service Performance History
```http
GET /api/services/:serviceId/performance-history?limit=100
Authorization: Bearer <token>
```

## Service Monitoring Functions

The `serviceMonitoring.ts` service provides the following functions:

### Health Monitoring

- **`performHealthCheck(serviceId: string)`**
  - Performs HTTP health check
  - Validates DNS resolution
  - Checks SSL certificate (for HTTPS)
  - Records response time
  - Determines service status (UP/DEGRADED/DOWN)

- **`calculateAvailabilityStats(serviceId: string, period: '24h'|'7d'|'30d')`**
  - Calculates uptime percentage
  - Tracks downtime duration
  - Updates statistics for specified period

- **`calculatePerformanceMetrics(serviceId: string)`**
  - Calculates average latency
  - Computes 95th percentile latency
  - Tracks error rate
  - Uses last hour of data

### Specialized Checks

- **`performSeoCheck(projectId: string, url: string)`**
  - Extracts page title and meta description
  - Checks robots.txt existence
  - Verifies sitemap.xml
  - Checks canonical URL
  - Determines indexability

- **`performSslCheck(serviceId: string)`**
  - Retrieves SSL certificate details
  - Validates certificate expiry
  - Records issuer information

- **`performDnsCheck(serviceId: string)`**
  - Resolves domain to IP
  - Measures resolution time
  - Identifies record type (A/AAAA/CNAME)

### Project Health

- **`updateProjectHealthSnapshot(projectId: string)`**
  - Aggregates status of all services
  - Prioritizes critical services
  - Determines overall project health (UP/DEGRADED/DOWN)

### Task Management

- **`getServicesDueForMonitoring(taskType: string)`**
  - Returns services that need monitoring
  - Based on schedule (nextRunAt)

## Usage Example

### 1. Create a Service

```javascript
// POST /api/services
{
  "projectId": "507f1f77bcf86cd799439011",
  "name": "Auth API",
  "type": "API",
  "baseUrl": "https://api.example.com",
  "probePath": "/health",
  "expectedHttpStatus": 200,
  "timeoutMs": 5000,
  "isCritical": true,
  "isPublic": true
}
```

This automatically creates monitoring tasks:
- Health check every 5 minutes
- Performance metrics every 10 minutes
- SSL check daily
- DNS check hourly

### 2. Monitor Service Health

```javascript
import { performHealthCheck } from './services/serviceMonitoring';

// Perform health check
const healthCheck = await performHealthCheck(serviceId);

console.log(healthCheck.status); // UP, DEGRADED, or DOWN
console.log(healthCheck.responseTimeMs); // Response time
console.log(healthCheck.errorMessage); // Error details if any
```

### 3. Calculate Availability

```javascript
import { calculateAvailabilityStats } from './services/serviceMonitoring';

// Calculate 24-hour availability
const stats = await calculateAvailabilityStats(serviceId, '24h');

console.log(stats.uptimePercentage); // e.g., 99.95%
console.log(stats.downtimeMinutes); // e.g., 0.72 minutes
```

### 4. Update Project Health

```javascript
import { updateProjectHealthSnapshot } from './services/serviceMonitoring';

// Update overall project health based on all services
const snapshot = await updateProjectHealthSnapshot(projectId);

console.log(snapshot.status); // UP, DEGRADED, or DOWN
console.log(snapshot.reason); // Explanation
```

## Monitoring Strategy

### Service Status Determination

1. **UP**: Service responds with expected HTTP status, SSL valid, DNS resolves
2. **DEGRADED**: Service responds but with unexpected status, or SSL issues
3. **DOWN**: Service doesn't respond, DNS fails, or request times out

### Project Status Determination

1. **DOWN**: Any critical service is DOWN
2. **DEGRADED**: Any critical service is DEGRADED, or any non-critical service is DOWN
3. **UP**: All services operational

### Default Monitoring Intervals

- **Health Checks**: Every 5 minutes (300 seconds)
- **Performance Metrics**: Every 10 minutes (600 seconds)
- **SSL Checks**: Daily (86400 seconds)
- **DNS Checks**: Hourly (3600 seconds)
- **SEO Checks**: On-demand

## Integration with Existing System

The microservices monitoring system extends the existing project management system:

1. Each `Project` can have multiple `Service` instances
2. Services are monitored independently
3. Project health is derived from service health
4. All monitoring respects user authentication and authorization
5. Historical data is preserved for analytics

## Best Practices

1. **Mark critical services**: Set `isCritical: true` for services essential to your application
2. **Appropriate timeouts**: Set realistic `timeoutMs` values based on service characteristics
3. **Public vs Private**: Use `isPublic` flag to distinguish external-facing services
4. **Custom probe paths**: Configure appropriate health check endpoints for each service
5. **Monitor what matters**: Deactivate monitoring for services in development/testing

## Future Enhancements

- Alert notifications (email, Slack, webhooks)
- Custom monitoring intervals per service
- Incident tracking and management
- Service dependency mapping
- Automated remediation actions
- SLA tracking and reporting
- Advanced analytics and trends
