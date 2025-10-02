# Development Guide

Guide for developers working on the Personal Dashboard project.

## Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 7+
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd personal-dashboard
npm run install:all
```

2. **Setup Environment Variables**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your values
```

3. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or use local MongoDB installation
mongod
```

4. **Run Development Servers**
```bash
# From root directory
npm run dev

# Or separately
npm run dev:backend  # Backend on port 5000
npm run dev:frontend # Frontend on port 5173
```

## Project Architecture

### Backend Architecture

```
backend/src/
├── config/          # Configuration and database setup
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Helper functions
├── app.ts           # Express application setup
└── server.ts        # Server entry point
```

**Flow**: Route → Middleware → Controller → Service → Model

### Frontend Architecture

```
frontend/src/
├── components/      # React components
│   ├── ui/         # Reusable UI components
│   └── ...         # Feature components
├── context/        # React Context providers
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── pages/          # Page components
├── services/       # API service layer
├── types/          # TypeScript interfaces
├── App.tsx         # Main app component
├── main.tsx        # Entry point
└── index.css       # Global styles
```

**Flow**: Page → Component → Service → API

## Coding Standards

### TypeScript

```typescript
// Use explicit types
interface User {
  id: string;
  username: string;
  email: string;
}

// Avoid 'any' type
const getUser = async (id: string): Promise<User> => {
  // implementation
};

// Use enums for constants
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
```

### React Components

```typescript
// Use functional components with TypeScript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary' 
}) => {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {children}
    </button>
  );
};
```

### API Routes

```typescript
// Use consistent route structure
router.get('/resource', controller.getAll);
router.get('/resource/:id', controller.getOne);
router.post('/resource', controller.create);
router.put('/resource/:id', controller.update);
router.delete('/resource/:id', controller.delete);
```

### Error Handling

```typescript
// Backend
try {
  const result = await someOperation();
  res.json({ success: true, data: result });
} catch (error) {
  next(error); // Pass to error middleware
}

// Frontend
try {
  const data = await apiService.getData();
  setData(data);
} catch (error) {
  setError('Failed to load data');
  console.error(error);
}
```

## Adding New Features

### Adding a New API Endpoint

1. **Create Model** (if needed)
```typescript
// backend/src/models/NewModel.ts
import mongoose, { Document, Schema } from 'mongoose';

interface INewModel extends Document {
  name: string;
  // ... other fields
}

const newModelSchema = new Schema<INewModel>({
  name: { type: String, required: true },
  // ... other fields
}, { timestamps: true });

export const NewModel = mongoose.model<INewModel>('NewModel', newModelSchema);
```

2. **Create Controller**
```typescript
// backend/src/controllers/newController.ts
import { Request, Response, NextFunction } from 'express';
import { NewModel } from '../models/NewModel';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await NewModel.find();
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};
```

3. **Create Routes**
```typescript
// backend/src/routes/newRoutes.ts
import { Router } from 'express';
import * as controller from '../controllers/newController';
import { authenticate } from '../middleware/auth';

export const newRouter = Router();

newRouter.use(authenticate);
newRouter.get('/', controller.getAll);
```

4. **Register Routes**
```typescript
// backend/src/app.ts
import { newRouter } from './routes/newRoutes';

app.use('/api/new-resource', newRouter);
```

### Adding a New Page

1. **Create Page Component**
```typescript
// frontend/src/pages/NewPage.tsx
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';

export const NewPage: React.FC = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Page</h1>
      {/* Content */}
    </div>
  );
};
```

2. **Add Route**
```typescript
// frontend/src/App.tsx
import { NewPage } from './pages/NewPage';

// Add to Routes
<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <NewPage />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
```

3. **Add to Sidebar**
```typescript
// frontend/src/components/Sidebar.tsx
const navItems = [
  // ... existing items
  { name: 'New Page', path: '/new-page', icon: SomeIcon },
];
```

## Database Operations

### Creating Indexes
```typescript
// In model file
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
```

### Querying
```typescript
// Find with conditions
const users = await User.find({ role: 'admin' });

// Find one
const user = await User.findById(id);

// Find with populate
const token = await ApiToken.findById(id).populate('userId');

// Update
await User.findByIdAndUpdate(id, { name: 'New Name' });

// Delete
await User.findByIdAndDelete(id);
```

## Testing

### Manual Testing with Postman

1. Import `docs/postman-collection.json`
2. Set environment variables
3. Test endpoints sequentially

### Testing API Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

## Debugging

### Backend Debugging

1. **Add Debug Logs**
```typescript
console.log('Debug:', variable);
console.error('Error:', error);
```

2. **Use VS Code Debugger**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/backend/src/server.ts"],
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Frontend Debugging

1. **Browser DevTools**
   - Console for logs
   - Network tab for API calls
   - React DevTools extension

2. **Debug Logs**
```typescript
console.log('Component rendered:', props);
console.error('API Error:', error);
```

## Common Tasks

### Adding a New Dependency

```bash
# Backend
cd backend
npm install package-name
npm install -D @types/package-name

# Frontend
cd frontend
npm install package-name
```

### Database Reset

```bash
# Drop database
mongo
use dashboard
db.dropDatabase()
```

### Rebuild Docker Containers

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Update Environment Variables

```bash
# Edit .env file
nano backend/.env

# Restart services
npm run dev
# or
docker-compose restart
```

## Performance Optimization

### Backend
- Use database indexes
- Implement caching (Redis)
- Optimize queries
- Use pagination
- Compress responses

### Frontend
- Lazy load components
- Memoize expensive computations
- Optimize images
- Code splitting
- Use React.memo for components

## Git Workflow

### Branch Strategy
```bash
main          # Production-ready code
develop       # Development branch
feature/*     # Feature branches
bugfix/*      # Bug fix branches
hotfix/*      # Production hotfixes
```

### Commit Messages
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Example Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
# After review, merge to develop
```

## Code Review Checklist

- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] No console.logs in production code
- [ ] Comments for complex logic
- [ ] No hardcoded values
- [ ] Environment variables used properly
- [ ] API responses are consistent
- [ ] Loading states handled
- [ ] Error messages are user-friendly

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Check connection string
echo $MONGO_URI

# Test connection
mongo mongodb://localhost:27017/dashboard
```

### Port Conflicts
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### TypeScript Errors
```bash
# Clean build
rm -rf dist
npm run build

# Check types
npx tsc --noEmit
```

### Frontend Build Issues
```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## Resources

### Documentation
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [MongoDB](https://docs.mongodb.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

### Tools
- [Postman](https://www.postman.com/)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [VS Code](https://code.visualstudio.com/)

## Getting Help

1. Check existing documentation
2. Review code comments
3. Search for similar issues
4. Ask in team chat
5. Create detailed issue report

---

Happy coding! 🚀
