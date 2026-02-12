# Development Frontend Deployment Guide

This guide explains how to deploy the frontend to Azure Static Web Apps for temporary development hosting.

## Prerequisites

1. Azure CLI installed and configured
2. Azure Static Web Apps extension installed (`az extension add --name staticwebapp`)
3. Azure Static Web Apps CLI installed (`npm install -g @azure/static-web-apps-cli`) - will be auto-installed by scripts
4. Azure subscription access
5. Node.js and npm installed
6. Project dependencies installed (`npm install`)
7. Just installed (optional, for using justfile commands: `brew install just` or see [just installation](https://github.com/casey/just#installation))

No application environment variables are required for basic deployment.

## Deployment Steps

### Quick Start (Using Justfile)

If you have `just` installed, you can deploy with a single command:

```bash
just deploy-dev
```

For other justfile commands:
```bash
just get-url    # Get the frontend URL
just build      # Build locally
just dev        # Run dev server
```

### Manual Deployment Steps

### Step 1: Create Azure Static Web App Resource

```bash
# Set variables (adjust as needed)
RESOURCE_GROUP="rg-axis365-offering-portalapi-prod"
APP_NAME="offering-portal-frontend-dev"
# Note: Static Web Apps only supports: westus2, centralus, eastus2, westeurope, eastasia
# Using westeurope as closest to northeurope backend
LOCATION="westeurope"

# Create Static Web App (Free tier)
az staticwebapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Free
```

**Note**: The Free tier is sufficient for development purposes and provides:
- 100 GB bandwidth per month
- Custom domains
- SSL certificates
- Up to 2 staging environments

### Step 2: Configure Build Settings

After creating the Static Web App, configure the build settings:

**Via Azure Portal:**
1. Navigate to your Static Web App resource
2. Go to **Configuration** → **Build configuration**
3. Set the following:
   - **App location**: `/` (root of repository)
   - **Api location**: (leave empty)
   - **Output location**: `dist`
   - **Build command**: `npm run build`

**Via Azure CLI:**
```bash
az staticwebapp appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --setting-names \
    "BUILD_COMMAND=npm run build" \
    "APP_LOCATION=/" \
    "OUTPUT_LOCATION=dist"
```

### Step 3: Build and Deploy

#### Option A: Manual Deployment (Quick Start)

```bash
# Build the project
npm run build

# Install SWA CLI if not already installed
npm install -g @azure/static-web-apps-cli

# Get deployment token and deploy
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)
swa deploy ./dist --deployment-token "$DEPLOYMENT_TOKEN" --env production
```

#### Option B: Using Deployment Token

1. Get your deployment token:
```bash
az staticwebapp secrets list \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.apiKey" -o tsv
```

2. Build and deploy:
```bash
# Install SWA CLI if not already installed
npm install -g @azure/static-web-apps-cli

# Build
npm run build

# Deploy (replace <DEPLOYMENT_TOKEN> with token from step 1)
swa deploy ./dist --deployment-token "<DEPLOYMENT_TOKEN>" --env production
```

### Step 4: Access Your Application

After deployment, your app will be available at:
```
https://<app-name>.<region>.azurestaticapps.net
```

For example:
```
https://offering-portal-frontend-dev.westeurope.azurestaticapps.net
```

The first deployment may take a few minutes. You can check the deployment status in Azure Portal.

## Verification

1. **Access the URL**: Navigate to your Static Web App URL
2. **Access Granted**: You should see the main application

## Updating the Deployment

To update the frontend after making changes:

```bash
# Build
npm run build

# Deploy (using the same command as Step 3)
az staticwebapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --app-location "." \
  --output-location "dist" \
  --deployment-token "<DEPLOYMENT_TOKEN>"
```

## Troubleshooting

### Build Fails

- Check that all dependencies are installed: `npm install`
- Verify Node.js version compatibility
- Check build logs in Azure Portal → Static Web App → Deployment history

### CORS Issues with Backend API

- Ensure your backend API has CORS configured to allow requests from your Static Web App domain
- Check browser console for specific CORS error messages

### Environment Variable Not Working

- Vite environment variables must be prefixed with `VITE_` to be exposed to the client
- After setting environment variables in Azure, you must redeploy the application
- Environment variables are embedded at build time, not runtime

## Cleanup

To delete the Static Web App resource:

```bash
az staticwebapp delete \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP"
```

## Additional Resources

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Static Web Apps CLI Reference](https://learn.microsoft.com/en-us/cli/azure/staticwebapp)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
