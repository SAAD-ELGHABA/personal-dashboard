# Load Balancing Quick Reference

## Overview
The system automatically selects the best AI model based on health metrics and caches it for 1 hour.

## How Caching Works
```
First Request → Evaluate All Models → Select Best → Cache for 1h → Execute
Next Requests (within 1h) → Use Cached Model → Execute
After 1h → Cache Expires → Re-evaluate on next request
```

## Scoring Criteria
| Criterion | Weight | What It Measures |
|-----------|--------|------------------|
| Health | 35% | Model health status, error rate, latency |
| Performance | 30% | Success rate, average latency, recent usage |
| Availability | 25% | Rate limits, quota usage, priority |
| Cost | 10% | Cost per request |

**Total Score:** 0-100 (higher is better)

## Client Integration (No Changes Needed!)

Your existing code works automatically with load balancing:

```javascript
// Same API call as before
await axios.post(
  `${API_URL}/brain/v1/run`,
  {
    modelType: "text-generation",
    input: message
  },
  {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
    },
  }
);
```

The system now:
1. ✅ Checks cache for best model
2. ✅ Evaluates models if cache expired
3. ✅ Selects highest scoring model
4. ✅ Caches selection for 1 hour
5. ✅ Tracks metrics after execution

## Response Format

```json
{
  "success": true,
  "data": {
    "result": { "text": "...", "usage": {...} },
    "model": {
      "name": "GPT-4 Turbo",
      "version": "gpt-4-turbo-preview",
      "provider": "openai"
    },
    "metrics": {
      "latency": 1234,
      "cached": false  // Model selection was cached
    }
  }
}
```

## Admin Endpoints

### 1. Evaluate Models (Debug)
```bash
POST /brain/v1/models/evaluate
{
  "modelType": "text-generation"
}
```
Returns all models with their scores.

### 2. Cache Stats
```bash
GET /brain/v1/cache/stats
```
Returns cache size and entries with TTL.

### 3. Clear Cache
```bash
POST /brain/v1/cache/clear
{}
```
Forces re-evaluation on next request.

## Console Logs

Watch for these logs to understand model selection:

```
[LoadBalancer] Found 3 candidate models
[LoadBalancer] Top 3 models by score:
  1. Claude 3 Opus (anthropic) - Score: 87.50
  2. GPT-4 Turbo (openai) - Score: 82.30
  3. Llama 3 (local) - Score: 75.60
[ModelCache] Cached model for 1h
[Metrics] Updated: latency=1234ms, success=true
```

## Benefits

✅ **Zero Configuration**: Works automatically  
✅ **Smart Selection**: Best model based on real-time health  
✅ **Consistent**: Same model for 1 hour  
✅ **Performance**: Avoids slow or unhealthy models  
✅ **Cost-Aware**: Considers pricing in selection  
✅ **Transparent**: Detailed logging and monitoring  

## Example Timeline

| Time | Event | Cache Status |
|------|-------|--------------|
| 10:00 AM | First request | Miss → Evaluate → Cache GPT-4 |
| 10:15 AM | Request | Hit → Use GPT-4 |
| 10:30 AM | Request | Hit → Use GPT-4 |
| 11:00 AM | Request | Hit → Use GPT-4 |
| 11:01 AM | Request | **Expired** → Re-evaluate → Cache Claude |
| 11:30 AM | Request | Hit → Use Claude |

## Model Health Criteria

A model is considered **healthy** if:
- ✅ Last request succeeded
- ✅ Error rate < 20%
- ✅ Latency < 10 seconds

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Unexpected model selected | Check `/v1/models/evaluate` for scores |
| Cache not working | Verify same projectId and modelTypeId |
| Model never selected | Check status='active' and project access |
| High latency | Clear cache to re-evaluate models |

## Key Points

1. **1 Hour TTL**: Cache expires after exactly 1 hour
2. **Per Project**: Each project gets its own cache
3. **Per Model Type**: Each model type is evaluated separately
4. **Real-Time Metrics**: Health updates after every request
5. **Weighted Scoring**: Health matters most (35%), then performance (30%)

## Advanced: Manual Cache Control

```javascript
// Force re-evaluation for specific project and type
await axios.post('/brain/v1/cache/clear', {
  projectId: 'your_project_id',
  modelTypeId: 'your_model_type_id'
});

// Clear all cache
await axios.post('/brain/v1/cache/clear');
```

## Performance Impact

- **Cache Hit**: < 1ms overhead
- **Cache Miss**: 50-200ms evaluation (depends on number of models)
- **Metrics Update**: Non-blocking (doesn't affect response time)

---

**Full Documentation:** See [LOAD_BALANCING.md](./LOAD_BALANCING.md)
