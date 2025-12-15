# Microservices Monitoring - Quick Start

## What's New?

Your Personal Dashboard now supports **microservices monitoring**! Track multiple services per project with comprehensive health checks, performance metrics, and availability statistics.

## Quick Example

### 1. Create a Service

```bash
curl -X POST https://your-api.com/api/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "507f1f77bcf86cd799439011",
    "name": "Frontend",
    "type": "FRONTEND",
    "baseUrl": "https://myapp.com",
    "probePath": "/health",
    "isCritical": true
  }'
```

### 2. View Service Health

```bash
curl https://your-api.com/api/services/SERVICE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "_id": "...",
  "name": "Frontend",
  "type": "FRONTEND",
  "baseUrl": "https://myapp.com",
  "latestHealth": {
    "status": "UP",
    "responseTimeMs": 245,
    "httpStatus": 200,
    "dnsResolved": true,
    "sslValid": true
  },
  "availabilityStats": [
    {
      "period": "24h",
      "uptimePercentage": 99.95,
      "downtimeMinutes": 0.72
    }
  ]
}
```

## Service Types

- **FRONTEND**: Web applications, landing pages
- **API**: REST APIs, GraphQL endpoints
- **AI**: ML models, AI services
- **WORKER**: Background jobs, queue processors
- **GATEWAY**: API gateways, load balancers

## Health Statuses

- 🟢 **UP**: Service is healthy
- 🟡 **DEGRADED**: Service responding but with issues
- 🔴 **DOWN**: Service is unavailable

## Monitoring Features

### Automatic Health Checks
✅ HTTP status validation  
✅ Response time measurement  
✅ DNS resolution checks  
✅ SSL certificate validation  
✅ Error tracking  

### Performance Metrics
📊 Average latency  
📊 95th percentile latency  
📊 Error rate percentage  
📊 Sample size tracking  

### Availability Statistics
📈 Uptime percentage (24h, 7d, 30d)  
📈 Downtime tracking in minutes  
📈 Historical trends  

### Specialized Checks
🔍 **SEO**: Meta tags, robots.txt, sitemap  
🔒 **SSL**: Certificate validity, expiration dates  
🌐 **DNS**: Resolution time, record types  

## Default Monitoring Schedule

| Check Type | Frequency |
|------------|-----------|
| Health | Every 5 minutes |
| Performance | Every 10 minutes |
| SSL | Daily |
| DNS | Hourly |
| SEO | On-demand |

## Project Health Aggregation

Your project's overall health is automatically calculated based on all services:

- **Critical services DOWN** → Project is DOWN
- **Critical services DEGRADED** → Project is DEGRADED  
- **All services operational** → Project is UP

## API Endpoints

```
POST   /api/services                              Create service
GET    /api/services/project/:projectId           List project services
GET    /api/services/:serviceId                   Get service details
PUT    /api/services/:serviceId                   Update service
DELETE /api/services/:serviceId                   Delete service
GET    /api/services/:serviceId/health-history    Health check history
GET    /api/services/:serviceId/performance-history Performance history
```

## Configuration Options

```typescript
{
  probePath: "/health",           // Health check endpoint
  expectedHttpStatus: 200,        // Expected response code
  timeoutMs: 5000,                // Request timeout
  isCritical: true,               // Affects project health
  isPublic: false,                // Public vs internal service
  isActive: true                  // Enable/disable monitoring
}
```

## Best Practices

1. ✅ Mark mission-critical services with `isCritical: true`
2. ✅ Use appropriate health check endpoints (`/health`, `/ping`, `/status`)
3. ✅ Set realistic timeouts based on service characteristics
4. ✅ Distinguish public-facing services with `isPublic: true`
5. ✅ Disable monitoring for dev/staging services with `isActive: false`

## Example: Complete Microservices Setup

```javascript
// 1. Backend API
await createService({
  projectId: project._id,
  name: "Backend API",
  type: "API",
  baseUrl: "https://api.myapp.com",
  probePath: "/v1/health",
  isCritical: true,
  isPublic: true
});

// 2. Frontend
await createService({
  projectId: project._id,
  name: "Web App",
  type: "FRONTEND",
  baseUrl: "https://myapp.com",
  probePath: "/",
  expectedHttpStatus: 200,
  isCritical: true,
  isPublic: true
});

// 3. AI Service
await createService({
  projectId: project._id,
  name: "ML API",
  type: "AI",
  baseUrl: "https://ml.myapp.com",
  probePath: "/health",
  isCritical: false,  // Non-critical
  isPublic: false
});

// 4. Worker
await createService({
  projectId: project._id,
  name: "Job Processor",
  type: "WORKER",
  baseUrl: "https://worker.myapp.com",
  probePath: "/status",
  isCritical: false,
  isPublic: false
});
```

## Monitoring at Scale

The system is designed to handle:
- ✅ Hundreds of services
- ✅ Thousands of health checks per hour
- ✅ Complex microservice architectures
- ✅ Multi-region deployments
- ✅ Hybrid cloud/on-premise setups

## What's Next?

🚀 **Coming Soon:**
- Alert notifications (email, Slack, webhooks)
- Custom monitoring intervals per service
- Incident management
- Service dependency mapping
- SLA tracking and reporting
- Advanced analytics dashboards

## Documentation

- 📖 [Full Documentation](./MICROSERVICES_MONITORING.md)
- 📖 [Implementation Details](./IMPLEMENTATION_SUMMARY.md)
- 📖 [Migration Guide](./MIGRATION_GUIDE.md)

## Support

Need help? Check the documentation or review the example implementations in:
- `backend/src/controllers/service.ts` - API endpoints
- `backend/src/services/serviceMonitoring.ts` - Monitoring logic
- `backend/src/models/Service*.ts` - Data models

---

**Built with ❤️ for modern microservices architecture**
