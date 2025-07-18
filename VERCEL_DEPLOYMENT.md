# Vercel Deployment Guide

## Prerequisites
- Vercel account
- Firebase project configured
- Build completed successfully locally

## Environment Variables Setup

Add these environment variables in your Vercel project settings:

### Firebase Configuration (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://<your-project>-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<your-measurement-id>
```

### Socket/Workflow Server URLs (Update for production)
```
NEXT_PUBLIC_SOCKET_URL=<your-production-socket-server-url>
NEXT_PUBLIC_WORKFLOW_API_URL=<your-production-workflow-api-url>
```

### Optional: Email Service (if using server functions)
```
SENDGRID_API_KEY=<your-sendgrid-api-key>
EMAIL_FROM=noreply@yourdomain.com
```

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (as listed above)
   - Click "Deploy"

3. **Post-Deployment**
   - Update Firebase authorized domains to include your Vercel domain
   - Test all functionalities
   - Set up custom domain if needed

## Important Notes

1. **Firebase Security Rules**: Ensure your Firebase Realtime Database rules are properly configured for production
2. **CORS**: If using separate backend servers, configure CORS for your Vercel domain
3. **Socket Server**: The socket and workflow servers need to be deployed separately (e.g., on Heroku, Railway, or similar)

## Troubleshooting

### Build Errors
- Check all environment variables are set correctly
- Ensure no sensitive files are committed (check .gitignore)

### Authentication Issues
- Add Vercel domain to Firebase authorized domains
- Check NEXT_PUBLIC_ prefix for client-side variables

### Database Connection Issues
- Verify Firebase database URL is correct
- Check Firebase security rules

## Production Checklist
- [ ] All environment variables configured
- [ ] Firebase authorized domains updated
- [ ] Database security rules reviewed
- [ ] Socket/workflow servers deployed
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Performance optimizations enabled