# Quick Start Guide

Get your Personal Dashboard up and running in 5 minutes!

## 🚀 Quick Setup with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Steps

1. **Clone or navigate to the project directory**
```bash
cd personal-dashboard
```

2. **Create environment file**
```bash
cp .env.example .env
```

3. **Edit the .env file** with your API keys:
```env
JWT_SECRET=your-random-secret-key-here
N8N_API_KEY=your-n8n-api-key
N8N_BASE_URL=http://your-n8n-instance:5678/api/v1
PORTFOLIO_BASE_URL=http://your-portfolio-api:3001/api
```

4. **Start all services**
```bash
docker-compose up -d
```

5. **Access the application**
- Open your browser and go to: `http://localhost:3000`
- Register a new account
- Start exploring your dashboard!

### Stopping the Services
```bash
docker-compose down
```

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 7+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Update .env with your settings**

5. **Start MongoDB** (if not running)
```bash
mongod
```

6. **Run the backend**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Open a new terminal and navigate to frontend**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Run the frontend**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🎯 First Steps After Installation

1. **Register an Account**
   - Go to `/register`
   - Create your admin account

2. **Explore the Dashboard**
   - Overview: See summary of all your stats
   - n8n Stats: View workflow execution data
   - Portfolio Stats: Track visitor analytics
   - API Management: Create tokens for third-party apps
   - Settings: Customize your preferences

3. **Create an API Token**
   - Navigate to API Management
   - Click "Create Token"
   - Choose scopes and expiration
   - Copy and save the token securely

4. **Test the API**
   - Import the Postman collection from `docs/postman-collection.json`
   - Update the token variable
   - Test the endpoints

## 🔧 Configuration

### n8n Integration
To connect your n8n instance:
1. Get your n8n API key from n8n settings
2. Update `N8N_API_KEY` and `N8N_BASE_URL` in `.env`
3. Restart the backend

### Portfolio Integration
To connect your portfolio API:
1. Ensure your portfolio has `/api/visitors` and `/api/projects` endpoints
2. Update `PORTFOLIO_BASE_URL` in `.env`
3. Restart the backend

## 📊 Default Ports

- Frontend: `3000` (Docker) or `5173` (Dev)
- Backend: `5000`
- MongoDB: `27017`

## ❓ Troubleshooting

### Port Already in Use
If ports are already in use, update them in:
- `docker-compose.yml` for Docker setup
- `.env` files for local development

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check the `MONGO_URI` in backend `.env`
- For Docker: MongoDB starts automatically

### API Connection Issues
- Verify backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Ensure no CORS issues in browser console

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Import the Postman collection for API testing
- Customize the theme in Settings
- Set up your n8n and portfolio integrations

## 🆘 Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review the API endpoints in the Postman collection
- Open an issue on GitHub

Happy dashboarding! 🎉
