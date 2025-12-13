# Model Registry & Model Types System

## Overview

A comprehensive, maintainable, and secure system for managing AI model instances and their categorization. This implementation provides:

- **Secure API key encryption** using AES-256-CBC
- **Load balancing** with multiple strategies (weighted, round-robin, random)
- **Health monitoring** with automatic status updates
- **Rate limiting** and concurrency controls
- **Flexible model assignment** (public/private, project-based)
- **Priority-based routing** for model selection
- **Statistics tracking** for usage and performance

---

## Architecture

```
┌─────────────────┐
│  Model Types    │  (Categories: text, image, audio, etc.)
│  (Templates)    │
└────────┬────────┘
         │ 1:N
         │
┌────────▼────────┐
│  Model Instances│  (Actual worker endpoints)
│  (Workers)      │
└────────┬────────┘
         │
      ┌──┴──┐
      │     │
┌─────▼─┐ ┌─▼────────┐
│Health │ │Statistics│
│Status │ │          │
└───────┘ └──────────┘
```

---

## 1. Model Types

### Purpose
Categorize models into logical groups for organization and project assignment.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Unique identifier (lowercase, alphanumeric) |
| `name` | string | Display name |
| `description` | string | Detailed description |
| `category` | enum | text, image, audio, video, embedding, multimodal, tool |
| `icon` | string | Icon/emoji for UI |
| `capabilities` | string[] | List of supported features |
| `isActive` | boolean | Enable/disable type |
| `requiresAuth` | boolean | Whether authentication is required |
| `defaultMaxTokens` | number | Default token limit |
| `defaultTemperature` | number | Default temperature (0-2) |
| `order` | number | Display ordering |

### Example

```json
{
  "key": "chat",
  "name": "Chatbot / Conversational AI",
  "description": "Models for natural conversation and question answering",
  "category": "text",
  "icon": "💬",
  "capabilities": ["chat", "completion", "streaming"],
  "isActive": true,
  "requiresAuth": true,
  "defaultMaxTokens": 4096,
  "defaultTemperature": 0.7,
  "order": 1
}
```

---

## 2. Model Instances

### Purpose
Actual AI model endpoints that execute tasks. Each instance represents a specific deployment.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Model name |
| `typeId` | ObjectId | FK → ModelType |
| `version` | string | Model version |
| `provider` | enum | openai, anthropic, cohere, google, local, custom |
| `endpoint` | string | API endpoint URL |
| `apiKey` | string | **Encrypted** API key |
| `encryptionIV` | string | Initialization vector for decryption |
| `status` | enum | active, inactive, maintenance, unhealthy |
| `priority` | number | 1-10 (higher = preferred) |
| `weight` | number | Load balancing weight |
| `maxRequestsPerMinute` | number | Rate limit |
| `maxConcurrentRequests` | number | Concurrency limit |
| `timeoutSeconds` | number | Request timeout |
| `retryAttempts` | number | Number of retry attempts |
| `retryDelayMs` | number | Delay between retries |
| `costPerRequest` | number | Cost per API call |
| `expirationDate` | Date | Optional expiration |
| `tags` | string[] | Custom tags for filtering |
| `metadata` | object | Custom metadata |
| `projectsAssigned` | ObjectId[] | FK → Projects |
| `isPublic` | boolean | Available to all projects |
| `requiresApproval` | boolean | Requires admin approval |
| `lastHealthCheck` | Date | Last health check timestamp |

### Security Features

#### API Key Encryption
```typescript
// Encryption (automatic on save)
model.encryptApiKey('sk-actual-api-key-here');

// Decryption (when needed)
const decryptedKey = model.decryptApiKey();
```

- Uses **AES-256-CBC** encryption
- Unique IV per model
- Keys stored encrypted in database
- Never returned in API responses (select: false)
- Decryption only for internal use

#### Environment Variable
```bash
MODEL_ENCRYPTION_KEY=your-32-character-secret-key-here
```

---

## 3. Health Monitoring

### ModelHealthStatus

Tracks real-time health of each model instance.

| Field | Type | Description |
|-------|------|-------------|
| `modelId` | ObjectId | FK → Model (unique) |
| `lastCheckedAt` | Date | Last health check time |
| `latencyMs` | number | Response time |
| `errorRate` | number | 0-100 percentage |
| `isHealthy` | boolean | Overall health status |
| `lastError` | string | Last error message |
| `cpuUsage` | number | CPU usage (0-100) |
| `memoryUsage` | number | Memory usage (0-100) |

### Automatic Status Updates
- Health checks update model status automatically
- Status changes from `active` → `unhealthy` on failures
- Restored to `active` on successful test

---

## 4. Statistics Tracking

### ModelStatistics

Aggregate usage statistics per model.

| Field | Type | Description |
|-------|------|-------------|
| `modelId` | ObjectId | FK → Model (unique) |
| `totalRequests` | number | Total API calls |
| `successfulRequests` | number | Successful calls |
| `failedRequests` | number | Failed calls |
| `avgLatency` | number | Average response time |
| `lastUsedAt` | Date | Last usage timestamp |
| `monthlyUsage` | number | Current month usage |
| `monthlyLimit` | number | Monthly limit |

---

## API Endpoints

### Model Types

```
GET    /api/model-types                    # List all types
GET    /api/model-types/:id                # Get one type
GET    /api/model-types/:id/stats          # Get type with model counts
GET    /api/model-types/category/:category # Filter by category
POST   /api/model-types                    # Create (admin)
PUT    /api/model-types/:id                # Update (admin)
DELETE /api/model-types/:id                # Delete (admin)
POST   /api/model-types/reorder            # Bulk update order (admin)
```

### Models

```
GET    /api/models                         # List all models (with filters)
GET    /api/models/:id                     # Get one model
GET    /api/models/:id/health              # Get health & statistics
GET    /api/models/type/:typeId/available  # Get available models for type
POST   /api/models                         # Create (admin)
PUT    /api/models/:id                     # Update (admin)
DELETE /api/models/:id                     # Delete (admin)
POST   /api/models/:id/test                # Test connection (admin)
```

### Query Parameters

#### List Models
```
?typeId=...         # Filter by model type
?provider=...       # Filter by provider
?status=...         # Filter by status
?isPublic=true      # Only public models
?projectId=...      # Models assigned to project
?tags=tag1,tag2     # Filter by tags
```

---

## Load Balancing

### Strategies

#### 1. Weighted (Default)
Models are selected based on `priority * weight`.

```typescript
const model = await modelService.selectModel(typeId, projectId, 'weighted');
```

#### 2. Random
Random selection from available models.

```typescript
const model = await modelService.selectModel(typeId, projectId, 'random');
```

#### 3. Round Robin (Future)
Sequential rotation through models.

#### 4. Least Connections (Future)
Select model with fewest active connections.

### Model Selection Logic

1. **Filter** by typeId
2. **Check** status === 'active'
3. **Validate** expiration date
4. **Filter** by project assignment or public flag
5. **Sort** by priority and weight
6. **Apply** load balancing strategy

---

## Frontend Integration

### Components

#### AiModels Page (`/ai-models`)
- Lists all model instances
- Filters by type and status
- Shows health status with badges
- Test connection button
- Model type summary cards

### API Service Methods

```typescript
// Model Types
apiService.getModelTypes()
apiService.getModelType(id)
apiService.getModelTypesByCategory(category)
apiService.getModelTypeWithStats(id)
apiService.createModelType(data)
apiService.updateModelType(id, data)
apiService.deleteModelType(id)
apiService.updateModelTypeOrder(orders)

// Models
apiService.getModels(filters)
apiService.getModel(id)
apiService.createModel(data)
apiService.updateModel(id, data)
apiService.deleteModel(id)
apiService.getModelHealth(id)
apiService.testModelConnection(id)
apiService.getAvailableModels(typeId, projectId)
```

---

## Usage Examples

### 1. Create a Model Type

```typescript
POST /api/model-types

{
  "key": "file_analyzer",
  "name": "File Analysis",
  "description": "Models for analyzing documents and extracting information",
  "category": "tool",
  "icon": "📄",
  "capabilities": ["ocr", "extraction", "classification"],
  "isActive": true,
  "requiresAuth": true,
  "defaultMaxTokens": 8192,
  "defaultTemperature": 0.3,
  "order": 5
}
```

### 2. Register a Model Instance

```typescript
POST /api/models

{
  "name": "GPT-4 Turbo",
  "typeId": "60d5f483e3a5c30015f1234a",
  "version": "gpt-4-turbo-preview",
  "provider": "openai",
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "apiKey": "sk-actual-key-will-be-encrypted",
  "priority": 10,
  "weight": 80,
  "maxRequestsPerMinute": 500,
  "maxConcurrentRequests": 50,
  "timeoutSeconds": 60,
  "retryAttempts": 3,
  "retryDelayMs": 1000,
  "costPerRequest": 0.01,
  "tags": ["fast", "production"],
  "isPublic": true,
  "requiresApproval": false
}
```

### 3. Get Models for a Project

```typescript
// Get all models available for project's model types
const modelTypes = project.modelTypesAllowed;

for (const type of modelTypes) {
  const models = await modelService.getAvailableModelsForType(
    type._id,
    project._id
  );
  
  // Select best model using load balancing
  const selectedModel = await modelService.selectModel(
    type._id,
    project._id,
    'weighted'
  );
}
```

### 4. Test Model Health

```typescript
POST /api/models/:id/test

// Response
{
  "success": true,
  "data": {
    "success": true,
    "latencyMs": 245
  },
  "message": "Connection test passed"
}
```

---

## Security Best Practices

### 1. API Key Protection
- ✅ Encrypted at rest (AES-256-CBC)
- ✅ Never returned in API responses
- ✅ Unique IV per model
- ✅ Decryption only when making actual API calls

### 2. Access Control
- ✅ Admin-only creation/update/delete
- ✅ Project-based model assignment
- ✅ Public/private model flags
- ✅ Approval workflow support

### 3. Environment Security
```bash
# .env
MODEL_ENCRYPTION_KEY=generate-a-strong-32-char-key-here
```

### 4. Rate Limiting
- Per-model rate limits
- Concurrency controls
- Timeout protection
- Retry logic with backoff

---

## Database Indexes

### ModelType
```javascript
{ key: 1 } // unique
{ category: 1, isActive: 1 }
{ isActive: 1, order: 1 }
```

### Model
```javascript
{ typeId: 1, status: 1 }
{ typeId: 1, status: 1, priority: -1 }
{ projectsAssigned: 1 }
{ provider: 1, status: 1 }
{ isPublic: 1, status: 1 }
{ expirationDate: 1 }
{ lastHealthCheck: 1 }
{ tags: 1 }
```

### ModelHealthStatus
```javascript
{ modelId: 1 } // unique
{ isHealthy: 1 }
```

### ModelStatistics
```javascript
{ modelId: 1 } // unique
```

---

## Future Enhancements

1. **Automated Health Checks**
   - Background job to test all models periodically
   - Auto-disable unhealthy models
   - Alert notifications

2. **Advanced Load Balancing**
   - Implement round-robin
   - Implement least-connections
   - Sticky sessions support

3. **Cost Tracking**
   - Per-project cost calculation
   - Budget alerts
   - Cost optimization recommendations

4. **Model Versioning**
   - A/B testing support
   - Gradual rollout
   - Rollback capability

5. **Analytics Dashboard**
   - Real-time usage graphs
   - Performance comparisons
   - Cost analysis

6. **Failover & Redundancy**
   - Automatic failover to backup models
   - Multi-region support
   - Circuit breaker pattern

---

## Troubleshooting

### Model Shows as Unhealthy

1. Check endpoint URL
2. Verify API key is correct
3. Test connection manually
4. Check firewall/network settings
5. Review lastError in health status

### API Key Decryption Fails

1. Verify MODEL_ENCRYPTION_KEY environment variable
2. Check key length (must be 32 characters)
3. Ensure IV is stored correctly

### No Models Returned for Project

1. Check project's modelTypesAllowed
2. Verify model status is 'active'
3. Check expiration dates
4. Verify project assignment or isPublic flag

---

## Summary

This implementation provides a **secure**, **scalable**, and **maintainable** model registry system with:

- ✅ **Encryption** for sensitive data
- ✅ **Load balancing** for optimal performance
- ✅ **Health monitoring** for reliability
- ✅ **Flexible assignment** for access control
- ✅ **Statistics tracking** for insights
- ✅ **Admin controls** for management
- ✅ **Frontend integration** for ease of use

The system is production-ready and follows security best practices while maintaining flexibility for various AI model providers and configurations.
