# Deployment Checklist

## Pre-Deployment

### Code Preparation ✅
- [x] All TypeScript errors resolved
- [x] Build completes successfully (`npm run build`)
- [x] Vercel configuration added (`vercel.json`)
- [x] Environment variables documented

### Files to Update
1. **Update Firebase Configuration**
   - Copy your Firebase config from Firebase Console
   - Ensure all NEXT_PUBLIC_FIREBASE_* variables are correct

2. **Update Server URLs**
   - `NEXT_PUBLIC_SOCKET_URL`: Your production socket server URL
   - `NEXT_PUBLIC_WORKFLOW_API_URL`: Your production workflow API URL

## Deployment Steps

1. **Deploy Backend Servers First**
   - Deploy socket server (`server/socket-server.js`)
   - Deploy workflow server (`server/workflow-server.js`)
   - Note their production URLs

2. **Configure Firebase**
   ```bash
   # Run setup scripts if needed
   npm run seed
   npm run setup-ai-metrics
   ```

3. **Deploy to Vercel**
   ```bash
   # If using Vercel CLI
   vercel --prod
   
   # Or push to GitHub and auto-deploy
   git push origin main
   ```

## Post-Deployment Verification

- [ ] Authentication works (login/logout)
- [ ] Real-time features work (chat, notifications)
- [ ] File uploads work
- [ ] Database read/write operations work
- [ ] Email notifications sent (if configured)

## Security Checklist

- [ ] Firebase security rules reviewed and tightened
- [ ] Environment variables properly secured
- [ ] No sensitive data in client-side code
- [ ] CORS configured for production domains only

## Performance Optimization

- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Database indexes created for common queries
- [ ] CDN configured (if applicable)

## Monitoring Setup

- [ ] Error tracking configured (e.g., Sentry)
- [ ] Analytics configured
- [ ] Uptime monitoring for backend servers

## Final Steps

1. **Update Documentation**
   - Update README with production URL
   - Document any production-specific configurations

2. **Team Communication**
   - Notify team of deployment
   - Share access credentials securely
   - Document known issues or limitations