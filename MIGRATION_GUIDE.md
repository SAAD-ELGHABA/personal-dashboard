# Migration Guide: MonitoringTask Schema Change

## Overview
The `MonitoringTask` model has been updated to reference `serviceId` instead of `projectId`. This change reflects the new microservices monitoring architecture where monitoring tasks are tied to individual services rather than entire projects.

## Breaking Changes

### Schema Changes
**Before:**
```typescript
{
  projectId: ObjectId,        // Reference to Project
  type: 'UPTIME' | 'SEO' | 'PERFORMANCE' | 'DNS_SSL' | 'CRAWL' | 'BACKLINKS',
  intervalMinutes: number,
  ...
}
```

**After:**
```typescript
{
  serviceId: ObjectId,        // Reference to Service (NEW)
  type: 'HEALTH' | 'PERFORMANCE' | 'SEO' | 'SSL' | 'DNS',
  intervalSeconds: number,    // Changed from intervalMinutes
  ...
}
```

### Key Differences
1. **Reference Change**: `projectId` → `serviceId`
2. **Time Unit Change**: `intervalMinutes` → `intervalSeconds`
3. **Task Types Updated**:
   - `UPTIME` → `HEALTH`
   - `DNS_SSL` split into `SSL` and `DNS` (separate tasks)
   - Removed: `CRAWL`, `BACKLINKS` (can be added back if needed)

## Migration Steps

### Option 1: Clean Database (Recommended for Development)

If you're in development and can afford to lose existing monitoring tasks:

```javascript
// Delete all existing monitoring tasks
await MonitoringTask.deleteMany({});

// Services will auto-create new monitoring tasks when created
```

### Option 2: Data Migration (Production)

For production environments where you need to preserve monitoring schedules:

```javascript
// 1. First, ensure all projects have at least one service created
//    You may need to manually create a default service for each project

// 2. Migration script
const migrateMonitoringTasks = async () => {
  const oldTasks = await MonitoringTask.find({});
  
  for (const task of oldTasks) {
    // Find the first service for this project (or create one)
    const service = await Service.findOne({ 
      projectId: task.projectId 
    });
    
    if (!service) {
      console.log(`No service found for project ${task.projectId}, skipping...`);
      continue;
    }
    
    // Map old task type to new type
    let newType;
    switch (task.type) {
      case 'UPTIME':
        newType = 'HEALTH';
        break;
      case 'DNS_SSL':
        // Create both SSL and DNS tasks
        await MonitoringTask.create({
          serviceId: service._id,
          type: 'SSL',
          intervalSeconds: task.intervalMinutes * 60,
          lastRunAt: task.lastRunAt,
          nextRunAt: task.nextRunAt,
          isActive: task.isActive,
        });
        newType = 'DNS';
        break;
      case 'PERFORMANCE':
      case 'SEO':
        newType = task.type;
        break;
      default:
        console.log(`Skipping unknown task type: ${task.type}`);
        continue;
    }
    
    // Create new task with serviceId
    await MonitoringTask.create({
      serviceId: service._id,
      type: newType,
      intervalSeconds: task.intervalMinutes * 60,
      lastRunAt: task.lastRunAt,
      nextRunAt: task.nextRunAt,
      isActive: task.isActive,
    });
  }
  
  console.log('Migration completed');
};

// Run migration
await migrateMonitoringTasks();
```

### Option 3: Manual Service Creation

If you prefer to manually set up services:

1. **For each project**, create services via API:
```bash
POST /api/services
{
  "projectId": "PROJECT_ID",
  "name": "Main Service",
  "type": "FRONTEND",  # or API, AI, WORKER, GATEWAY
  "baseUrl": "https://yourproject.com",
  "probePath": "/health",
  "isCritical": true
}
```

2. **Monitoring tasks are auto-created** when a service is created

3. **Delete old monitoring tasks**:
```javascript
await MonitoringTask.deleteMany({ projectId: { $exists: true } });
```

## Verification

After migration, verify:

```javascript
// 1. Check all services have monitoring tasks
const services = await Service.find({ isActive: true });
for (const service of services) {
  const tasks = await MonitoringTask.find({ serviceId: service._id });
  console.log(`Service ${service.name}: ${tasks.length} monitoring tasks`);
}

// 2. Verify no old tasks remain (with projectId)
const oldTasks = await MonitoringTask.find({ projectId: { $exists: true } });
console.log(`Old tasks remaining: ${oldTasks.length} (should be 0)`);

// 3. Check task types
const taskTypes = await MonitoringTask.distinct('type');
console.log('Task types in use:', taskTypes);
// Should be: ['HEALTH', 'PERFORMANCE', 'SEO', 'SSL', 'DNS']
```

## Rollback Plan

If you need to rollback:

1. **Keep a backup** of your database before migration
2. **Restore from backup** if issues occur
3. **Revert code** to previous version

## Impact Assessment

### What still works:
- Project management
- User authentication
- API tokens
- Model registry
- All existing project features

### What needs attention:
- Any code that queries `MonitoringTask` by `projectId`
- Any monitoring workers/cron jobs that process monitoring tasks
- Dashboard displays showing monitoring status

## Timeline Recommendation

For production deployment:

1. **Week 1**: Deploy code without running migrations
2. **Week 2**: Create services for existing projects (can be done gradually)
3. **Week 3**: Run migration script during low-traffic period
4. **Week 4**: Monitor and adjust as needed

## Support

If you encounter issues:

1. Check service creation logs
2. Verify MongoDB indexes are created
3. Ensure authentication middleware is working
4. Review API endpoint access logs

## Additional Notes

- The new system is more flexible and scalable
- Each service can have different monitoring intervals
- Project health is now aggregated from service health
- Historical monitoring data from old system is preserved in respective collections
- Consider archiving old monitoring tasks before deletion for audit purposes

## FAQ

**Q: Can I have a project without services?**
A: Yes, but it won't be monitored. Projects require at least one service for monitoring.

**Q: What happens to existing health check data?**
A: Existing health checks in `ProjectHealthCheck` model remain unchanged. New health checks use `ServiceHealthCheck`.

**Q: Can I still monitor at the project level?**
A: Yes, use `ProjectHealthSnapshot` which aggregates all service health statuses.

**Q: Do I need to update my frontend?**
A: Yes, if your frontend displays monitoring data. New TypeScript types are available in `frontend/src/types/index.ts`.
