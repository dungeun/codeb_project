# Backend Servers Deployment Guide

This project includes separate backend servers that need to be deployed independently from the Next.js frontend.

## Server Components

1. **Socket Server** (`server/socket-server.js`)
   - Handles real-time communication
   - Default port: 3003

2. **Workflow Server** (`server/workflow-server.js`)
   - Manages workflow automation
   - Default port: 3004

3. **Email Service** (`server/email-service.js`)
   - Handles email notifications
   - Used by other servers

4. **Push Notification Service** (`server/push-notification-service.js`)
   - Manages push notifications
   - Used by other servers

## Deployment Options

### Option 1: Heroku

```bash
# Create a new Heroku app for servers
heroku create your-app-servers

# Add buildpacks
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_DATABASE_URL=your-database-url
# Add all other required env vars

# Deploy
git push heroku main
```

### Option 2: Railway

1. Create new project on [railway.app](https://railway.app)
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Option 3: DigitalOcean App Platform

1. Create new app
2. Choose GitHub repository
3. Configure environment variables
4. Set build command: `npm install`
5. Set run command: `node server/server-manager.js`

### Option 4: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server
COPY .env.production .env

EXPOSE 3003 3004

CMD ["node", "server/server-manager.js"]
```

## Environment Variables for Servers

```env
# Firebase Admin
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Ports
SOCKET_PORT=3003
WORKFLOW_PORT=3004

# Email Service
SENDGRID_API_KEY=your-key
EMAIL_FROM=noreply@yourdomain.com

# CORS (Important!)
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://yourdomain.com
```

## Server Manager

The `server-manager.js` file runs both socket and workflow servers. You can:
- Deploy it as a single process (recommended for small apps)
- Deploy servers separately for better scaling

## CORS Configuration

Update CORS settings in each server file:
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
```

## Health Checks

Each server exposes health check endpoints:
- Socket Server: `http://your-server:3003/health`
- Workflow Server: `http://your-server:3004/health`

## Post-Deployment

1. Update frontend environment variables:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.com
   NEXT_PUBLIC_WORKFLOW_API_URL=https://your-workflow-server.com
   ```

2. Test connectivity from frontend
3. Monitor server logs
4. Set up uptime monitoring

## Troubleshooting

### Connection Issues
- Check CORS configuration
- Verify environment variables
- Check firewall/security group settings

### Performance Issues
- Consider separating servers
- Add Redis for session management
- Implement connection pooling

### Scaling
- Use PM2 for process management
- Implement load balancing
- Consider microservices architecture