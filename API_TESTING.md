# API Testing Guide

## Test the Microservices Monitoring System

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Save the token from the response!**

### 3. Create a Project
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Microservices Project",
    "url": "https://myproject.com",
    "description": "Test project for microservices monitoring",
    "modelTypesAllowed": []
  }'
```

**Save the project ID from the response!**

### 4. Create Services

#### Frontend Service
```bash
PROJECT_ID="YOUR_PROJECT_ID_HERE"

curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "name": "Frontend App",
    "type": "FRONTEND",
    "baseUrl": "https://example.com",
    "probePath": "/",
    "expectedHttpStatus": 200,
    "timeoutMs": 5000,
    "isCritical": true,
    "isPublic": true,
    "isActive": true
  }'
```

#### Backend API Service
```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "name": "Backend API",
    "type": "API",
    "baseUrl": "https://api.example.com",
    "probePath": "/health",
    "expectedHttpStatus": 200,
    "timeoutMs": 5000,
    "isCritical": true,
    "isPublic": true,
    "isActive": true
  }'
```

### 5. Get Project Services
```bash
curl http://localhost:5000/api/services/project/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Get Service Details
```bash
SERVICE_ID="YOUR_SERVICE_ID_HERE"

curl http://localhost:5000/api/services/$SERVICE_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Update Service
```bash
curl -X PUT http://localhost:5000/api/services/$SERVICE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Service Name",
    "isActive": false
  }'
```

### 8. Delete Service
```bash
curl -X DELETE http://localhost:5000/api/services/$SERVICE_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Frontend Testing

1. **Start the frontend**: `npm run dev` in the frontend directory
2. **Navigate to**: `http://localhost:5173` (or your configured port)
3. **Login/Register**: Use the auth forms
4. **Go to Projects**: Click "Projects" in the sidebar
5. **Create a Project**: Click "Create Project"
6. **Manage Services**: Click "Manage Services" on a project card
7. **Add Services**: Click "Add Service" and fill out the form
8. **View Health**: Watch the service cards update with health status

## Expected Results

### Service Creation
- Service is created successfully
- 4 monitoring tasks are auto-created:
  - HEALTH (every 5 minutes)
  - PERFORMANCE (every 10 minutes)
  - SSL (daily)
  - DNS (hourly)

### Health Checks
- Services show "DOWN" initially (no health checks yet)
- Once monitoring workers run, status updates to UP/DEGRADED/DOWN
- Response time, HTTP status, DNS, and SSL info displayed

### Project Health
- Aggregates all service statuses
- Shows total, operational, degraded, and down counts
- Overall status: UP/DEGRADED/DOWN based on critical services

## Troubleshooting

### Services show as DOWN
- This is normal! Health checks need to run
- Implement background workers to execute monitoring tasks
- Or manually trigger health checks via the monitoring service functions

### Cannot create service
- Check project ID is correct
- Verify authentication token is valid
- Check backend logs for errors

### Frontend not updating
- Services refresh every 30 seconds automatically
- Check browser console for errors
- Verify API endpoints are accessible

## Next Steps

1. **Implement Background Workers**: Create cron jobs or workers to execute monitoring tasks
2. **Test Health Checks**: Run `performHealthCheck()` functions manually
3. **View Metrics**: Check health history and performance data
4. **Configure Alerts**: Add notification system for DOWN/DEGRADED services
