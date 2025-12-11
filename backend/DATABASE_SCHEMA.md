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
       └── FileUploads (1:N)

ModelType (e.g., "text-generation", "image-generation")
  ├── Models (1:N) - Actual model instances
  │    ├── ModelHealthStatus (1:1)
  │    └── ModelStatistics (1:1)
  └── Used by Projects (N:M via modelTypesAllowed)
```

## Model Details

### 1. Projects
- **Purpose**: Main container for user applications/integrations
- **Key Relations**: 
  - Owned by User
  - Has one ApiToken for authentication
  - Can use multiple ModelTypes
  - Tracks usage per ModelType

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

## Key Design Decisions

1. **Project-Centric Authentication**: Projects (not users) authenticate API requests
2. **Model Type Abstraction**: Separates model categories from actual instances
3. **Multiple Model Support**: Projects can use different model types
4. **Health Monitoring**: Separate collection for real-time health data
5. **Usage Tracking**: Dual-level tracking (model and project statistics)
6. **Audit Trail**: Complete history of requests for debugging/billing

## Indexes

Key indexes for performance:
- `ApiToken.token` - Fast token lookup
- `Model.status` - Filter active models
- `RequestHistory.createdAt` - Time-range queries
- `ProjectUsageStatistics.{projectId, modelTypeId}` - Unique constraint
- `SystemLog.{level, createdAt}` - Filter by severity and time

## Next Steps

To implement this schema:
1. ✅ Create all model files
2. Update controllers to work with Projects
3. Create migration script for existing data
4. Update API routes for new structure
5. Implement model selection logic
6. Add health check service
7. Implement usage tracking middleware
