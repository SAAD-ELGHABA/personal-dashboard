# Project Management Feature Documentation

## Overview

The Project Management feature provides a robust, maintainable system for creating and managing isolated workspaces for external applications using your Brain API. Each project has its own API token, configurable settings, and model type permissions.

## Architecture

### Backend Structure

```
backend/src/
├── services/
│   └── project.ts           # Business logic layer
├── controllers/
│   └── project.ts           # HTTP request handlers
├── middleware/
│   └── projectValidation.ts # Request validation middleware
├── routes/
│   └── project.ts           # API route definitions
└── models/
    ├── Project.ts           # Project schema
    └── ProjectSettings.ts   # Settings schema
```

### Frontend Structure

```
frontend/src/
├── pages/
│   └── Projects.tsx         # Main projects page
├── components/
│   ├── ProjectCard.tsx      # Project display card
│   ├── ProjectFormModal.tsx # Create/edit form
│   ├── ProjectSettingsModal.tsx # Settings management
│   └── TokenDisplayModal.tsx    # Token display/regeneration
├── services/
│   └── api.ts               # API client methods
└── types/
    └── index.ts             # TypeScript interfaces
```

## Features

### 1. Project Creation

**Purpose:** Create isolated workspaces with unique API tokens and settings.

**How it works:**
1. Admin creates a project with name, description, and model types
2. System generates a secure API token (hashed before storage)
3. Default settings are created (max request size, active status)
4. Token is shown once (never retrievable again)

**Security:**
- API tokens are hashed using SHA-256 before storage
- Tokens are 64 characters (32 bytes) for high entropy
- Transaction-based creation ensures data consistency

**API Endpoint:**
```http
POST /api/projects
Authorization: Bearer <jwt-token>

{
  "name": "My App",
  "description": "App description",
  "modelTypesAllowed": ["model-type-id-1", "model-type-id-2"],
  "maxRequestSize": 1048576  // 1MB in bytes
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": { /* project object */ },
    "apiToken": "64-char-token-shown-only-once",
    "settings": { /* settings object */ }
  },
  "message": "Project created successfully..."
}
```

### 2. Project Settings Management

**Purpose:** Project-level constraints and configuration.

**Key Settings:**
- `allowedModelTypes`: Array of permitted model type IDs
- `maxRequestSize`: Maximum payload size in bytes
- `isActive`: Enable/disable project instantly

**API Endpoint:**
```http
PUT /api/projects/:id/settings
Authorization: Bearer <jwt-token>

{
  "allowedModelTypes": ["model-type-id-1"],
  "maxRequestSize": 2097152,  // 2MB
  "isActive": false
}
```

### 3. Project Validation Middleware

**Purpose:** Validate external API requests before processing.

**Middleware Chain:**
```javascript
[validateProjectToken, checkProjectActive, validateRequestSize]
```

**Usage Example:**
```typescript
// In your API routes that external apps call
import { validateProjectRequest } from './middleware/projectValidation';

router.post('/run', validateProjectRequest, (req, res) => {
  // req.project and req.projectSettings are populated
  // Process the request...
});
```

**Validation Steps:**
1. Extract API token from `x-api-token` header
2. Hash and lookup token in database
3. Check token expiration and active status
4. Verify project is active (`isActive = true`)
5. Validate model type is allowed
6. Check request size against `maxRequestSize`

### 4. Token Management

**Features:**
- View token info (last used, expiration)
- Regenerate token (invalidates old one)
- Automatic hashing for security

**API Endpoint:**
```http
POST /api/projects/:id/regenerate-token
Authorization: Bearer <jwt-token>
```

### 5. CRUD Operations

**Get All Projects:**
```http
GET /api/projects?includeInactive=false
Authorization: Bearer <jwt-token>
```

**Get Single Project:**
```http
GET /api/projects/:id
Authorization: Bearer <jwt-token>
```

**Update Project:**
```http
PUT /api/projects/:id
Authorization: Bearer <jwt-token>

{
  "name": "Updated Name",
  "description": "Updated description",
  "modelTypesAllowed": ["new-model-type-ids"]
}
```

**Delete Project:**
```http
DELETE /api/projects/:id
Authorization: Bearer <jwt-token>
```

## Security Features

### 1. Token Hashing
- All API tokens are hashed using SHA-256
- Original tokens never stored in database
- Tokens shown only once upon creation

### 2. Authentication & Authorization
- JWT authentication required for all project management endpoints
- Admin/super_admin role required (configured in routes)
- Project ownership verified on all operations

### 3. Validation
- Input validation on all endpoints
- Model type validation ensures only valid types are selected
- Request size limits enforced at middleware level

### 4. Transaction Safety
- Database transactions for create/delete operations
- Rollback on failure ensures data consistency

## Frontend UX/UI Features

### 1. Responsive Design
- Grid layout adapts to screen size
- Mobile-friendly modals and forms
- Touch-friendly interactive elements

### 2. Visual Feedback
- Loading states for all async operations
- Success/error messages
- Disabled states during processing
- Color-coded badges (active/inactive, success/danger)

### 3. User Guidance
- Empty state with call-to-action
- Helpful placeholder text
- Field descriptions and validation messages
- Security warnings for sensitive operations

### 4. Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Focus management in modals
- Clear labels and ARIA attributes

### 5. Error Handling
- Try-catch blocks on all API calls
- User-friendly error messages
- Retry mechanisms on failure
- Network error detection

## Best Practices

### Backend

1. **Service Layer Pattern**
   - Business logic separated from controllers
   - Reusable service methods
   - Easy to test and maintain

2. **Error Handling**
   - Custom ApiError class for consistent errors
   - Proper HTTP status codes
   - Descriptive error messages

3. **Validation**
   - Input validation in controllers
   - Business rule validation in services
   - Mongoose schema validation as last line of defense

4. **Transactions**
   - Use transactions for multi-document operations
   - Always abort on error, commit on success
   - Close sessions in finally blocks

### Frontend

1. **State Management**
   - Local state for UI concerns
   - API state synchronized with backend
   - Loading and error states for all async operations

2. **Component Composition**
   - Reusable UI components
   - Smart vs presentational components
   - Props drilling avoided with proper state placement

3. **Type Safety**
   - TypeScript interfaces for all data structures
   - Proper typing for API responses
   - Type guards where needed

4. **User Experience**
   - Optimistic updates where appropriate
   - Loading indicators for feedback
   - Confirmation dialogs for destructive actions
   - Clear success/error messaging

## Usage Example

### For External Applications

```javascript
// External app making API request
const response = await fetch('https://your-api.com/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-token': 'your-64-char-project-token'
  },
  body: JSON.stringify({
    modelType: 'gpt-4',
    prompt: 'Hello, world!'
  })
});

const data = await response.json();
```

### Validation Flow

1. **Token Validation**
   - Extract `x-api-token` header
   - Hash and lookup in database
   - Check expiration and active status

2. **Project Check**
   - Verify project exists and is active
   - Load project settings

3. **Permission Check**
   - Validate model type against `allowedModelTypes`
   - Check request size against `maxRequestSize`

4. **Request Processing**
   - If all checks pass, process the request
   - Update `lastUsedAt` timestamp
   - Return response

## Maintenance

### Adding New Settings

1. Update `ProjectSettings` model
2. Update `UpdateProjectSettingsDTO` interface
3. Add validation in service layer
4. Update frontend form and types
5. Update documentation

### Adding New Validations

1. Create validation function in service
2. Add middleware if needed for external requests
3. Update controller with validation logic
4. Add frontend validation for better UX
5. Test thoroughly

### Monitoring

Key metrics to monitor:
- Token usage frequency
- Failed authentication attempts
- Request size violations
- Inactive project access attempts
- Model type permission violations

## Testing Checklist

### Backend
- [ ] Create project with valid data
- [ ] Create project with duplicate name
- [ ] Create project with invalid model types
- [ ] Update project settings
- [ ] Deactivate project and verify API requests fail
- [ ] Regenerate token and verify old token fails
- [ ] Delete project and verify cascade deletion
- [ ] Token validation with expired token
- [ ] Token validation with invalid token
- [ ] Request size validation

### Frontend
- [ ] Create project form validation
- [ ] Edit project updates display
- [ ] Settings modal updates immediately
- [ ] Token display shows only once on creation
- [ ] Token regeneration confirmation
- [ ] Delete confirmation dialog
- [ ] Error messages display correctly
- [ ] Loading states show during operations
- [ ] Responsive design on mobile
- [ ] Keyboard navigation works

## Troubleshooting

### Common Issues

**Issue:** "Invalid or expired API token"
- **Solution:** Verify token hasn't been regenerated or expired, check `x-api-token` header

**Issue:** "Model type not allowed for this project"
- **Solution:** Update project settings to include the required model type

**Issue:** "Request payload too large"
- **Solution:** Reduce request size or increase `maxRequestSize` in project settings

**Issue:** "Project is currently inactive"
- **Solution:** Reactivate project in settings modal

## Migration Guide

If upgrading from a previous version:

1. Run database migration to add new indexes
2. Update environment variables if needed
3. Restart backend server
4. Clear frontend cache
5. Test token validation with existing projects
6. Update any external application integrations

## Support

For issues or questions:
1. Check this documentation
2. Review API logs for detailed errors
3. Check browser console for frontend errors
4. Verify authentication and permissions
5. Contact support team
