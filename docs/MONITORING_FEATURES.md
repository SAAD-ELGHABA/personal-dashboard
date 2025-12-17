# Monitoring Features Implementation

## Overview
This document describes the new monitoring and analytics features added to the personal dashboard project.

## Database Schema Changes

### Updated Tables

#### Projects Table
**Added Field:**
- `url` (string, unique, required) - The project URL for monitoring purposes

### New Tables Created

#### 1. ProjectHealthCheck
Tracks uptime and response time of projects.

**Fields:**
- `projectId` (ObjectId, FK → projects._id)
- `status` (enum: 'UP' | 'DOWN')
- `httpStatus` (number)
- `responseTimeMs` (number)
- `checkedAt` (datetime)

**Indexes:**
- `projectId` (single)
- `{projectId, checkedAt}` (compound, for time-series queries)

---

#### 2. ProjectSslDns
Monitors SSL certificates and DNS configuration (one record per project).

**Fields:**
- `projectId` (ObjectId, FK → projects._id, unique)
- `ipAddress` (string)
- `dnsProvider` (string, optional)
- `sslIssuer` (string, optional)
- `sslValidFrom` (datetime, optional)
- `sslValidTo` (datetime, optional)
- `daysRemaining` (number, optional)
- `lastCheckedAt` (datetime)

**Indexes:**
- `projectId` (unique)

---

#### 3. ProjectSeoReport
SEO audit and analysis results.

**Fields:**
- `projectId` (ObjectId, FK → projects._id)
- `pageTitle` (string, optional)
- `metaDescription` (string, optional)
- `hasRobotsTxt` (boolean)
- `hasSitemap` (boolean)
- `brokenLinks` (number)
- `warnings` (number)
- `errorCount` (number) - renamed from `errors` to avoid conflict
- `scanDate` (datetime)

**Indexes:**
- `projectId` (single)
- `{projectId, scanDate}` (compound, for time-series queries)

---

#### 4. ProjectPerformanceReport
Website performance metrics and Lighthouse scores.

**Fields:**
- `projectId` (ObjectId, FK → projects._id)
- `lighthouseScore` (number, 0-100, optional)
- `performanceScore` (number, 0-100, optional)
- `htmlSizeBytes` (number)
- `cssSizeBytes` (number)
- `jsSizeBytes` (number)
- `totalSizeBytes` (number)
- `firstContentfulPaintMs` (number, optional)
- `timeToInteractiveMs` (number, optional)
- `screenshotUrl` (string, optional)
- `scannedAt` (datetime)

**Indexes:**
- `projectId` (single)
- `{projectId, scannedAt}` (compound, for time-series queries)

---

#### 5. ProjectCrawledPages
Catalog of all discovered pages during website crawl.

**Fields:**
- `projectId` (ObjectId, FK → projects._id)
- `url` (string)
- `status` (number - HTTP status code)
- `isBroken` (boolean)
- `contentType` (string, optional)
- `foundAt` (datetime)

**Indexes:**
- `{projectId, url}` (compound, unique)
- `{projectId, isBroken}` (compound, for filtering broken links)

---

#### 6. ProjectBacklinks
Tracks external links pointing to the project.

**Fields:**
- `projectId` (ObjectId, FK → projects._id)
- `sourceUrl` (string)
- `domainAuthority` (number, 0-100, optional)
- `anchorText` (string, optional)
- `discoveredAt` (datetime)

**Indexes:**
- `{projectId, sourceUrl}` (compound, unique)
- `{projectId, discoveredAt}` (compound, for chronological queries)

---

#### 7. MonitoringTask
Schedules and manages automated monitoring jobs.

**Fields:**
- `projectId` (ObjectId, FK → projects._id)
- `type` (enum: 'UPTIME' | 'SEO' | 'PERFORMANCE' | 'DNS_SSL' | 'CRAWL' | 'BACKLINKS')
- `intervalMinutes` (number, min: 1)
- `lastRunAt` (datetime, optional)
- `nextRunAt` (datetime)
- `isActive` (boolean)

**Indexes:**
- `{projectId, type}` (compound, unique - one task per project-type)
- `{isActive, nextRunAt}` (compound, for task scheduler queries)

---

## Backend Changes

### New Models Created
All models are located in `backend/src/models/`:
- `ProjectHealthCheck.ts`
- `ProjectSslDns.ts`
- `ProjectSeoReport.ts`
- `ProjectPerformanceReport.ts`
- `ProjectCrawledPages.ts`
- `ProjectBacklinks.ts`
- `MonitoringTask.ts`

### Updated Models
- **Project.ts**: Added `url` field (unique, required)

### Updated Controllers
- **project.ts**:
  - `createProject()`: Now accepts and validates `url` parameter
  - `updateProject()`: Now accepts and validates `url` parameter

### Updated Services
- **project.ts**:
  - `CreateProjectDTO`: Added `url` field
  - `UpdateProjectDTO`: Added `url` field
  - `createProject()`: Validates URL uniqueness
  - `updateProject()`: Validates URL uniqueness when updating

### Updated Documentation
- **DATABASE_SCHEMA.md**: Added documentation for all new tables and updated project structure

---

## Frontend Changes

### Updated Types
- **types/index.ts**:
  - `Project` interface: Added `url` field
  - `CreateProjectDTO`: Added `url` field
  - `UpdateProjectDTO`: Added `url` field

### Updated Components

#### ProjectFormModal.tsx
- Added URL input field with validation
- URL validation includes:
  - Required field check
  - Valid URL format validation
  - User-friendly error messages
- URL is displayed with placeholder "https://myapp.com"
- Helper text explains the purpose of the URL

#### ProjectCard.tsx
- Displays project URL as clickable link
- URL is shown below the project name
- Opens in new tab with security attributes (`target="_blank" rel="noopener noreferrer"`)

---

## API Changes

### Create Project Endpoint
**POST** `/api/projects`

**New Required Field:**
```json
{
  "name": "string",
  "url": "string",  // NEW - must be unique and valid URL
  "description": "string (optional)",
  "modelTypesAllowed": ["string"],
  "maxRequestSize": "number (optional)"
}
```

### Update Project Endpoint
**PUT** `/api/projects/:id`

**New Optional Field:**
```json
{
  "name": "string (optional)",
  "url": "string (optional)",  // NEW - must be unique and valid URL
  "description": "string (optional)",
  "modelTypesAllowed": ["string (optional)"]
}
```

---

## Validation Rules

### URL Field
- **Required**: Yes (for new projects)
- **Unique**: Yes (across all projects)
- **Format**: Must be a valid URL (checked with `new URL()`)
- **Transform**: Converted to lowercase and trimmed
- **Example**: `https://example.com`, `https://myapp.vercel.app`

---

## Next Steps for Implementation

To fully utilize these monitoring features, you'll need to:

1. **Create Monitoring Services**: Implement background services that:
   - Check project uptime (populate `ProjectHealthCheck`)
   - Scan SSL/DNS information (populate `ProjectSslDns`)
   - Run SEO audits (populate `ProjectSeoReport`)
   - Measure performance (populate `ProjectPerformanceReport`)
   - Crawl pages (populate `ProjectCrawledPages`)
   - Track backlinks (populate `ProjectBacklinks`)

2. **Create Task Scheduler**: Implement a cron job or background worker that:
   - Queries `MonitoringTask` for active tasks where `nextRunAt` ≤ now
   - Executes the appropriate monitoring service
   - Updates `lastRunAt` and calculates next `nextRunAt`

3. **Create Monitoring API Endpoints**: Add endpoints to:
   - Get health check history for a project
   - Get latest SSL/DNS information
   - Get SEO reports
   - Get performance reports
   - Get crawled pages (with filtering for broken links)
   - Get backlinks
   - Configure monitoring tasks (enable/disable, change intervals)

4. **Create Monitoring UI**: Build dashboard pages to:
   - Display uptime charts and current status
   - Show SSL certificate expiration warnings
   - Display SEO metrics and recommendations
   - Show performance trends and Lighthouse scores
   - List all crawled pages with broken link highlights
   - Display backlink profiles

5. **Add Notifications**: Implement alerts for:
   - Project downtime
   - SSL certificate expiration warnings (e.g., 30 days before expiry)
   - SEO issues detected
   - Performance degradation
   - New broken links found

---

## Technical Notes

### Time-Series Data
Several tables store time-series data (health checks, SEO reports, performance reports). Consider:
- Implementing data retention policies (e.g., keep last 90 days)
- Using aggregation for long-term trends
- Creating archive tables for historical data

### Uniqueness Constraints
- Project URLs are globally unique
- Each project can have only one active monitoring task per type
- Crawled pages and backlinks are unique per project-url combination

### Performance Considerations
- All time-series tables have compound indexes for efficient date-range queries
- Consider implementing pagination for large result sets
- Use projections to limit data transfer for list views

---

## Migration Notes

For existing projects in the database:
1. Add default or placeholder URLs (or allow null temporarily)
2. Run a migration script to prompt users to add URLs
3. Once all projects have URLs, enforce the unique constraint

Example migration:
```javascript
// Set temporary URLs for existing projects
await Project.updateMany(
  { url: { $exists: false } },
  { $set: { url: 'https://placeholder.com/project-' + Date.now() } }
);
```

---

## Summary

This implementation adds comprehensive monitoring capabilities to the personal dashboard:
- **7 new database tables** for various monitoring aspects
- **1 updated table** (Projects) with URL field
- **Full backend integration** with validation and error handling
- **Complete frontend UI** with form inputs and display
- **Scalable architecture** ready for monitoring service implementation

All changes maintain backward compatibility (except for the required URL field on new projects) and follow the existing code patterns and conventions.
