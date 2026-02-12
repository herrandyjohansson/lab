#!/bin/bash

# Development Frontend Deployment Script
# This script helps deploy the frontend to Azure Static Web Apps

set -e

# Configuration - Update these values as needed
RESOURCE_GROUP="rg-axis365-offering-portalapi-prod"
APP_NAME="offering-portal-frontend-dev"
# Note: Static Web Apps only supports: westus2, centralus, eastus2, westeurope, eastasia
# Using westeurope as closest to northeurope backend
LOCATION="westeurope"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Development Frontend Deployment ===${NC}\n"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Static Web Apps extension is installed
if ! az extension list --query "[?name=='staticwebapp'].name" -o tsv | grep -q "staticwebapp"; then
    echo -e "${YELLOW}Installing Azure Static Web Apps extension...${NC}"
    az extension add --name staticwebapp
fi

# Check if logged in to Azure
echo -e "${YELLOW}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Please log in...${NC}"
    az login
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}Using subscription: ${SUBSCRIPTION}${NC}\n"

# Check if Static Web App exists
echo -e "${YELLOW}Checking if Static Web App exists...${NC}"
if az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}Static Web App '$APP_NAME' already exists.${NC}"
    SKIP_CREATE=true
else
    echo -e "${YELLOW}Static Web App '$APP_NAME' does not exist. Creating...${NC}"
    SKIP_CREATE=false
fi

# Create Static Web App if it doesn't exist
if [ "$SKIP_CREATE" = false ]; then
    echo -e "${YELLOW}Creating Static Web App...${NC}"
    az staticwebapp create \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Free
    
    echo -e "${GREEN}Static Web App created successfully!${NC}\n"
fi

# Configure build settings
echo -e "${YELLOW}Configuring build settings...${NC}"
az staticwebapp appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names \
        "BUILD_COMMAND=npm run build" \
        "APP_LOCATION=/" \
        "OUTPUT_LOCATION=dist" \
    &> /dev/null || true

echo -e "${GREEN}Build settings configured.${NC}\n"

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed. 'dist' directory not found.${NC}"
    exit 1
fi

echo -e "${GREEN}Build completed successfully!${NC}\n"

# Check if SWA CLI is installed
if ! command -v swa &> /dev/null; then
    echo -e "${YELLOW}Installing Azure Static Web Apps CLI...${NC}"
    npm install -g @azure/static-web-apps-cli
fi

# Get deployment token
echo -e "${YELLOW}Getting deployment token...${NC}"
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" -o tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo -e "${RED}Error: Could not retrieve deployment token.${NC}"
    exit 1
fi

# Deploy using SWA CLI
echo -e "${YELLOW}Deploying to Azure Static Web Apps...${NC}"
swa deploy ./dist \
    --deployment-token "$DEPLOYMENT_TOKEN" \
    --env production

echo -e "\n${GREEN}=== Deployment Complete! ===${NC}\n"

# Get the app URL
APP_URL=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv)

echo -e "${GREEN}Your application is available at:${NC}"
echo -e "${GREEN}https://${APP_URL}${NC}\n"

echo -e "${YELLOW}Note: It may take a few minutes for the deployment to be fully available.${NC}"
echo -e "${YELLOW}You can check deployment status in Azure Portal.${NC}\n"
