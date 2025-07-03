# GitHub Actions Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Missing GitHub Secrets

**Problem**: Deployment fails with "Missing Render deployment secrets" error.

**Solution**: Add the following secrets to your GitHub repository:
- Go to your repository → Settings → Secrets and variables → Actions
- Add these secrets:
  - `RENDER_TOKEN`: Your Render API token
  - `RENDER_BACKEND_SERVICE_ID`: Your backend service ID from Render
  - `RENDER_FRONTEND_SERVICE_ID`: Your frontend service ID from Render
  - `API_FOOTBALL_KEY`: Your API-Football API key
  - `SUPABASE_URL`: Your Supabase project URL
  - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 2. Node Version Mismatch

**Problem**: Build fails due to Node version incompatibility.

**Solution**: 
- Backend uses Node 18
- Frontend uses Node 20
- The workflow has been updated to use the correct versions

### 3. Missing Dependencies

**Problem**: Build fails with missing dependencies.

**Solution**: 
- Run `npm install` in both `backend/` and `frontend/` directories
- Ensure `package-lock.json` files are committed to the repository
- Check that all required dependencies are listed in `package.json`

### 4. Test Failures

**Problem**: Tests fail because no test files exist.

**Solution**: 
- Basic test file has been added at `backend/src/__tests__/basic.test.ts`
- Jest configuration added at `backend/jest.config.js`
- Required Jest dependencies added to `backend/package.json`

### 5. Build Script Issues

**Problem**: Build script fails.

**Solution**: 
- Backend: `npm run build` compiles TypeScript to JavaScript
- Frontend: `npm run build` creates production build with Vite
- Ensure TypeScript configuration is correct in `tsconfig.json`

### 6. Environment Variables

**Problem**: Scripts fail due to missing environment variables.

**Solution**: 
- Check that all required environment variables are set in GitHub Secrets
- Verify the variable names match exactly (case-sensitive)
- Test locally with `.env` file before deploying

### 7. Render API Issues

**Problem**: Render deployment fails.

**Solution**: 
- Verify Render service IDs are correct
- Check that Render token has proper permissions
- Ensure services are active in Render dashboard
- Check Render service logs for specific errors

### 8. Rate Limiting

**Problem**: API calls fail due to rate limits.

**Solution**: 
- The workflow includes delays between API calls
- Consider upgrading API-Football plan if hitting limits
- Implement exponential backoff for failed requests

## Debugging Steps

### 1. Check Workflow Logs
- Go to Actions tab in GitHub repository
- Click on the failed workflow run
- Check each job's logs for specific error messages

### 2. Test Locally
```bash
# Backend
cd backend
npm install
npm run build
npm test

# Frontend
cd frontend
npm install
npm run build
```

### 3. Verify Secrets
```bash
# Test Render API connection
curl -H "Authorization: Bearer YOUR_RENDER_TOKEN" \
     https://api.render.com/v1/services/YOUR_SERVICE_ID
```

### 4. Check Dependencies
```bash
# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit
```

## Workflow Structure

The deployment workflow consists of 4 jobs:

1. **deploy-backend**: Builds and deploys the Node.js API
2. **deploy-frontend**: Builds and deploys the React frontend
3. **update-data**: Updates football data and generates predictions (scheduled)
4. **test**: Runs backend tests

## Manual Deployment

If GitHub Actions continues to fail, you can deploy manually:

1. **Backend**: Push to Render via Git integration
2. **Frontend**: Push to Render via Git integration
3. **Data Updates**: Run scripts manually on Render or locally

## Support

If issues persist:
1. Check Render service logs
2. Verify all environment variables are set
3. Test API endpoints manually
4. Check database connectivity
5. Review API rate limits and quotas 