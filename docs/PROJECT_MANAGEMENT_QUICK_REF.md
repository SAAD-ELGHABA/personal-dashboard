# Project Management - Quick Reference

## API Endpoints

### Project CRUD

```http
# Get all projects
GET /api/projects?includeInactive=false
Authorization: Bearer <jwt>

# Get single project with settings
GET /api/projects/:id
Authorization: Bearer <jwt>

# Create project
POST /api/projects
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "Project Name",
  "description": "Optional description",
  "modelTypesAllowed": ["model-type-id-1", "model-type-id-2"],
  "maxRequestSize": 1048576
}

# Update project
PUT /api/projects/:id
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "New Name",
  "description": "New description",
  "modelTypesAllowed": ["model-type-id-3"]
}

# Delete project
DELETE /api/projects/:id
Authorization: Bearer <jwt>
```

### Project Settings

```http
# Update project settings
PUT /api/projects/:id/settings
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "allowedModelTypes": ["model-type-id-1"],
  "maxRequestSize": 2097152,
  "isActive": true
}
```

### Token Management

```http
# Regenerate API token
POST /api/projects/:id/regenerate-token
Authorization: Bearer <jwt>

# Get available model types
GET /api/projects/model-types
Authorization: Bearer <jwt>
```

## Using Project Middleware

### For External API Endpoints

```typescript
import { validateProjectRequest } from '../middleware/projectValidation';

// Apply to routes that external apps call
router.post('/run', validateProjectRequest, async (req, res) => {
  // req.project contains the project object
  // req.projectSettings contains the settings
  
  const { project, projectSettings } = req;
  
  // Your logic here
});
```

### Individual Middleware

```typescript
import {
  validateProjectToken,
  checkProjectActive,
  validateRequestSize,
} from '../middleware/projectValidation';

// Use individually if needed
router.post('/custom-endpoint', 
  validateProjectToken,
  checkProjectActive,
  // Your custom middleware
  yourController
);
```

## Service Layer Usage

```typescript
import { projectService } from '../services/project';

// Create project
const result = await projectService.createProject({
  name: 'My Project',
  description: 'Description',
  modelTypesAllowed: ['id1', 'id2'],
  ownerId: userId,
  maxRequestSize: 1048576,
});

// Get projects
const projects = await projectService.getProjectsByOwner(userId);

// Validate API access
const { project, settings } = await projectService.validateProjectAccess(
  apiToken,
  'gpt-4'
);

// Update settings
const settings = await projectService.updateProjectSettings(
  projectId,
  ownerId,
  { isActive: false }
);
```

## Frontend Components

### Projects Page

```tsx
import { Projects } from './pages/Projects';

// Already integrated - just navigate to /projects
```

### Using API Service

```typescript
import { apiService } from './services/api';

// Create project
const response = await apiService.createProject({
  name: 'Project Name',
  description: 'Description',
  modelTypesAllowed: ['id1', 'id2'],
  maxRequestSize: 1048576,
});

// Get projects
const { data } = await apiService.getProjects();

// Update settings
await apiService.updateProjectSettings(projectId, {
  isActive: false,
  maxRequestSize: 2097152,
});
```

## Common Patterns

### External App Integration

```javascript
// In your external application
const API_TOKEN = 'your-project-api-token';
const API_URL = 'https://your-api.com';

async function callBrainAPI(modelType, prompt) {
  const response = await fetch(`${API_URL}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': API_TOKEN,
    },
    body: JSON.stringify({
      modelType,
      prompt,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```

### Error Handling

```typescript
try {
  const result = await apiService.createProject(data);
  // Success
} catch (error: any) {
  // Extract meaningful error
  const message = error.response?.data?.message || 'Operation failed';
  console.error(message);
  // Show to user
  alert(message);
}
```

## Database Queries

### Find Active Projects

```typescript
const activeProjects = await Project.find({
  ownerId: userId,
})
  .populate('modelTypesAllowed')
  .sort({ createdAt: -1 });

// Filter by active settings
const projectIds = activeProjects.map((p) => p._id);
const activeSettings = await ProjectSettings.find({
  projectId: { $in: projectIds },
  isActive: true,
});
```

### Token Lookup

```typescript
import crypto from 'crypto';

const hashedToken = crypto.createHash('sha256')
  .update(rawToken)
  .digest('hex');

const token = await ApiToken.findOne({
  token: hashedToken,
  isActive: true,
  expiresAt: { $gt: new Date() },
});
```

## Environment Variables

```env
# JWT Secret for authentication
JWT_SECRET=your-secret-key

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/personal-dashboard

# API Configuration
PORT=5000
NODE_ENV=production
```

## Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions or inactive project)
- `404` - Not Found
- `409` - Conflict (duplicate name)
- `413` - Payload Too Large
- `500` - Internal Server Error

## Request Headers

### Authenticated Requests (Dashboard)
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### External API Requests
```
x-api-token: <project-api-token>
Content-Type: application/json
```

## Validation Rules

### Project Creation
- Name: Required, non-empty
- Model Types: At least one required
- Max Request Size: Minimum 1024 bytes (1KB)

### Settings Update
- Model Types: At least one required
- Max Request Size: Minimum 1024 bytes (1KB)
- isActive: Boolean

## Quick Troubleshooting

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| "Invalid or expired API token" | Token not found or expired | Check token, regenerate if needed |
| "Project is currently inactive" | isActive = false | Reactivate in settings |
| "Model type not allowed" | Model type not in allowedModelTypes | Add to project settings |
| "Request payload too large" | Exceeds maxRequestSize | Reduce size or increase limit |
| "Project with this name already exists" | Duplicate name | Use different name |
| "At least one model type must be specified" | Empty modelTypesAllowed | Select model types |

## Performance Tips

1. **Index Usage**
   - Projects: indexed on `ownerId`
   - Settings: indexed on `projectId` and `isActive`
   - Tokens: indexed on `token` and `projectId`

2. **Caching**
   - Consider caching model types (rarely change)
   - Cache project settings for frequently accessed projects

3. **Pagination**
   - Add pagination for users with many projects
   - Limit populated fields to reduce data transfer

## Security Checklist

- [ ] Always hash tokens before storage
- [ ] Verify ownership on all operations
- [ ] Use transactions for multi-document operations
- [ ] Validate all inputs
- [ ] Check authentication and authorization
- [ ] Use HTTPS in production
- [ ] Rotate tokens periodically
- [ ] Monitor for unusual activity
- [ ] Rate limit external API requests
- [ ] Log security events
