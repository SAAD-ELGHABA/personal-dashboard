# Brain API - AI Model Execution

## Overview

The Brain API allows external services to execute AI models using project API tokens and service-specific prompts. This enables seamless integration of AI capabilities into your applications.

## Architecture

1. **Project API Tokens**: Each project has a unique API token (`sk_proj_xxxx`) for authentication
2. **Service Prompts**: Each service can have multiple prompts per model type, with one active prompt
3. **Model Execution**: The API validates tokens, retrieves active prompts, and executes the appropriate AI model

## Token Management

### Regenerate Project Token

Regenerate the API token for a project (invalidates the old token).

**Endpoint:** `POST /api/projects/:id/regenerate-token`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiToken": "sk_proj_new_token_here"
  },
  "message": "API token regenerated successfully. Save it securely, it will not be shown again."
}
```

## Service Prompts Management

### Create Service Prompt

Create a new prompt for a service and model type combination.

**Endpoint:** `POST /api/services/:serviceId/prompts`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "modelTypeId": "64f1b2c3d4e5f6a7b8c9d0e1",
  "name": "Customer Support Chatbot",
  "promptText": "You are a helpful customer support assistant for our e-commerce platform. Answer the following customer question: {{input}}",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prompt": {
      "_id": "64f1b2c3d4e5f6a7b8c9d0e2",
      "serviceId": "64f1b2c3d4e5f6a7b8c9d0e3",
      "modelTypeId": {
        "_id": "64f1b2c3d4e5f6a7b8c9d0e1",
        "key": "chatbot",
        "name": "Chatbot"
      },
      "name": "Customer Support Chatbot",
      "promptText": "You are a helpful customer support assistant...",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Service prompt created successfully"
}
```

### Get Service Prompts

Get all prompts for a service, optionally filtered by model type.

**Endpoint:** `GET /api/services/:serviceId/prompts?modelTypeId=<optional>`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prompts": [
      {
        "_id": "64f1b2c3d4e5f6a7b8c9d0e2",
        "serviceId": "64f1b2c3d4e5f6a7b8c9d0e3",
        "modelTypeId": {
          "_id": "64f1b2c3d4e5f6a7b8c9d0e1",
          "key": "chatbot",
          "name": "Chatbot",
          "description": "Conversational AI models"
        },
        "name": "Customer Support Chatbot",
        "promptText": "You are a helpful customer support assistant...",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Get Specific Prompt

**Endpoint:** `GET /api/services/prompts/:promptId`

### Update Service Prompt

**Endpoint:** `PUT /api/services/prompts/:promptId`

**Body:**
```json
{
  "name": "Updated Prompt Name",
  "promptText": "Updated prompt text with {{input}} placeholder",
  "isActive": true
}
```

### Set Prompt as Active

Deactivate all other prompts for the same service-modelType combination and activate this one.

**Endpoint:** `POST /api/services/prompts/:promptId/set-active`

### Delete Service Prompt

**Endpoint:** `DELETE /api/services/prompts/:promptId`

## Brain API - Model Execution

### Execute AI Model

Execute an AI model using a service's active prompt.

**Endpoint:** `POST /brain/v1/run`

**Headers:**
```
Authorization: Bearer sk_proj_xxxx
Content-Type: application/json
```

**Body:**
```json
{
  "modelType": "chatbot",
  "serviceId": "64f1b2c3d4e5f6a7b8c9d0e3",
  "input": "Where is my order?",
  "options": {
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

**Parameters:**
- `modelType` (required): The type of model to use (e.g., "chatbot", "translation", "summarization")
- `serviceId` (required): The ID of the service making the request (determines which prompt to use)
- `input` (required): The user input that will replace the `{{input}}` placeholder in the prompt
- `options` (optional): Additional options for model execution
  - `temperature`: Controls randomness (0.0 - 1.0)
  - `maxTokens`: Maximum tokens in the response
  - `modelVersion`: Specific model version to use
  - Custom placeholders that match your prompt template (e.g., `{{userName}}`, `{{context}}`)

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "text": "I'd be happy to help you track your order! To locate your order, I'll need your order number...",
      "usage": {
        "prompt_tokens": 150,
        "completion_tokens": 200,
        "total_tokens": 350
      }
    },
    "model": {
      "name": "GPT-4",
      "version": "gpt-4-turbo",
      "provider": "openai"
    },
    "service": {
      "id": "64f1b2c3d4e5f6a7b8c9d0e3",
      "name": "Customer Support API"
    },
    "prompt": {
      "id": "64f1b2c3d4e5f6a7b8c9d0e2",
      "name": "Customer Support Chatbot"
    }
  }
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "success": false,
  "message": "Invalid or expired API token"
}
```

403 Forbidden:
```json
{
  "success": false,
  "message": "Model type not allowed for this project"
}
```

404 Not Found:
```json
{
  "success": false,
  "message": "No active prompt found for service 'Customer Support API' and model type 'chatbot'"
}
```

503 Service Unavailable:
```json
{
  "success": false,
  "message": "No available model found for type 'chatbot'"
}
```

## Prompt Templates

Prompts support placeholder substitution using `{{placeholder}}` syntax.

**Example Prompt:**
```
You are a helpful customer support assistant for {{companyName}}.
Current user: {{userName}}
User question: {{input}}

Please provide a helpful, friendly response.
```

**Request:**
```json
{
  "modelType": "chatbot",
  "serviceId": "64f1b2c3d4e5f6a7b8c9d0e3",
  "input": "How do I return an item?",
  "options": {
    "companyName": "Acme Corp",
    "userName": "John Doe"
  }
}
```

## Integration Example

### Node.js / JavaScript

```javascript
const axios = require('axios');

const brainAPI = axios.create({
  baseURL: 'https://personal-dashboard.com',
  headers: {
    'Authorization': 'Bearer sk_proj_your_token_here',
    'Content-Type': 'application/json'
  }
});

async function askChatbot(question) {
  try {
    const response = await brainAPI.post('/brain/v1/run', {
      modelType: 'chatbot',
      serviceId: 'your-service-id',
      input: question,
      options: {
        temperature: 0.7,
        maxTokens: 500
      }
    });
    
    return response.data.data.result.text;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
askChatbot('Where is my order?')
  .then(answer => console.log('Bot:', answer))
  .catch(err => console.error('Failed:', err));
```

### Python

```python
import requests

class BrainAPI:
    def __init__(self, api_token, service_id):
        self.base_url = "https://personal-dashboard.com"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        self.service_id = service_id
    
    def run_model(self, model_type, user_input, options=None):
        payload = {
            "modelType": model_type,
            "serviceId": self.service_id,
            "input": user_input,
            "options": options or {}
        }
        
        response = requests.post(
            f"{self.base_url}/brain/v1/run",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()["data"]["result"]["text"]

# Usage
api = BrainAPI("sk_proj_your_token_here", "your-service-id")
answer = api.run_model("chatbot", "Where is my order?")
print(f"Bot: {answer}")
```

### cURL

```bash
curl -X POST https://personal-dashboard.com/brain/v1/run \
  -H "Authorization: Bearer sk_proj_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "modelType": "chatbot",
    "serviceId": "64f1b2c3d4e5f6a7b8c9d0e3",
    "input": "Where is my order?",
    "options": {
      "temperature": 0.7,
      "maxTokens": 500
    }
  }'
```

## Best Practices

1. **Secure Token Storage**: Store project API tokens securely (environment variables, secrets manager)
2. **Token Rotation**: Regenerate tokens periodically and after any security incidents
3. **Prompt Versioning**: Use descriptive names for prompts and create new versions instead of overwriting
4. **Error Handling**: Implement proper error handling for rate limits, timeouts, and model unavailability
5. **Input Validation**: Validate and sanitize user input before sending to the API
6. **Monitoring**: Track API usage, response times, and error rates
7. **Prompt Testing**: Test prompts thoroughly before setting them as active in production

## Rate Limits

- Rate limits are determined by the model's `maxRequestsPerMinute` setting
- HTTP 429 (Too Many Requests) is returned when limits are exceeded
- Implement exponential backoff retry logic in your applications

## Security Considerations

1. **API Token Format**: All project tokens must start with `sk_proj_`
2. **Token Expiration**: Tokens expire after 1 year by default
3. **HTTPS Only**: Always use HTTPS in production
4. **Input Sanitization**: Never trust user input, always validate and sanitize
5. **Prompt Injection**: Be aware of prompt injection attacks and design prompts defensively
