# Personal Dashboard

A professional full-stack dashboard application for monitoring n8n workflows, portfolio analytics, and managing API tokens.

## 🚀 Features

### Dashboard UI
- **Overview Page**: Summary cards showing total workflow runs, portfolio visits, and connected apps
- **n8n Stats Page**: 
  - Connect to n8n API with personal token
  - Display workflow statistics with pie charts
  - View last 10 workflow runs with status and duration
- **Portfolio Stats Page**:
  - Visitor analytics with bar charts (last 7 days)
  - Most viewed projects ranking
- **API Management Page**:
  - Generate API tokens for third-party apps
  - Token scopes: read, write, admin
  - Revoke tokens with one click
- **Settings Page**: Profile management and dark/light mode toggle

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **Authentication**: JWT-based with role management
- **UI Components**: Custom shadcn-inspired components
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 7+
- Docker and Docker Compose (optional)

## 🛠️ Installation

### Option 1: Local Development

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/dashboard
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
N8N_API_KEY=your-n8n-api-key
N8N_BASE_URL=http://localhost:5678/api/v1
PORTFOLIO_BASE_URL=http://localhost:3001/api
```

5. Start MongoDB (if not using Docker):
```bash
# Using MongoDB service
mongod
```

6. Run the backend:
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env`:
```env
VITE_API_URL=http://localhost:5000
```

5. Run the frontend:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Option 2: Docker Compose

1. Create `.env` file in the root directory:
```bash
cp backend/.env.example .env
```

2. Update the `.env` file with your configuration

3. Build and start all services:
```bash
docker-compose up -d
```

4. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - MongoDB: `localhost:27017`

5. Stop the services:
```bash
docker-compose down
```

## 🔐 First Time Setup

1. Register a new account at `/register`
2. Login with your credentials
3. Configure your n8n API key and Portfolio API URL in the backend `.env` file
4. Navigate to API Management to create tokens for third-party apps

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### API Tokens
- `GET /api/tokens` - Get all tokens
- `POST /api/tokens` - Create new token
- `GET /api/tokens/:id` - Get token by ID
- `DELETE /api/tokens/:id` - Revoke token

### Statistics
- `GET /api/stats/n8n` - Get n8n workflow statistics
- `GET /api/stats/portfolio` - Get portfolio visitor statistics

### Admin
- `GET /api/admin/stats` - Get admin dashboard statistics

## 🔑 API Token Usage

To use the API tokens with third-party applications:

1. Create a token in the API Management page
2. Copy the token (it will only be shown once)
3. Include it in your requests:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/stats/n8n
```

## 🎨 Customization

### Theme
The dashboard supports dark and light modes. Toggle between them in the Settings page.

### Colors
Modify the color scheme in `frontend/src/index.css` by updating the CSS variables.

## 📁 Project Structure

```
personal-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Server entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatCard.tsx
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the `MONGO_URI` in your `.env` file
- Verify network connectivity

### n8n API Connection
- Verify your n8n instance is accessible
- Check the `N8N_API_KEY` and `N8N_BASE_URL` in `.env`
- Ensure the API key has proper permissions

### CORS Issues
- The backend is configured to allow CORS
- Update the CORS settings in `backend/src/app.ts` if needed

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.
