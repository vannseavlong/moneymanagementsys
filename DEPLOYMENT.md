# MMMS Deployment Guide

This guide covers deploying the MMMS application to production environments.

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+
- npm 8+
- Google Cloud Platform account
- Telegram Bot Token (optional)

### Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd NewMMMS
npm install
```

2. **Environment Configuration**

Backend environment (`apps/backend/.env`):
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

3. **Google Cloud Setup**
- Create project in [Google Cloud Console](https://console.cloud.google.com/)
- Enable APIs:
  - Google Sheets API
  - Google Drive API
  - Google OAuth2 API
- Create OAuth 2.0 credentials
- Add authorized redirect URIs:
  - Development: `http://localhost:3001/api/auth/google/callback`
  - Production: `https://yourdomain.com/api/auth/google/callback`

4. **Start Development**
```bash
npm run dev
```

## 🌐 Production Deployment

### Option 1: Traditional Server (VPS/Dedicated)

1. **Build the application**
```bash
npm run build
```

2. **Install PM2 for process management**
```bash
npm install -g pm2
```

3. **Start backend with PM2**
```bash
cd apps/backend
pm2 start npm --name "mmms-backend" -- start
```

4. **Serve frontend with nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Serve frontend
    location / {
        root /path/to/NewMMMS/apps/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 2: Docker Deployment

1. **Create Docker files**

Backend Dockerfile (`apps/backend/Dockerfile`):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

Frontend Dockerfile (`apps/frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

2. **Docker Compose**
```yaml
version: '3.8'
services:
  frontend:
    build: ./apps/frontend
    ports:
      - "80:80"
    depends_on:
      - backend
  
  backend:
    build: ./apps/backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
```

### Option 3: Cloud Platforms

#### Vercel (Frontend) + Railway/Render (Backend)

**Frontend on Vercel:**
1. Connect GitHub repository to Vercel
2. Set build directory to `apps/frontend`
3. Set environment variables in Vercel dashboard

**Backend on Railway:**
1. Connect GitHub repository to Railway
2. Set root directory to `apps/backend`
3. Set environment variables in Railway dashboard

#### Heroku

1. **Create Heroku apps**
```bash
heroku create mmms-backend
heroku create mmms-frontend
```

2. **Deploy backend**
```bash
git subtree push --prefix apps/backend heroku main
```

3. **Deploy frontend**
```bash
git subtree push --prefix apps/frontend heroku main
```

## 🔐 Production Environment Variables

### Backend
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
TELEGRAM_BOT_TOKEN=your_bot_token
```

### Frontend
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 🛡️ Security Checklist

- [ ] Use HTTPS in production
- [ ] Update CORS origins to production URLs
- [ ] Set secure environment variables
- [ ] Enable rate limiting
- [ ] Use process managers (PM2)
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules
- [ ] Regular security updates

## 📊 Monitoring

### Health Checks
- Frontend: `https://yourdomain.com`
- Backend: `https://api.yourdomain.com/health`

### Logging
- Backend logs: Use PM2 logs or cloud platform logs
- Frontend: Browser console and error tracking services
- Google API: Monitor usage in Google Cloud Console

## 🔄 CI/CD Pipeline Example (GitHub Actions)

```yaml
name: Deploy MMMS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build applications
        run: npm run build
      
      - name: Deploy to production
        run: |
          # Add your deployment commands here
```

## 📝 Maintenance

### Regular Tasks
- Monitor application performance
- Update dependencies
- Review Google API usage
- Check error logs
- Backup user data (handled by Google)

### Scaling
- Use load balancers for high traffic
- Implement caching strategies
- Monitor database (Google Sheets) limits
- Consider CDN for static assets

## 🆘 Troubleshooting

### Common Issues

1. **Google OAuth Errors**
   - Check redirect URIs match exactly
   - Verify API credentials
   - Check API quotas

2. **Telegram Integration Issues**
   - Verify bot token
   - Check bot permissions
   - Validate chat IDs

3. **CORS Errors**
   - Update backend CORS configuration
   - Verify frontend URL settings

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors