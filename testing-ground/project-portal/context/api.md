# Offering Portal API Documentation

## Overview

The Offering Portal API provides endpoints for managing product metadata, fetching product information from the PIA API, and user management. The API is built with ASP.NET Core and follows RESTful conventions.

## Recent Changes

### API Response Structure Improvements (Latest Update)

The hierarchy endpoint (`GET /api/pia/products/hierarchy`) has been refactored to improve code structure, maintainability, and alignment with React best practices. The following changes have been made:

**Code Structure Improvements:**
- Extracted tree building logic into dedicated services (`ICategoryTreeBuilder`, `ISeriesGroupingService`)
- Separated concerns: data fetching, transformation, and tree construction
- Improved code organization and testability

**Response Structure Improvements:**
- Added new descriptive field names for better clarity and self-documentation
- Added `nodeType` field for type-safe node discrimination in React/TypeScript
- Added `path` array for breadcrumb navigation
- Added `meta` object with response metadata (totals, timing, version)
- Normalized empty collections (omitted when empty to reduce payload size)
- Maintained backward compatibility with legacy field names

**Migration:**
- Legacy fields are still supported but marked as deprecated
- New implementations should use the improved field names
- See the "Important Changes" section in the hierarchy endpoint documentation for details

## Base URL

All endpoints are prefixed with `/api`. The base URL structure is:
```
/api/{controller}/{action}
```

## Authentication

The API uses authentication for certain endpoints. The `createdBy` field in metadata operations is automatically extracted from the authenticated user's identity (email or preferred_username).

## Endpoints

### PIA Controller (`/api/pia`)

The PIA controller provides access to product data from the PIA API.

#### 1. Get Raw Products

Retrieves raw product data from the PIA API as JSON.

**Endpoint:** `GET /api/pia/products`

**Response:**
- **200 OK**: Raw JSON string from PIA API
- **502 Bad Gateway**: HTTP request error
- **504 Gateway Timeout**: Request timed out
- **500 Internal Server Error**: Unexpected error

**Example Request:**
```http
GET /api/pia/products
```

**Example Response:**
```json
"[{\"id\": 1, \"name\": \"Product Name\", ...}]"
```

---

#### 2. Get Products Hierarchy

Gets products organized in a hierarchical tree structure matching `pia-category-structure.json`. This endpoint returns a tree structure designed for frontend navigation components where users can traverse categories to find products.

**Endpoint:** `GET /api/pia/products/hierarchy`

**Response Type:** `CategoryTreeResponseDto`

**Response Codes:**
- **200 OK**: Successfully retrieved hierarchy
- **502 Bad Gateway**: HTTP request error
- **504 Gateway Timeout**: Request timed out
- **500 Internal Server Error**: Unexpected error

**Example Request:**
```http
GET /api/pia/products/hierarchy
```

**Example Response:**
```json
{
  "categories": [
    {
      "nodeId": "Network Cameras",
      "displayName": "Network Cameras",
      "nodeType": "Category",
      "productCount": 150,
      "path": ["Network Cameras"],
      "subNodes": [
        {
          "nodeId": "Network Cameras|Fixed Cameras",
          "displayName": "Fixed Cameras",
          "nodeType": "Subcategory",
          "productCount": 75,
          "path": ["Network Cameras", "Fixed Cameras"],
          "subNodes": [
            {
              "nodeId": "Network Cameras|Fixed Cameras|200",
              "displayName": "200",
              "nodeType": "Series",
              "productCount": 25,
              "path": ["Network Cameras", "Fixed Cameras", "200"],
              "products": [
                {
                  "productId": 123,
                  "productName": "AXIS 206W",
                  "productUrl": "https://example.com/product/123",
                  "category": "Network Cameras",
                  "categories": "[\"fixed\"]",
                  "seriesName": "200",
                  "metadata": null
                }
              ]
            },
            {
              "nodeId": "Network Cameras|Fixed Cameras|300",
              "displayName": "300",
              "nodeType": "Series",
              "productCount": 50,
              "path": ["Network Cameras", "Fixed Cameras", "300"],
              "products": []
            }
          ]
        }
      ]
    }
  ],
  "meta": {
    "totalProducts": 150,
    "totalCategories": 1,
    "fetchTimeMs": 123.45,
    "timestamp": "2024-01-01T12:00:00Z",
    "apiVersion": "1.0"
  },
  "structure": [
    {
      "id": "Network Cameras",
      "name": "Network Cameras",
      "children": [...],
      "items": [],
      "count": 150
    }
  ],
  "timeToFetchData": 123.45
}
```

**Important Changes:**

The API response now includes both **new improved fields** and **legacy fields** for backward compatibility:

**New Fields (Recommended):**
- `categories` - Array of category nodes (replaces `structure`)
- `meta` - Response metadata object containing:
  - `totalProducts` - Total number of products across all categories
  - `totalCategories` - Total number of main categories
  - `fetchTimeMs` - Time taken to fetch data in milliseconds
  - `timestamp` - Response timestamp in ISO 8601 format
  - `apiVersion` - API version number
- `nodeId` - Node identifier (replaces `id`)
- `displayName` - Display name for the node (replaces `name`)
- `nodeType` - Type of node: `"Category"`, `"Subcategory"`, or `"Series"` (NEW - enables type-safe React components)
- `subNodes` - Child nodes array (replaces `children`)
- `products` - Products array (replaces `items`)
- `productCount` - Count of products (replaces `count`)
- `path` - Breadcrumb path array for navigation (NEW)
- `productId` - Product identifier (replaces `id` in products)
- `productName` - Product name (replaces `name` in products)
- `productUrl` - Product URL (replaces `url` in products)
- `seriesName` - Series name (replaces `series` in products)
- `categories` - Categories string (replaces `officialCategories` in products)

**Legacy Fields (Deprecated):**
- `structure` - Use `categories` instead
- `timeToFetchData` - Use `meta.fetchTimeMs` instead
- `id` - Use `nodeId` instead
- `name` - Use `displayName` instead
- `children` - Use `subNodes` instead
- `items` - Use `products` instead
- `count` - Use `productCount` instead
- `id` (in products) - Use `productId` instead
- `name` (in products) - Use `productName` instead
- `url` (in products) - Use `productUrl` instead
- `series` (in products) - Use `seriesName` instead
- `officialCategories` (in products) - Use `categories` instead

**Migration Guide:**

1. **For new implementations:** Use the new field names (`categories`, `nodeId`, `displayName`, etc.)
2. **For existing implementations:** Legacy fields will continue to work but are marked as deprecated
3. **Type discrimination:** Use `nodeType` field to determine node type instead of checking structure:
   ```typescript
   if (node.nodeType === 'Series') {
     // Handle series node
   }
   ```
4. **Empty collections:** Empty arrays (`subNodes`, `products`) are omitted from the response (null/undefined) to reduce payload size
5. **Path navigation:** Use the `path` array for breadcrumb navigation instead of parsing `nodeId`

**Frontend Display Guidelines:**

The hierarchy follows a three-level structure that should be rendered as a nested tree:

1. **Main Category** (top level)
   - Display as expandable/collapsible nodes
   - Shows total count of all products in the category (`productCount`)
   - Has `subNodes` array containing subcategories
   - `nodeType` is `"Category"`
   - Use `path` array for breadcrumb navigation

2. **Subcategory** (middle level)
   - Display as expandable/collapsible nodes nested under main categories
   - Shows total count of all products in the subcategory (`productCount`)
   - Has `subNodes` array containing series groups
   - `products` array is empty or omitted (products are at the series level)
   - `nodeType` is `"Subcategory"`

3. **Series** (leaf level with products)
   - Display as expandable/collapsible nodes nested under subcategories
   - Shows count of products in that series (`productCount`)
   - Has `products` array containing the actual products
   - `subNodes` is `null` or omitted (series is the leaf level)
   - `nodeType` is `"Series"`
   - Series name is the value from the product's `seriesName` property (e.g., "200", "300")
   - Products without a series are grouped under series name "Uncategorized"

**Identifying Node Types (Recommended Approach):**
Use the `nodeType` field for type-safe node identification:
```typescript
switch (node.nodeType) {
  case 'Category':
    // Render category node
    break;
  case 'Subcategory':
    // Render subcategory node
    break;
  case 'Series':
    // Render series node with products
    break;
}
```

**Legacy Approach (Deprecated):**
- If `subNodes` is not null and `products` is empty → Main Category or Subcategory node
- If `subNodes` is null and `products` has items → Series node (leaf level)
- If `subNodes` is null and `products` is empty → Empty series group (can be hidden)

**Recommended UI Structure:**
```
📁 Network Cameras (productCount: 150)
  📁 Fixed Cameras (productCount: 75)
    📁 Series "200" (productCount: 25)
      • AXIS 206W
      • AXIS 207W
      ...
    📁 Series "300" (productCount: 50)
      • AXIS 305
      • AXIS 306
      ...
    📁 Uncategorized (productCount: 0) [optional: hide if empty]
```

**Implementation Notes:**
- **Type Safety:** Use `nodeType` field for type discrimination in React/TypeScript
- **Series Display:** Series nodes should display the series name directly (e.g., "200", "300", "Uncategorized")
- **Product Location:** Products are only found at the series level (`products` array)
- **Count Aggregation:** Counts aggregate upward: series `productCount` → subcategory `productCount` → main category `productCount`
- **Empty Collections:** Empty `subNodes` and `products` arrays are omitted (null/undefined) to reduce payload size
- **Navigation:** Use `path` array for breadcrumb navigation instead of parsing `nodeId`
- **Node IDs:** The `nodeId` field follows the pattern `"category|subcategory|series"` for series nodes
- **Metadata:** Response includes `meta` object with totals, timing, and version information

---

#### 3. Get Product Details

Gets detailed information for a specific product by ID from PIA API. Returns complete product information including all properties and metadata.

**Endpoint:** `GET /api/pia/products/{id}`

**Path Parameters:**
- `id` (integer, required): The product ID

**Response Type:** `ProductDetailsDto`

**Response Codes:**
- **200 OK**: Product found and returned
- **404 Not Found**: Product with the specified ID not found
- **502 Bad Gateway**: HTTP request error
- **504 Gateway Timeout**: Request timed out
- **500 Internal Server Error**: Unexpected error

**Example Request:**
```http
GET /api/pia/products/123
```

**Example Response:**
```json
{
  "id": 123,
  "name": "Product Name",
  "type": "Product Type",
  "url": "https://example.com/product",
  "category": "Category",
  "categories": "Category1,Category2",
  "external": false,
  "state": 1,
  "parentId": null,
  "properties": {
    "officialCategories": "Official Category",
    "productFamily": "Family",
    "psLine": "PS Line",
    "vendorType": "Vendor Type",
    "vendor": "Vendor",
    "officialFullName": "Official Full Name",
    "shortName": "Short Name",
    "cnProdName": "CN Product Name",
    "formFactor": "Form Factor",
    "productType": "Product Type",
    "productGroup": "Product Group",
    "productSegment": "Product Segment",
    "productLine": "Product Line",
    "series": "Series",
    "catalogGroup": "Catalog Group",
    "externalReleaseDate": "2024-01-01",
    "endOfLifeDate": null,
    "endOfSupportDate": null,
    "stdWarranty": "Standard Warranty",
    "newProductNumberOfDays": "30",
    "active": "true",
    "supportalIncluded": "false",
    "channels": "Channel1,Channel2",
    "compare": "Compare URL",
    "projectURL": "Project URL",
    "projectName": "Project Name",
    "docmanId": "Docman ID",
    "spriteId": "Sprite ID",
    "hwId": "HW ID",
    "competitorCode": "Competitor Code",
    "boxWidth": "10",
    "boxHeight": "20",
    "boxDepth": "30",
    "outdoorReady": "true",
    "compNewsAxisCategory": "Category",
    "piaCategory": "PIA Category",
    "productCategories": "Product Categories",
    "manufacturerId": "Manufacturer ID",
    "scaleQuantity": "1"
  }
}
```

---

### Product Metadata Controller (`/api/products`)

The Product Metadata controller manages product metadata (links, custom properties, etc.). Metadata is stored separately from PIA API data and can be added/updated by the frontend.

#### 1. Get Product Metadata

Gets metadata for a specific product.

**Endpoint:** `GET /api/products/{id}/metadata`

**Path Parameters:**
- `id` (integer, required): The product ID

**Response Type:** `ProductMetadataDto`

**Response Codes:**
- **200 OK**: Metadata found and returned
- **404 Not Found**: Metadata not found for the specified product ID
- **500 Internal Server Error**: An error occurred while fetching metadata

**Example Request:**
```http
GET /api/products/123/metadata
```

**Example Response:**
```json
{
  "productId": 123,
  "links": [
    {
      "title": "Documentation",
      "url": "https://example.com/docs",
      "type": "documentation"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z",
  "createdBy": "user@example.com",
  "lastAccessed": "2024-01-03T00:00:00Z",
  "extraDescription": "Additional description",
  "responsible": "john.doe@example.com",
  "image": "https://example.com/images/product.jpg"
}
```

**Error Response (404):**
```json
{
  "message": "Metadata not found for product ID 123",
  "productId": 123
}
```

---

#### 2. Save Product Metadata

Saves or updates metadata for a product. Creates new metadata if it doesn't exist, updates if it does.

**Endpoint:** `POST /api/products/{id}/metadata`

**Path Parameters:**
- `id` (integer, required): The product ID

**Request Body:** `ProductMetadataRequestDto`

**Response Type:** `ProductMetadataDto`

**Response Codes:**
- **200 OK**: Metadata successfully saved
- **400 Bad Request**: Metadata request body is required
- **500 Internal Server Error**: An error occurred while saving metadata

**Example Request:**
```http
POST /api/products/123/metadata
Content-Type: application/json

{
  "links": [
    {
      "title": "Documentation",
      "url": "https://example.com/docs",
      "type": "documentation"
    },
    {
      "title": "Support",
      "url": "https://example.com/support",
      "type": "support"
    }
  ],
  "extraDescription": "Additional product description",
  "responsible": "john.doe@example.com",
  "image": "https://example.com/images/product.jpg"
}
```

**Example Response:**
```json
{
  "productId": 123,
  "links": [
    {
      "title": "Documentation",
      "url": "https://example.com/docs",
      "type": "documentation"
    },
    {
      "title": "Support",
      "url": "https://example.com/support",
      "type": "support"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z",
  "createdBy": "user@example.com",
  "lastAccessed": null,
  "extraDescription": "Additional product description",
  "responsible": "john.doe@example.com",
  "image": "https://example.com/images/product.jpg"
}
```

**Error Response (400):**
```json
{
  "message": "Metadata request body is required"
}
```

---

#### 3. Delete Product Metadata

Deletes metadata for a product.

**Endpoint:** `DELETE /api/products/{id}/metadata`

**Path Parameters:**
- `id` (integer, required): The product ID

**Response Codes:**
- **204 No Content**: Metadata successfully deleted
- **404 Not Found**: Metadata not found for the specified product ID
- **500 Internal Server Error**: An error occurred while deleting metadata

**Example Request:**
```http
DELETE /api/products/123/metadata
```

**Example Response:**
- **204 No Content**: No response body

**Error Response (404):**
```json
{
  "message": "Metadata not found for product ID 123",
  "productId": 123
}
```

---

### User Controller (`/api/user`)

The User controller provides access to user information from Microsoft Graph API.

#### 1. Get User

Retrieves user information from Microsoft Graph API by email.

**Endpoint:** `GET /api/user/{email}`

**Path Parameters:**
- `email` (string, required): The user's email address

**Response Type:** Microsoft Graph User object

**Response Codes:**
- **200 OK**: User found and returned
- **500 Internal Server Error**: An error occurred

**Example Request:**
```http
GET /api/user/user@example.com
```

**Example Response:**
```json
{
  "id": "user-id",
  "displayName": "User Name",
  "mail": "user@example.com",
  "userPrincipalName": "user@example.com",
  ...
}
```

---

## Data Transfer Objects (DTOs)

### ProductMetadataDto

Complete product metadata DTO with audit fields.

**Properties:**
- `productId` (integer): The product ID
- `links` (array of ProductLinkDto): List of links associated with the product
- `createdAt` (datetime): Timestamp when metadata was created
- `updatedAt` (datetime): Timestamp when metadata was last updated
- `createdBy` (string, nullable): User who created the metadata
- `lastAccessed` (datetime, nullable): Timestamp when metadata was last accessed
- `extraDescription` (string, nullable): Additional description text for the product
- `responsible` (string, nullable): Email or identifier of the person responsible for the product
- `image` (string, nullable): URL to an image representing the product

### ProductMetadataRequestDto

Request model for saving product metadata from frontend.

**Properties:**
- `links` (array of ProductLinkDto, nullable): List of links to associate with the product
- `extraDescription` (string, nullable): Additional description text for the product
- `responsible` (string, nullable): Email or identifier of the person responsible for the product
- `image` (string, nullable): URL to an image representing the product

### ProductLinkDto

Represents a link associated with a product.

**Properties:**
- `title` (string): The link title
- `url` (string): The link URL
- `type` (string, nullable): The link type (e.g., "documentation", "support")

### ProductDetailsDto

Detailed product information with all properties from PIA API. Used for product detail pages.

**Properties:**
- `id` (integer): Product ID
- `name` (string): Product name
- `type` (string): Product type
- `url` (string): Product URL
- `category` (string): Product category
- `categories` (string): Comma-separated categories
- `external` (boolean): Whether the product is external
- `state` (integer): Product state
- `parentId` (integer, nullable): Parent product ID
- `properties` (ProductPropertiesDto, nullable): Detailed product properties

### ProductPropertiesDto

Detailed product properties from PIA API. Contains all available product metadata.

**Properties:**
- `officialCategories` (string, nullable): Official categories
- `productFamily` (string, nullable): Product family
- `psLine` (string, nullable): PS line
- `vendorType` (string, nullable): Vender type
- `vendor` (string, nullable): Vender
- `officialFullName` (string, nullable): Official full name
- `shortName` (string, nullable): Short name
- `cnProdName` (string, nullable): CN product name
- `formFactor` (string, nullable): Form factor
- `productType` (string, nullable): Product type
- `productGroup` (string, nullable): Product group
- `productSegment` (string, nullable): Product segment
- `productLine` (string, nullable): Product line
- `series` (string, nullable): Series
- `catalogGroup` (string, nullable): Catalog group
- `externalReleaseDate` (string, nullable): External release date
- `endOfLifeDate` (string, nullable): End of life date
- `endOfSupportDate` (string, nullable): End of support date
- `stdWarranty` (string, nullable): Standard warranty
- `newProductNumberOfDays` (string, nullable): New product number of days
- `active` (string, nullable): Active status
- `supportalIncluded` (string, nullable): Support included
- `channels` (string, nullable): Channels
- `compare` (string, nullable): Compare URL
- `projectURL` (string, nullable): Project URL
- `projectName` (string, nullable): Project name
- `docmanId` (string, nullable): Docman ID
- `spriteId` (string, nullable): Sprite ID
- `hwId` (string, nullable): HW ID
- `competitorCode` (string, nullable): Competitor code
- `boxWidth` (string, nullable): Box width
- `boxHeight` (string, nullable): Box height
- `boxDepth` (string, nullable): Box depth
- `outdoorReady` (string, nullable): Outdoor ready
- `compNewsAxisCategory` (string, nullable): Comp news Axis category
- `piaCategory` (string, nullable): PIA category
- `productCategories` (string, nullable): Product categories
- `manufacturerId` (string, nullable): Manufacturer ID
- `scaleQuantity` (string, nullable): Scale quantity

### CategoryTreeResponseDto

Response model for hierarchical category tree structure matching `pia-category-structure.json`. Designed for frontend tree navigation components - optimized for React consumption.

**New Properties (Recommended):**
- `categories` (array of CategoryTreeNode): The hierarchical tree structure (replaces `structure`)
- `meta` (ResponseMetadata): Response metadata object containing:
  - `totalProducts` (integer): Total number of products across all categories
  - `totalCategories` (integer): Total number of main categories
  - `fetchTimeMs` (number): Time taken to fetch data in milliseconds
  - `timestamp` (datetime): Response timestamp in ISO 8601 format
  - `apiVersion` (string): API version number

**Legacy Properties (Deprecated):**
- `structure` (array of CategoryTreeNode): Use `categories` instead
- `timeToFetchData` (number): Use `meta.fetchTimeMs` instead

### CategoryTreeNode

Represents a node in the category tree hierarchy. Each node can contain subcategories (subNodes) and products (products). Optimized for React consumption with array-based children. The hierarchy structure is: Main Category → Subcategory → Series → Products.

**Node Type Identification (Recommended):**
Use the `nodeType` field for type-safe identification:
- **Main Category Node**: `nodeType` is `"Category"`
- **Subcategory Node**: `nodeType` is `"Subcategory"`
- **Series Node**: `nodeType` is `"Series"` (this is where products are located)

**Legacy Node Type Identification (Deprecated):**
- **Main Category Node**: `subNodes` contains subcategories, `products` is empty
- **Subcategory Node**: `subNodes` contains series groups, `products` is empty  
- **Series Node**: `subNodes` is `null`, `products` contains products

**New Properties (Recommended):**
- `nodeId` (string): Node identifier
  - Main Category: category name (e.g., "Network Cameras")
  - Subcategory: `"category|subcategory"` (e.g., "Network Cameras|Fixed Cameras")
  - Series: `"category|subcategory|series"` (e.g., "Network Cameras|Fixed Cameras|200")
- `displayName` (string): Display name for the node
  - Main Category: category name
  - Subcategory: subcategory name
  - Series: series value (e.g., "200", "300") or "Uncategorized" for products without series
- `nodeType` (string): Type of node - `"Category"`, `"Subcategory"`, or `"Series"` (NEW - enables type-safe React components)
- `subNodes` (array of CategoryTreeNode, nullable): 
  - Main Category: contains subcategory nodes
  - Subcategory: contains series nodes
  - Series: `null` or omitted (series is the leaf level)
- `products` (array of ProductSummaryDto, nullable): 
  - Main Category/Subcategory: empty array or omitted (products are at series level)
  - Series: contains products belonging to that series
- `productCount` (integer): Total count of products (including children)
  - Aggregates upward: series count → subcategory count → main category count
- `path` (array of string): Breadcrumb path array for navigation (NEW)
  - Example: `["Network Cameras", "Fixed Cameras", "200"]`

**Legacy Properties (Deprecated):**
- `id` (string): Use `nodeId` instead
- `name` (string): Use `displayName` instead
- `children` (array of CategoryTreeNode, nullable): Use `subNodes` instead
- `items` (array of ProductSummaryDto): Use `products` instead
- `count` (integer): Use `productCount` instead

### ProductSummaryDto

Summary of a product for category grouping.

**New Properties (Recommended):**
- `productId` (integer): Product identifier
- `productName` (string): Product name
- `productUrl` (string): Product URL
- `category` (string): Product category
- `categories` (string, nullable): Categories string (replaces `officialCategories`)
- `seriesName` (string, nullable): Product series name (used for grouping within subcategories)
- `metadata` (ProductMetadataDto, nullable): Associated metadata

**Legacy Properties (Deprecated):**
- `id` (integer): Use `productId` instead
- `name` (string): Use `productName` instead
- `url` (string): Use `productUrl` instead
- `officialCategories` (string, nullable): Use `categories` instead
- `series` (string, nullable): Use `seriesName` instead

---

## Error Responses

All endpoints may return error responses with the following structure:

**400 Bad Request:**
```json
{
  "message": "Error description"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found description",
  "productId": 123
}
```

**500 Internal Server Error:**
```json
{
  "message": "An error occurred",
  "error": "Detailed error message"
}
```

**502 Bad Gateway:**
```json
"Request failed: {error message}"
```

**504 Gateway Timeout:**
```json
"Request timed out. The endpoint may be taking longer than expected."
```

---

## Notes

- All datetime values are returned in ISO 8601 format (UTC)
- The API supports CORS for localhost development (ports 3000, 5173, 5174, 5175, 8080)
- Product metadata is stored separately from PIA API data and can be managed independently
- The `createdBy` field in metadata operations is automatically extracted from the authenticated user's identity
- **Storage Strategy**: Product metadata uses a hybrid storage approach in Azure Table Storage:
  - Simple queryable fields (`responsible`, `image`, and audit fields) are stored as separate columns for efficient querying
  - Complex objects (`links`, `extraDescription`) are stored in a JSON `Data` column
  - This design enables efficient filtering/searching on `responsible` and `image` fields while maintaining flexibility for complex data structures
