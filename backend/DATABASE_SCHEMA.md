# Database Models Documentation

## Model Relationships

### Core Structure

```
User (Owner)
  └── Projects (1:N)
       ├── ApiToken (1:1) - Each project has one API token
       ├── ProjectSettings (1:1)
       ├── ProjectPrompts (1:N)
       ├── ProjectUsageStatistics (1:N) - Per ModelType
       ├── RequestHistory (1:N)
       ├── FileUploads (1:N)
       ├── ProjectHealthChecks (1:N) - Uptime monitoring
       ├── ProjectSslDns (1:1) - SSL/DNS information
       ├── ProjectSeoReports (1:N) - SEO scan results
       ├── ProjectPerformanceReports (1:N) - Performance metrics
       ├── ProjectCrawledPages (1:N) - Discovered pages
       ├── ProjectBacklinks (1:N) - Backlink tracking
       └── MonitoringTasks (1:N) - Scheduled monitoring jobs

ModelType (e.g., "text-generation", "image-generation")
  ├── Models (1:N) - Actual model instances
  │    ├── ModelHealthStatus (1:1)
  │    └── ModelStatistics (1:1)
  └── Used by Projects (N:M via modelTypesAllowed)
```

## Model Details

### 1. Projects
- **Purpose**: Main container for user applications/integrations
- **Key Fields**: 
  - `url` (unique) - Project URL for monitoring
- **Key Relations**: 
  - Owned by User
  - Has one ApiToken for authentication
  - Can use multiple ModelTypes
  - Tracks usage per ModelType
  - Has monitoring data (health, SEO, performance, etc.)

### 2. ApiToken
- **Changed**: Now relates to Project instead of User
- **Purpose**: Authentication token for API requests
- **Security**: Token value only shown once on creation

### 3. ModelType
- **Purpose**: Categories of AI models (text, image, audio, etc.)
- **Examples**: "gpt", "dall-e", "whisper", "claude"
- **Key Field**: `key` (unique identifier for routing)

### 4. Model
- **Purpose**: Actual AI model instances with endpoints
- **Key Features**:
  - Status tracking (active/inactive/unhealthy)
  - Rate limiting (maxRequestsPerMinute)
  - Can be assigned to multiple projects
  - API key stored securely (not returned by default)

### 5. ModelHealthStatus
- **Purpose**: Real-time health monitoring of models
- **Metrics**: latency, error rate, CPU, memory
- **Updates**: Should be updated periodically by health check service

### 6. ModelStatistics
- **Purpose**: Aggregate statistics for each model
- **Tracks**: Total requests, success/failure rates, average latency
- **Use Case**: Performance monitoring and capacity planning

### 7. ProjectUsageStatistics
- **Purpose**: Track how much each project uses each model type
- **Unique Constraint**: One record per project-modelType combination
- **Use Case**: Billing, rate limiting, usage analytics

### 8. RequestHistory
- **Purpose**: Audit trail of all API requests
- **Stores**: Input/output payloads, status, latency
- **Indexes**: Optimized for time-based queries

### 9. ProjectPrompt
- **Purpose**: Reusable prompt configurations per project
- **Settings**: System prompt, temperature, max tokens
- **Scope**: Per project and model type

### 10. ProjectSettings
- **Purpose**: Configuration for project behavior
- **Settings**: Allowed models, request size limits, active status
- **One-to-one**: Each project has one settings document

### 11. SystemLog
- **Purpose**: Application-wide logging
- **Levels**: info, warn, error, critical
- **Context**: Stores arbitrary JSON context data

### 12. FileUpload
- **Purpose**: Track files uploaded by projects
- **Storage**: URL reference (actual file stored elsewhere)
- **Metadata**: Parsed metadata stored as JSON

### 13. ProjectHealthCheck
- **Purpose**: Track uptime and response time of projects
- **Key Fields**: status (UP/DOWN), httpStatus, responseTimeMs
- **Time Series**: Indexed by projectId and checkedAt for historical data

### 14. ProjectSslDns
- **Purpose**: Monitor SSL certificates and DNS configuration
- **Key Fields**: ipAddress, sslIssuer, sslValidFrom, sslValidTo, daysRemaining
- **One-to-one**: Each project has one current SSL/DNS record

### 15. ProjectSeoReport
- **Purpose**: SEO audit and analysis results
- **Key Metrics**: broken links, warnings, errors, robots.txt, sitemap
- **Time Series**: Indexed by projectId and scanDate

### 16. ProjectPerformanceReport
- **Purpose**: Website performance metrics
- **Key Metrics**: Lighthouse scores, resource sizes, FCP, TTI
- **Storage**: Screenshots stored as URLs
- **Time Series**: Indexed by projectId and scannedAt

### 17. ProjectCrawledPages
- **Purpose**: Catalog of all discovered pages during crawl
- **Key Fields**: url, status code, isBroken flag, contentType
- **Unique Constraint**: One record per project-url combination

### 18. ProjectBacklinks
- **Purpose**: Track external links pointing to the project
- **Key Fields**: sourceUrl, domainAuthority, anchorText
- **Unique Constraint**: One record per project-sourceUrl combination

### 19. MonitoringTask
- **Purpose**: Schedule and manage monitoring jobs
- **Task Types**: UPTIME, SEO, PERFORMANCE, DNS_SSL, CRAWL, BACKLINKS
- **Scheduling**: intervalMinutes, lastRunAt, nextRunAt
- **Unique Constraint**: One task per project-type combination

## Key Design Decisions

1. **Project-Centric Authentication**: Projects (not users) authenticate API requests
2. **Model Type Abstraction**: Separates model categories from actual instances
3. **Multiple Model Support**: Projects can use different model types
4. **Health Monitoring**: Separate collection for real-time health data
5. **Usage Tracking**: Dual-level tracking (model and project statistics)
6. **Audit Trail**: Complete history of requests for debugging/billing
7. **Project Monitoring**: Comprehensive monitoring with uptime, SEO, performance, SSL/DNS tracking
8. **Time Series Data**: Health checks, SEO, and performance reports are time-series for trend analysis
9. **Scheduled Tasks**: MonitoringTask manages automated recurring checks

## Indexes

Key indexes for performance:
- `ApiToken.token` - Fast token lookup
- `Model.status` - Filter active models
- `RequestHistory.createdAt` - Time-range queries
- `ProjectUsageStatistics.{projectId, modelTypeId}` - Unique constraint
- `SystemLog.{level, createdAt}` - Filter by severity and time
- `Project.url` - Unique constraint for project URLs
- `ProjectHealthCheck.{projectId, checkedAt}` - Time series queries
- `ProjectSeoReport.{projectId, scanDate}` - Time series queries
- `ProjectPerformanceReport.{projectId, scannedAt}` - Time series queries
- `ProjectCrawledPages.{projectId, url}` - Unique constraint
- `ProjectCrawledPages.{projectId, isBroken}` - Filter broken links
- `ProjectBacklinks.{projectId, sourceUrl}` - Unique constraint
- `MonitoringTask.{projectId, type}` - Unique constraint
- `MonitoringTask.{isActive, nextRunAt}` - Task scheduler queries

## Next Steps

To implement this schema:
1. ✅ Create all model files
2. Update controllers to work with Projects
3. Create migration script for existing data
4. Update API routes for new structure
5. Implement model selection logic
6. Add health check service
7. Implement usage tracking middleware
