# Intelligent Model Load Balancing System

## Overview

The Personal Dashboard now features an innovative **Intelligent Model Load Balancing System** that automatically selects the best-performing AI model for each request based on real-time health metrics, performance statistics, and availability. The selected model is cached for 1 hour to ensure consistent performance for external projects.

## Key Features

### 🎯 Health-Based Model Selection
The system evaluates models using multiple criteria:
- **Health Score (35% weight)**: Model health status, error rate, latency, and recent health checks
- **Performance Score (30% weight)**: Success rate, average latency, and usage patterns
- **Availability Score (25% weight)**: Rate limits, quota usage, priority, and weight
- **Cost Score (10% weight)**: Cost per request optimization

### ⚡ Smart Caching
- Best model selection is cached for **1 hour** per project and model type
- Reduces evaluation overhead while maintaining optimal performance
- Automatic cache invalidation after TTL expiration
- Manual cache management available via admin endpoints

### 📊 Real-Time Metrics Tracking
- Automatic tracking of request latency and success rates
- Exponential moving average for latency calculations
- Error rate monitoring with automatic health status updates
- Background metrics update (non-blocking)

### 🔄 Transparent Selection Process
- Detailed logging of model evaluation and selection
- Top 3 models are logged with their scores for transparency
- Cache hit/miss logging with remaining TTL

## API Usage

### Main Endpoint (Load Balanced)

**POST** `/brain/v1/run`

The existing endpoint now automatically uses intelligent load balancing.

#### Request
```javascript
await axios.post(
  `${API_URL}/brain/v1/run`,
  {
    modelType: "text-generation",
    input: message,
    options: {
      temperature: 0.7,
      maxTokens: 1000
    }
  },
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
  }
);
```

#### Response
```json
{
  "success": true,
  "data": {
    "result": {
      "text": "AI generated response...",
      "usage": { ... }
    },
    "model": {
      "name": "GPT-4",
      "version": "gpt-4-turbo-preview",
      "provider": "openai"
    },
    "service": {
      "id": "service_id",
      "name": "My Service"
    },
    "prompt": {
      "id": "prompt_id",
      "name": "My Prompt"
    },
    "metrics": {
      "latency": 1234,
      "cached": false
    }
  }
}
```

## Admin & Monitoring Endpoints

### 1. Evaluate Models (Debug)

Evaluate all available models for a specific type without using cache.

**POST** `/brain/v1/models/evaluate`

```javascript
const response = await axios.post(
  `${API_URL}/brain/v1/models/evaluate`,
  {
    modelType: "text-generation"
  },
  {
    headers: {
      'Authorization': `Bearer ${PROJECT_TOKEN}`
    }
  }
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "modelType": "text-generation",
    "totalModels": 3,
    "models": [
      {
        "id": "model_id_1",
        "name": "GPT-4 Turbo",
        "provider": "openai",
        "version": "gpt-4-turbo-preview",
        "status": "active",
        "score": 87.5,
        "metrics": {
          "healthScore": 90.0,
          "performanceScore": 85.0,
          "availabilityScore": 88.0,
          "costScore": 85.0
        }
      },
      {
        "id": "model_id_2",
        "name": "Claude 3 Opus",
        "provider": "anthropic",
        "version": "claude-3-opus-20240229",
        "status": "active",
        "score": 82.3,
        "metrics": {
          "healthScore": 85.0,
          "performanceScore": 80.0,
          "availabilityScore": 82.0,
          "costScore": 82.0
        }
      }
    ]
  }
}
```

### 2. Get Cache Statistics

**GET** `/brain/v1/cache/stats`

```javascript
const response = await axios.get(`${API_URL}/brain/v1/cache/stats`);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "size": 3,
    "entries": [
      {
        "key": "project_id_1:modeltype_id_1",
        "age": 1234,
        "score": 87.5
      },
      {
        "key": "project_id_2:modeltype_id_2",
        "age": 567,
        "score": 82.3
      }
    ]
  }
}
```

### 3. Clear Cache

**POST** `/brain/v1/cache/clear`

Clear all cache or specific project/model type combination.

```javascript
// Clear all cache
await axios.post(`${API_URL}/brain/v1/cache/clear`);

// Clear specific project and model type
await axios.post(
  `${API_URL}/brain/v1/cache/clear`,
  {
    projectId: "project_id",
    modelTypeId: "modeltype_id"
  }
);
```

## How It Works

### 1. Initial Request Flow

```
External Project → POST /brain/v1/run
                ↓
    Authenticate with Bearer token
                ↓
    Check cache for best model (key: projectId:modelTypeId)
                ↓
        Cache Miss? → Evaluate all available models
                    → Score each model (health, performance, availability, cost)
                    → Select highest scoring model
                    → Cache result for 1 hour
                ↓
        Cache Hit? → Use cached model
                ↓
    Execute model request
                ↓
    Update metrics (latency, success/failure)
                ↓
    Return response
```

### 2. Model Scoring Algorithm

Each model receives a score from 0-100 based on weighted criteria:

#### Health Score (35% weight)
- **Is Healthy (40 points)**: Model health status flag
- **Error Rate (30 points)**: Lower error rate = higher score (0-30 points)
- **Latency (30 points)**: 
  - <500ms: 30 points
  - <1000ms: 25 points
  - <2000ms: 15 points
  - <5000ms: 5 points
- **Recent Check Bonus (10 points)**: Checked within last 5 minutes

#### Performance Score (30% weight)
- **Success Rate (50 points)**: successful_requests / total_requests × 50
- **Average Latency (30 points)**: Same scale as health latency
- **Recent Usage Bonus (20 points)**:
  - Last hour: 20 points
  - Last day: 15 points
  - Last week: 10 points

#### Availability Score (25% weight)
- **Priority & Weight (40 points)**: Based on model configuration
- **Quota Availability (40 points)**:
  - <70% used: 40 points
  - <85% used: 30 points
  - <95% used: 15 points
  - >95% used: 5 points
- **Rate Limit Headroom (20 points)**: Higher limits = higher score

#### Cost Score (10% weight)
- Free models: 100 points
- Cost-based scoring (inverse relationship)

### 3. Cache Management

The system uses an in-memory cache with:
- **TTL**: 1 hour (3600 seconds)
- **Key Format**: `projectId:modelTypeId`
- **Auto-expiration**: Checks timestamp on each retrieval
- **Manual clearing**: Available via admin endpoint

### 4. Metrics Tracking

After each request execution:
- **Statistics Update**:
  - Increment total requests
  - Update success/failure counters
  - Calculate new average latency (exponential moving average)
  - Update last used timestamp

- **Health Update**:
  - Update latency measurement
  - Calculate error rate
  - Set health status based on:
    - Last request success
    - Error rate < 20%
    - Latency < 10 seconds

## Benefits

### For External Projects
- **Automatic Optimization**: Always connected to the best performing model
- **Consistency**: Same model for 1 hour ensures predictable behavior
- **No Configuration**: Works transparently with existing API calls
- **Better Performance**: Intelligent routing avoids unhealthy or slow models

### For Administrators
- **Visibility**: Monitor cache and model performance via admin endpoints
- **Control**: Manually clear cache to force re-evaluation
- **Debugging**: Evaluate endpoint shows detailed scoring for all models
- **Reliability**: System adapts to model health changes automatically

### For Cost Optimization
- **Intelligent Routing**: Considers cost alongside performance
- **Quota Management**: Avoids models approaching their limits
- **Load Distribution**: Naturally distributes load based on capacity

## Example Scenario

### Initial State
- 3 models available for "text-generation":
  - GPT-4 Turbo (fast, expensive, 95% success rate)
  - Claude 3 Opus (medium speed, medium cost, 98% success rate)
  - Llama 3 (slow, free, 90% success rate)

### First Request (t=0)
1. Cache is empty
2. System evaluates all 3 models
3. Claude 3 Opus scores highest (98.2):
   - Health: 95 (healthy, low latency)
   - Performance: 90 (high success rate)
   - Availability: 100 (plenty of quota)
   - Cost: 85 (medium cost)
4. Claude is cached for 1 hour
5. Request executes via Claude

### Subsequent Requests (t=0 to t=1h)
- All requests use cached Claude model
- Metrics are tracked for each request
- Cache remains valid

### After 1 Hour (t=1h)
- Cache expires
- Next request triggers re-evaluation
- If Claude's performance degraded:
  - System may select different model
  - New model cached for another hour

### Manual Intervention
- Admin notices GPT-4 improved
- Calls `/brain/v1/cache/clear`
- Next request re-evaluates all models
- GPT-4 selected if it now scores highest

## Console Logging

The system provides detailed console logs:

```
[ModelCache] No cache hit for key: projectId:modelTypeId
[LoadBalancer] Found 3 candidate models
[LoadBalancer] Top 3 models by score:
  1. Claude 3 Opus (anthropic)
     Total Score: 87.50
     - Health: 90.00
     - Performance: 85.00
     - Availability: 88.00
     - Cost: 87.00
  2. GPT-4 Turbo (openai)
     Total Score: 82.30
     ...
[ModelCache] Cached model for key: projectId:modelTypeId, score: 87.50
[Metrics] Updated for model modelId: latency=1234ms, success=true
```

## Best Practices

### For External Projects
1. **Consistent Token**: Use the same project token to benefit from caching
2. **Error Handling**: Handle model execution failures gracefully
3. **Monitoring**: Track response times and success rates on your end
4. **Feedback Loop**: Report issues to improve model health tracking

### For Administrators
1. **Monitor Health**: Regularly check model health status in dashboard
2. **Review Scores**: Use evaluate endpoint to understand model selection
3. **Clear Cache Wisely**: Only clear cache when necessary (new model added, known issue resolved)
4. **Update Configurations**: Adjust model priority/weight to influence selection

### For Model Configuration
1. **Set Realistic Limits**: Configure accurate rate limits and quotas
2. **Priority Matters**: Higher priority models get preferred treatment
3. **Cost Tracking**: Set costPerRequest for accurate cost optimization
4. **Health Monitoring**: Ensure models are monitored for real health data

## Future Enhancements

Potential improvements to the system:

1. **Redis Integration**: Replace in-memory cache with Redis for multi-instance deployments
2. **Machine Learning**: Predict model performance based on request characteristics
3. **Circuit Breaker**: Temporarily disable consistently failing models
4. **A/B Testing**: Support gradual rollout of new models
5. **Custom Weights**: Allow per-project weight customization
6. **Performance Predictions**: Estimate response time before execution
7. **Cost Budgets**: Enforce daily/monthly cost limits
8. **Regional Routing**: Route to geographically closer models

## Troubleshooting

### Model Never Selected
- Check model status is "active"
- Verify project has access (projectsAssigned or isPublic)
- Review health status in database
- Use evaluate endpoint to see scores

### Cache Not Working
- Check timestamps in cache stats
- Verify TTL hasn't expired
- Ensure same projectId and modelTypeId

### Unexpected Model Selection
- Review scores via evaluate endpoint
- Check health and statistics data
- Consider recent performance changes
- Review model priority and weight

### High Latency
- Model may be genuinely slow
- Check network connectivity to model endpoint
- Review model's rate limits
- Consider clearing cache to re-evaluate

## API Token Example

External projects should call the API like this:

```javascript
import axios from 'axios';

const API_URL = 'https://your-dashboard-api.com/brain';
const API_TOKEN = 'sk_proj_your_project_token_here';

async function callAI(message) {
  try {
    const response = await axios.post(
      `${API_URL}/v1/run`,
      {
        modelType: 'text-generation',
        input: message,
        options: {
          temperature: 0.7,
          maxTokens: 2000
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`,
        },
      }
    );
    
    console.log('Selected Model:', response.data.data.model.name);
    console.log('Response:', response.data.data.result.text);
    console.log('Latency:', response.data.data.metrics.latency, 'ms');
    
    return response.data.data.result.text;
  } catch (error) {
    console.error('AI call failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
callAI('What is the capital of France?')
  .then(result => console.log('AI Response:', result))
  .catch(err => console.error('Error:', err));
```

## Conclusion

The Intelligent Model Load Balancing System provides automatic, health-based model selection with smart caching, ensuring external projects always connect to the best-performing model while maintaining consistency and optimizing costs. The system is transparent, monitorable, and requires zero changes to existing API calls.
