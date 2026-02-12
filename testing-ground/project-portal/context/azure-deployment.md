# Azure Deployment Guide - Offering Portal

This document provides comprehensive information about Azure deployment routines for the Offering Portal project, including both backend API and frontend (Vite) deployments to production.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend API Deployment](#backend-api-deployment)
3. [Frontend Vite Project Deployment](#frontend-vite-project-deployment)
4. [Production Deployment Process](#production-deployment-process)
5. [Azure Resources](#azure-resources)
6. [Configuration Management](#configuration-management)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Current Infrastructure

The Offering Portal consists of:

- **Backend API**: ASP.NET Core 9.0 API deployed to Azure Container Apps
- **Frontend** (if applicable): Vite-based React/Vue application (to be deployed to Azure Static Web Apps or Container Apps)

### Azure Resources

- **Azure Container Registry (ACR)**: `axis365offeringportalacr`
- **Azure Container Apps**: `axis365offeringportalapi`
- **Azure Storage Account**: `offeringportalstorage`
- **Log Analytics Workspace**: For application logging
- **Azure Container Apps Environment**: Managed environment for container apps

---

## Backend API Deployment

### Prerequisites

1. **Azure CLI** installed and configured
2. **Azure Developer CLI (azd)** installed
3. **Docker** installed (for local builds)
4. **Azure subscription** with appropriate permissions
5. **Azure AD App Registration** configured with required permissions

### Deployment Method: Azure Developer CLI (azd)

The project uses Azure Developer CLI (`azd`) for infrastructure deployment and application deployment.

#### Initial Setup

```bash
# Login to Azure
az login

# Set subscription (if multiple subscriptions)
az account set --subscription "your-subscription-id"

# Initialize Azure Developer CLI (if not already done)
azd init
```

#### Deployment Process

**Using Justfile (Recommended):**
```bash
just deploy
```

**Manual Deployment:**
```bash
# Deploy infrastructure and application
azd deploy

# Or deploy infrastructure only
azd provision

# Or deploy application only (after infrastructure exists)
azd deploy --no-provision
```

### What Happens During Deployment

1. **Infrastructure Provisioning** (via Bicep):
   - Creates/updates Azure Container Registry
   - Creates/updates Container Apps Environment
   - Creates/updates Container App
   - Creates/updates Log Analytics Workspace
   - Configures networking and scaling

2. **Application Build**:
   - Builds Docker image from `Dockerfile`
   - Tags image with `latest`
   - Pushes to Azure Container Registry

3. **Container App Update**:
   - Updates Container App with new image
   - Creates new revision
   - Routes traffic to new revision
   - Scales based on configuration

### Configuration Files

- **`azure.yaml`**: Azure Developer CLI configuration
- **`infra/main.bicep`**: Infrastructure as Code (Bicep template)
- **`infra/main.parameters.json`**: Deployment parameters
- **`Dockerfile`**: Container image build instructions

### Environment Variables

Environment variables are configured in Azure Container App. Key variables:

- `ASPNETCORE_URLS`: `http://+:8080`
- `Graph:TenantId`: Azure AD Tenant ID
- `Graph:ClientId`: Azure AD App Registration Client ID
- `Graph:ClientSecret`: Azure AD App Registration Client Secret
- `SharePoint:DefaultSiteUrl`: SharePoint site URL
- `SharePoint:TermStoreGroupID`: Term Store Group ID
- `AzureStorage:ConnectionString`: Azure Storage connection string

**Note**: Sensitive values should be stored in Azure Key Vault or Container App secrets.

---

## Frontend Vite Project Deployment

### Option 1: Azure Static Web Apps (Recommended for Vite)

Azure Static Web Apps is ideal for Vite projects as it provides:
- Automatic CI/CD integration
- Global CDN distribution
- Built-in authentication
- Custom domains
- Free SSL certificates

#### Setup Steps

1. **Create Static Web App Resource**:
```bash
az staticwebapp create \
  --name offering-portal-frontend \
  --resource-group rg-axis365-offering-portalapi-prod \
  --location northeurope \
  --sku Standard
```

2. **Configure Build Settings**:
   - **App location**: `/` (root of repo or frontend folder)
   - **Api location**: (leave empty for frontend-only)
   - **Output location**: `dist` (Vite default output)

3. **Deploy via GitHub Actions** (if using GitHub):
   - Azure automatically creates GitHub Actions workflow
   - Workflow triggers on push to main branch
   - Builds Vite project and deploys to Static Web Apps

4. **Manual Deployment**:
```bash
# Build Vite project
npm run build

# Deploy to Static Web Apps
az staticwebapp deploy \
  --name offering-portal-frontend \
  --resource-group rg-axis365-offering-portalapi-prod \
  --app-location "." \
  --output-location "dist"
```

#### Environment Variables for Frontend

Configure in Azure Static Web Apps → Configuration → Application settings:

- `VITE_API_BASE_URL`: Backend API URL (e.g., `https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io`)
- `VITE_ENVIRONMENT`: `production`

### Option 2: Azure Container Apps (For SSR or Custom Requirements)

If your Vite project needs server-side rendering or custom server configuration:

1. **Create Dockerfile for Vite**:
```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage (for static hosting)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **Deploy to Container Apps**:
   - Build and push Docker image to ACR
   - Create Container App with same process as backend
   - Configure ingress for external access

### Option 3: Azure Blob Storage + CDN (Simple Static Hosting)

For simple static file hosting:

1. **Upload to Blob Storage**:
```bash
# Build Vite project
npm run build

# Upload to blob storage
az storage blob upload-batch \
  --account-name offeringportalstorage \
  --account-key <storage-key> \
  --destination '$web' \
  --source ./dist
```

2. **Enable Static Website Hosting**:
```bash
az storage blob service-properties update \
  --account-name offeringportalstorage \
  --static-website \
  --404-document index.html \
  --index-document index.html
```

3. **Configure CDN** (optional):
   - Create Azure CDN profile
   - Add endpoint pointing to blob storage static website
   - Configure custom domain

---

## Production Deployment Process

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and merged to main branch
- [ ] Environment variables configured in Azure
- [ ] Secrets stored in Azure Key Vault or Container App secrets
- [ ] Database migrations completed (if applicable)
- [ ] Backend API deployed and tested
- [ ] Frontend built and tested locally
- [ ] API endpoints accessible from frontend

### Deployment Steps

#### 1. Backend API Deployment

```bash
# Navigate to backend directory
cd backend/OfferingPortal.Api

# Deploy using justfile
just deploy

# Or using azd directly
azd deploy
```

**What this does:**
- Builds Docker image
- Pushes to Azure Container Registry
- Updates Container App with new revision
- Health checks and traffic routing

#### 2. Frontend Deployment (Vite)

**If using Azure Static Web Apps:**
```bash
# From frontend directory
npm run build
az staticwebapp deploy \
  --name offering-portal-frontend \
  --resource-group rg-axis365-offering-portalapi-prod \
  --app-location "." \
  --output-location "dist"
```

**If using Container Apps:**
```bash
# Build and push Docker image
az acr build --registry axis365offeringportalacr \
  --image offering-portal-frontend:latest \
  --file Dockerfile .

# Update Container App (via azd or Azure Portal)
```

#### 3. Verify Deployment

```bash
# Check Container App status
az containerapp show \
  --name axis365offeringportalapi \
  --resource-group rg-axis365-offering-portalapi-prod

# Check logs
just logs

# Or manually
az containerapp logs show \
  --name axis365offeringportalapi \
  --resource-group rg-axis365-offering-portalapi-prod \
  --tail 100 \
  --follow
```

### Post-Deployment Verification

1. **Backend API**:
   - ✅ Swagger UI accessible: `https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io/swagger`
   - ✅ Health endpoint: `/health`
   - ✅ API endpoints responding correctly
   - ✅ Term Store endpoint working: `/api/termstore/offering-portal`

2. **Frontend**:
   - ✅ Application loads correctly
   - ✅ API calls to backend working
   - ✅ No console errors
   - ✅ Authentication working (if applicable)

---

## Azure Resources

### Resource Group

**Name**: `rg-axis365-offering-portalapi-prod`  
**Location**: `northeurope`

### Container Registry

- **Name**: `axis365offeringportalacr`
- **SKU**: Basic
- **Login Server**: `axis365offeringportalacr.azurecr.io`
- **Purpose**: Stores Docker images for backend API

### Container App

- **Name**: `axis365offeringportalapi`
- **Environment**: Managed environment (auto-created)
- **URL**: `https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io`
- **Port**: 8080
- **Scaling**: 1-32 replicas (auto-scaling)
- **Resources**: 0.25 CPU, 0.5 Gi memory per replica

### Storage Account

- **Name**: `offeringportalstorage`
- **Purpose**: 
  - Blob storage for PIA structure files
  - Table storage for product metadata
- **Containers**: `pia-config`, `products`

### Log Analytics Workspace

- **Purpose**: Centralized logging for Container Apps
- **Retention**: 30 days
- **Integration**: Automatic with Container Apps

---

## Configuration Management

### Environment-Specific Configuration

#### Development (`appsettings.Development.json`)
- Local development settings
- Debug logging enabled
- Local storage connections

#### Production (Azure Container App Environment Variables)
- Production API endpoints
- Production storage connections
- Secure secrets from Key Vault

### Required Configuration Values

**Backend API (`appsettings.json` or Environment Variables):**

```json
{
  "Graph": {
    "TenantId": "<azure-ad-tenant-id>",
    "ClientId": "<azure-ad-app-client-id>",
    "ClientSecret": "<azure-ad-app-client-secret>"
  },
  "SharePoint": {
    "DefaultSiteUrl": "root",
    "TermStoreGroupID": "<term-store-group-guid>"
  },
  "AzureStorage": {
    "ConnectionString": "<storage-connection-string>",
    "ContainerName": "products"
  }
}
```

**Frontend (Environment Variables):**

```env
VITE_API_BASE_URL=https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io
VITE_ENVIRONMENT=production
```

### Managing Secrets

**Best Practice**: Store secrets in Azure Key Vault and reference them in Container App:

```bash
# Create Key Vault secret
az keyvault secret set \
  --vault-name <key-vault-name> \
  --name "Graph--ClientSecret" \
  --value "<secret-value>"

# Reference in Container App (via Bicep or Portal)
```

---

## Monitoring and Logging

### Viewing Logs

**Using Justfile:**
```bash
just logs
```

**Manual Command:**
```bash
az containerapp logs show \
  --name axis365offeringportalapi \
  --resource-group rg-axis365-offering-portalapi-prod \
  --tail 200 \
  --follow
```

### Log Analytics Queries

Access Log Analytics Workspace in Azure Portal:

```kusto
// Container App logs
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "axis365offeringportalapi"
| order by TimeGenerated desc
| take 100
```

### Application Insights (Optional)

For advanced monitoring, consider adding Application Insights:

1. Create Application Insights resource
2. Add connection string to Container App environment variables
3. Install Application Insights SDK in application

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails - Image Build Error

**Symptoms**: Docker build fails during deployment

**Solutions**:
- Check Dockerfile syntax
- Verify .NET SDK version matches runtime
- Check for missing dependencies in csproj

#### 2. Container App Not Starting

**Symptoms**: Container app shows "Unhealthy" status

**Solutions**:
- Check logs: `just logs`
- Verify port configuration (should be 8080)
- Check environment variables are set correctly
- Verify health endpoint responds: `/health`

#### 3. API Not Accessible

**Symptoms**: 502 Bad Gateway or connection refused

**Solutions**:
- Verify Container App is running: `az containerapp show`
- Check ingress configuration (should be external)
- Verify DNS/CNAME records (if using custom domain)
- Check firewall rules

#### 4. Frontend Can't Connect to Backend

**Symptoms**: CORS errors or API calls failing

**Solutions**:
- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS configuration in backend
- Verify backend API is accessible from internet
- Check browser console for specific errors

#### 5. Term Store API Returns 403

**Symptoms**: "Access denied" errors

**Solutions**:
- Verify `TermStore.Read.All` application permission is granted
- Check admin consent is provided in Azure AD
- Verify app registration has correct permissions
- Check Term Store admin configuration (if using PnP)

### Debugging Commands

```bash
# Check Container App status
az containerapp show \
  --name axis365offeringportalapi \
  --resource-group rg-axis365-offering-portalapi-prod \
  --query "properties.runningStatus"

# List Container App revisions
az containerapp revision list \
  --name axis365offeringportalapi \
  --resource-group rg-axis365-offering-portalapi-prod

# Get Container App environment variables
az containerapp show \
  --name axis365offeringportalapi \
  --resource-group rg-axis365-offering-portalapi-prod \
  --query "properties.template.containers[0].env"

# Check ACR images
az acr repository list --name axis365offeringportalacr
az acr repository show-tags --name axis365offeringportalacr --repository offering-portal-api
```

---

## Deployment Automation

### CI/CD Pipeline (Recommended)

For automated deployments, set up GitHub Actions or Azure DevOps:

**GitHub Actions Example**:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy with Azure Developer CLI
        run: |
          azd deploy
```

### Manual Deployment Workflow

1. **Development**: Make changes locally
2. **Testing**: Run tests (`just test`)
3. **Commit**: Push to feature branch
4. **Review**: Create pull request
5. **Merge**: Merge to main branch
6. **Deploy**: Run `just deploy` or `azd deploy`
7. **Verify**: Check Swagger UI and logs

---

## Making Frontend Available in PROD

### Step-by-Step: Deploy Vite Frontend to Production

#### Prerequisites

1. Vite project built and tested locally
2. Backend API deployed and accessible
3. Azure subscription access

#### Option A: Azure Static Web Apps (Recommended)

1. **Create Static Web App**:
```bash
az staticwebapp create \
  --name offering-portal-frontend-prod \
  --resource-group rg-axis365-offering-portalapi-prod \
  --location northeurope \
  --sku Standard
```

2. **Configure Build Settings**:
   - App location: `frontend/` (or root if frontend is in separate repo)
   - Output location: `dist`
   - Build command: `npm run build`

3. **Set Environment Variables**:
```bash
az staticwebapp appsettings set \
  --name offering-portal-frontend-prod \
  --resource-group rg-axis365-offering-portalapi-prod \
  --setting-names VITE_API_BASE_URL=https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io
```

4. **Deploy**:
   - Via GitHub Actions (automatic on push)
   - Or manually: `az staticwebapp deploy`

5. **Access**: Frontend will be available at:
   - Default: `https://offering-portal-frontend-prod.<region>.azurestaticapps.net`
   - Custom domain: Configure in Azure Portal

#### Option B: Container Apps (For SSR)

1. **Create Dockerfile** (in frontend directory):
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **Build and Push**:
```bash
az acr build --registry axis365offeringportalacr \
  --image offering-portal-frontend:latest \
  --file Dockerfile ./frontend
```

3. **Create Container App** (via Bicep or Portal):
   - Use same Container Apps Environment as backend
   - Configure ingress for external access
   - Set environment variables

4. **Deploy**: Container App will auto-update with new image

---

## Key URLs and Endpoints

### Production URLs

- **Backend API**: `https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io`
- **Swagger UI**: `https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io/swagger`
- **Health Check**: `https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io/health`
- **Term Store API**: `https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io/api/termstore/offering-portal`

### Azure Portal Links

- **Resource Group**: [Azure Portal](https://portal.azure.com/#@/resource/subscriptions/{subscription-id}/resourceGroups/rg-axis365-offering-portalapi-prod)
- **Container App**: [Azure Portal](https://portal.azure.com/#@/resource/subscriptions/{subscription-id}/resourceGroups/rg-axis365-offering-portalapi-prod/providers/Microsoft.App/containerApps/axis365offeringportalapi)
- **Container Registry**: [Azure Portal](https://portal.azure.com/#@/resource/subscriptions/{subscription-id}/resourceGroups/rg-axis365-offering-portalapi-prod/providers/Microsoft.ContainerRegistry/registries/axis365offeringportalacr)

---

## Security Considerations

### Production Security Checklist

- [ ] Secrets stored in Azure Key Vault (not in code)
- [ ] HTTPS enforced (automatic with Container Apps)
- [ ] CORS configured correctly
- [ ] API authentication/authorization implemented
- [ ] Container App uses Managed Identity where possible
- [ ] Network security rules configured (if using VNet)
- [ ] Regular security updates applied
- [ ] Logging excludes sensitive data

### Best Practices

1. **Never commit secrets** to repository
2. **Use Managed Identity** for Azure resource access
3. **Enable diagnostic logging** for security auditing
4. **Regularly rotate** client secrets and keys
5. **Monitor** for suspicious activity
6. **Keep dependencies** up to date

---

## Cost Optimization

### Current Resource Costs

- **Container Apps**: Pay per use (CPU/memory per second)
- **Container Registry**: Basic tier (~$5/month)
- **Storage Account**: Pay per GB stored
- **Log Analytics**: Pay per GB ingested

### Optimization Tips

1. **Right-size Container App**: Adjust CPU/memory based on actual usage
2. **Configure Auto-scaling**: Scale down during low traffic
3. **Use Log Analytics Retention**: Set appropriate retention period
4. **Optimize Docker Images**: Use multi-stage builds, smaller base images
5. **CDN for Static Assets**: Use Azure CDN for frontend assets

---

## Rollback Procedures

### Rollback Container App

If deployment causes issues:

```bash
# List revisions
az containerapp revision list \
  --name axis365offeringportalapi \
  --resource-group rg-axis365-offering-portalapi-prod

# Activate previous revision
az containerapp revision activate \
  --name axis365offeringportalapi \
  --resource-group rg-axis365-offering-portalapi-prod \
  --revision <previous-revision-name>
```

### Emergency Procedures

1. **Immediate Rollback**: Activate previous revision
2. **Disable Traffic**: Set revision weight to 0%
3. **Revert Code**: Revert commit and redeploy
4. **Contact**: Notify team and stakeholders

---

## Additional Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Developer CLI Documentation](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Bicep Documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)

---

## Support and Contacts

For deployment issues or questions:
- Check logs: `just logs`
- Review Azure Portal diagnostics
- Contact DevOps team
- Create issue in repository

---

**Last Updated**: February 2025  
**Maintained By**: DevOps Team
