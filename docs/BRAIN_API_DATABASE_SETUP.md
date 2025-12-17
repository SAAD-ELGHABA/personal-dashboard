# Brain API Database Setup

## New Collection: ServicePrompt

The Brain API feature introduces a new MongoDB collection for managing service prompts.

### Collection Schema

```javascript
{
  _id: ObjectId,
  serviceId: ObjectId,        // Reference to services collection
  modelTypeId: ObjectId,      // Reference to modeltypes collection
  name: String,               // Prompt name/label
  promptText: String,         // Prompt template with {{placeholders}}
  isActive: Boolean,          // Only one active per service-modelType
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

### Indexes

The following indexes are automatically created:

```javascript
// For quick active prompt lookup
db.serviceprompts.createIndex({ serviceId: 1, modelTypeId: 1, isActive: 1 });

// For service-specific queries
db.serviceprompts.createIndex({ serviceId: 1 });

// For model type filtering
db.serviceprompts.createIndex({ modelTypeId: 1 });
```

## No Migration Required

The ServicePrompt collection will be automatically created when:
1. The application starts (MongoDB will create it on first insert)
2. The first service prompt is created via API

**Note**: Mongoose automatically creates collections and indexes when models are defined.

## Sample Data (Optional)

To test the Brain API, you can create sample prompts using the MongoDB shell or API:

### Via MongoDB Shell

```javascript
// 1. Find a service ID
const service = db.services.findOne({ name: "Customer Support API" });

// 2. Find a model type ID
const modelType = db.modeltypes.findOne({ key: "chatbot" });

// 3. Create a sample prompt
db.serviceprompts.insertOne({
  serviceId: service._id,
  modelTypeId: modelType._id,
  name: "Customer Support Chatbot",
  promptText: "You are a helpful customer support assistant. Answer this question professionally: {{input}}",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### Via API

```bash
# Get JWT token first by logging in
JWT_TOKEN="your_jwt_token_here"

# Get your service ID
SERVICE_ID="your_service_id"

# Get model type ID (you can list them via GET /api/projects/model-types)
MODEL_TYPE_ID="your_model_type_id"

# Create a prompt
curl -X POST http://localhost:5000/api/services/$SERVICE_ID/prompts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelTypeId": "'$MODEL_TYPE_ID'",
    "name": "Customer Support Chatbot",
    "promptText": "You are a helpful customer support assistant for our e-commerce platform. Answer the following customer question: {{input}}",
    "isActive": true
  }'
```

## Verification

After starting your application, verify the collection was created:

```javascript
// In MongoDB shell
use your_database_name;

// Check if collection exists
db.getCollectionNames();

// Should include 'serviceprompts'

// Check indexes
db.serviceprompts.getIndexes();

// Should show:
// - _id_ (default)
// - serviceId_1_modelTypeId_1_isActive_1
// - serviceId_1
```

## Existing Data Considerations

### Services Collection
No changes required to existing services. Services will work as before, but can now have prompts associated with them.

### Projects Collection
No changes required. Projects already have `apiToken` field that's used by the Brain API.

### ModelTypes Collection
No changes required. Model types are referenced by service prompts but don't need modification.

### Models Collection
No changes required. Models are selected based on model type during Brain API execution.

## Rollback Plan

If you need to rollback this feature:

1. **Drop the collection:**
```javascript
db.serviceprompts.drop();
```

2. **Remove the routes** from your application by commenting out:
   - Brain router in `app.ts`
   - Service prompt routes in `routes/service.ts`

3. **No other collections are affected**, so rollback is safe.

## Performance Considerations

### Expected Load
- Service prompts are queried once per Brain API request
- Query is indexed and very fast (< 1ms)
- Low write frequency (prompts are created/updated infrequently)

### Scaling
- For high-traffic applications, consider caching active prompts
- Redis cache key pattern: `prompt:${serviceId}:${modelTypeId}:active`
- Cache TTL: 5-10 minutes (prompts change infrequently)

### Monitoring Queries

Monitor slow queries for this collection:

```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 });

// Check slow queries
db.system.profile.find({ ns: "your_db.serviceprompts", millis: { $gt: 100 } });
```

## Backup Recommendations

Include the new collection in your backup strategy:

```bash
# Backup specific collection
mongodump --db=your_db --collection=serviceprompts --out=/backup/path

# Restore if needed
mongorestore --db=your_db --collection=serviceprompts /backup/path/your_db/serviceprompts.bson
```

## Security Notes

1. **Access Control**: Service prompts contain sensitive business logic
   - Ensure proper authentication on all prompt endpoints
   - Only project owners should manage prompts

2. **Prompt Injection**: Validate prompt text during creation
   - Consider implementing prompt content policies
   - Sanitize user inputs in the Brain API

3. **Audit Trail**: Consider adding audit logging for:
   - Prompt creation/updates
   - Active prompt changes
   - Brain API executions

## Testing the Setup

After deployment, test with this simple flow:

```bash
# 1. Create a service (if you don't have one)
# 2. Create a prompt for that service
# 3. Use the Brain API with your project token

# Example test request
curl -X POST http://localhost:5000/brain/v1/run \
  -H "Authorization: Bearer sk_proj_your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "modelType": "chatbot",
    "serviceId": "your_service_id",
    "input": "Test question"
  }'
```

Expected response structure:
```json
{
  "success": true,
  "data": {
    "result": { "text": "...", "usage": {} },
    "model": { "name": "...", "version": "...", "provider": "..." },
    "service": { "id": "...", "name": "..." },
    "prompt": { "id": "...", "name": "..." }
  }
}
```
