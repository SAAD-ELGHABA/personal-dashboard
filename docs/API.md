# API Documentation

Base URL: `http://localhost:5000`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Register User
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/api/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

### Get Current User
**GET** `/api/auth/me`

Get the currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

## API Tokens

### Get All Tokens
**GET** `/api/tokens`

Retrieve all active API tokens for the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "id": "token_id",
        "name": "My App Token",
        "scopes": ["read", "write"],
        "expiresAt": "2025-11-01T00:00:00.000Z",
        "createdAt": "2025-10-01T00:00:00.000Z",
        "isActive": true
      }
    ]
  }
}
```

### Create Token
**POST** `/api/tokens`

Create a new API token for third-party applications.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "My Application",
  "scopes": ["read", "write"],
  "expiresIn": 30
}
```

**Parameters:**
- `name` (string, required): Token name
- `scopes` (array, required): Array of scopes (`read`, `write`, `admin`)
- `expiresIn` (number, required): Expiration in days (1-365)

**Response:**
```json
{
  "success": true,
  "data": {
    "token": {
      "id": "token_id",
      "name": "My Application",
      "token": "generated_token_here",
      "scopes": ["read", "write"],
      "expiresAt": "2025-11-01T00:00:00.000Z"
    }
  },
  "message": "Token created successfully. Save it securely, it will not be shown again."
}
```

**Note:** The token value is only returned once during creation.

### Get Token by ID
**GET** `/api/tokens/:id`

Get details of a specific token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": {
      "id": "token_id",
      "name": "My App Token",
      "scopes": ["read", "write"],
      "expiresAt": "2025-11-01T00:00:00.000Z",
      "createdAt": "2025-10-01T00:00:00.000Z",
      "lastUsedAt": "2025-10-15T12:00:00.000Z",
      "isActive": true
    }
  }
}
```

### Revoke Token
**DELETE** `/api/tokens/:id`

Revoke an API token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

## Statistics

### Get n8n Statistics
**GET** `/api/stats/n8n`

Retrieve n8n workflow statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": {
      "total": 10,
      "active": 8,
      "inactive": 2
    },
    "executions": {
      "total": 150,
      "successful": 145,
      "failed": 5,
      "successRate": "96.67"
    },
    "recentExecutions": [
      {
        "id": "exec_id",
        "workflowId": "workflow_id",
        "status": "success",
        "startTime": "2025-10-01T12:00:00.000Z",
        "duration": 1500
      }
    ]
  }
}
```

### Get Portfolio Statistics
**GET** `/api/stats/portfolio`

Retrieve portfolio visitor statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "visitors": {
      "total": 1250,
      "last7Days": 85,
      "byDay": [
        {
          "date": "2025-10-01",
          "count": 12
        }
      ]
    },
    "projects": {
      "total": 15,
      "mostViewed": [
        {
          "id": "project_id",
          "name": "Project Name",
          "views": 250
        }
      ]
    }
  }
}
```

## Admin Endpoints

### Get Admin Statistics
**GET** `/api/admin/stats`

Get administrative statistics (admin role required).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTokens": 25,
    "expiredTokens": 3,
    "activeTokens": 22
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": []
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse. The current limits are:
- 100 requests per 15 minutes per IP address

## Token Scopes

API tokens can have the following scopes:

- **read**: Read-only access to statistics
- **write**: Read and write access (create/update resources)
- **admin**: Full administrative access

## Using API Tokens

To use an API token in your application:

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  http://localhost:5000/api/stats/n8n
```

```javascript
// JavaScript/Node.js example
const axios = require('axios');

const response = await axios.get('http://localhost:5000/api/stats/n8n', {
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
});

console.log(response.data);
```

```python
# Python example
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_TOKEN'
}

response = requests.get('http://localhost:5000/api/stats/n8n', headers=headers)
print(response.json())
```
