# Product Details API Endpoint

## Overview

The Product Details endpoint provides comprehensive information for a specific product from the PIA API. This endpoint is designed to be called when a user clicks on a product in the category tree structure, providing all available product metadata and properties.

**Endpoint**: `GET /api/pia/products/{id}`

**Base URL**: `http://localhost:5000/api/pia` (development)

---

## Endpoint Specification

### Request

**Method**: `GET`

**URL**: `/api/pia/products/{id}`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `integer` | Yes | The unique product identifier from PIA API |

**Headers**:
```
Accept: application/json
```

### Response

**Content-Type**: `application/json`

**Status Codes**:

| Code | Description | Response Body |
|------|-------------|---------------|
| `200 OK` | Product found successfully | `ProductDetailsDto` |
| `404 Not Found` | Product with specified ID does not exist | Error object with message |
| `502 Bad Gateway` | External PIA API error | Error message string |
| `504 Gateway Timeout` | Request to PIA API timed out | Error message string |
| `500 Internal Server Error` | Unexpected server error | Error message string |

---

## Response Schema

### ProductDetailsDto

```typescript
interface ProductDetailsDto {
  id: number;
  name: string;
  type: string;
  url: string;
  category: string;
  categories: string;
  external: boolean;
  state: number;
  parentId: number | null;
  properties: ProductPropertiesDto | null;
}
```

### ProductPropertiesDto

```typescript
interface ProductPropertiesDto {
  // Categories
  officialCategories?: string;
  productCategories?: string;
  piaCategory?: string;
  
  // Identification
  productFamily?: string;
  shortName?: string;
  cnProdName?: string;
  officialFullName?: string;
  
  // Classification
  productType?: string;
  productGroup?: string;
  productSegment?: string;
  productLine?: string;
  psLine?: string;
  
  // Physical Properties
  formFactor?: string;
  boxWidth?: string;
  boxHeight?: string;
  boxDepth?: string;
  outdoorReady?: string;
  
  // Dates
  externalReleaseDate?: string;
  endOfLifeDate?: string;
  endOfSupportDate?: string;
  
  // Vendor Information
  vendor?: string;
  vendorType?: string;
  manufacturerId?: string;
  
  // Metadata
  series?: string;
  catalogGroup?: string;
  spriteId?: string;
  hwId?: string;
  competitorCode?: string;
  
  // Status
  active?: string;
  supportalIncluded?: string;
  stdWarranty?: string;
  newProductNumberOfDays?: string;
  
  // Technical
  channels?: string;
  compare?: string;
  scaleQuantity?: string;
  
  // Project Information
  projectURL?: string;
  projectName?: string;
  docmanId?: string;
  
  // Other
  compNewsAxisCategory?: string;
}
```

---

## Example Responses

### Success Response (200 OK)

```json
{
  "id": 12345,
  "name": "AXIS P3245-LVE",
  "type": "Product",
  "url": "http://www.axis.com/products/axis-p3245-lve",
  "category": "Camera",
  "categories": "Network cameras",
  "external": false,
  "state": 1,
  "parentId": null,
  "properties": {
    "officialCategories": "[\"Dome cameras\"]",
    "productFamily": "AXIS P3245",
    "productLine": "M_LINE",
    "psLine": "M",
    "vendorType": "Axis",
    "vendor": "Axis",
    "officialFullName": "AXIS P3245-LVE Network Camera",
    "shortName": "AXIS P3245-LVE",
    "cnProdName": "P3245-LVE",
    "formFactor": "Dome",
    "productType": "FIXED DOME",
    "productGroup": "CAMERA",
    "productSegment": "VIDEO",
    "series": "3000",
    "catalogGroup": "4100",
    "externalReleaseDate": "2020-01-15 00:00:00.0",
    "endOfLifeDate": null,
    "endOfSupportDate": "2028-01-15 00:00:00.0",
    "stdWarranty": "3",
    "newProductNumberOfDays": "90",
    "active": "1",
    "supportalIncluded": "Yes",
    "channels": "1",
    "compare": "1",
    "projectURL": "https://inside.axis.com/archive/projects/development/cameras_video/p3245/",
    "projectName": "P3245",
    "docmanId": "p3245-lve",
    "spriteId": "456",
    "hwId": "789",
    "competitorCode": "1234",
    "boxWidth": "120",
    "boxHeight": "80",
    "boxDepth": "80",
    "outdoorReady": "Yes",
    "compNewsAxisCategory": "Fixed camera",
    "piaCategory": "dome",
    "productCategories": "[\"dome\"]",
    "manufacturerId": "AXIS",
    "scaleQuantity": "1"
  }
}
```

### Product Not Found (404 Not Found)

```json
{
  "message": "Product with ID 99999 not found",
  "productId": 99999
}
```

### Request Timeout (504 Gateway Timeout)

```json
"Request timed out. The endpoint may be taking longer than expected."
```

### Bad Gateway (502 Bad Gateway)

```json
"Request failed: Connection refused"
```

---

## Usage Examples

### JavaScript/TypeScript (Fetch API)

```typescript
async function getProductDetails(productId: number): Promise<ProductDetailsDto> {
  const response = await fetch(`/api/pia/products/${productId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Product ${productId} not found`);
    }
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }

  return response.json();
}

// Usage
try {
  const product = await getProductDetails(12345);
  console.log('Product:', product.name);
  console.log('Full Name:', product.properties?.officialFullName);
} catch (error) {
  console.error('Error:', error);
}
```

### React Hook with React Query

```typescript
import { useQuery } from '@tanstack/react-query';

interface ProductDetailsDto {
  id: number;
  name: string;
  type: string;
  url: string;
  category: string;
  categories: string;
  external: boolean;
  state: number;
  parentId: number | null;
  properties: ProductPropertiesDto | null;
}

function useProductDetails(productId: number | null) {
  return useQuery<ProductDetailsDto, Error>({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      
      const response = await fetch(`/api/pia/products/${productId}`);
      
      if (response.status === 404) {
        throw new Error(`Product ${productId} not found`);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Component usage
function ProductDetailsPage({ productId }: { productId: number }) {
  const { data, isLoading, error, isError } = useProductDetails(productId);

  if (isLoading) {
    return (
      <div className="loading">
        <p>Loading product details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="error">
        <p>Error: {error?.message}</p>
      </div>
    );
  }

  if (!data) {
    return <div>Product not found</div>;
  }

  return (
    <div className="product-details">
      <h1>{data.name}</h1>
      
      {data.properties?.officialFullName && (
        <p className="full-name">{data.properties.officialFullName}</p>
      )}
      
      <div className="basic-info">
        <p><strong>Category:</strong> {data.category}</p>
        <p><strong>Type:</strong> {data.type}</p>
        {data.url && (
          <p>
            <strong>Product URL:</strong>{' '}
            <a href={data.url} target="_blank" rel="noopener noreferrer">
              {data.url}
            </a>
          </p>
        )}
      </div>

      {data.properties && (
        <div className="properties">
          <h2>Product Properties</h2>
          
          <section>
            <h3>Identification</h3>
            {data.properties.productFamily && (
              <p><strong>Product Family:</strong> {data.properties.productFamily}</p>
            )}
            {data.properties.productLine && (
              <p><strong>Product Line:</strong> {data.properties.productLine}</p>
            )}
            {data.properties.vendor && (
              <p><strong>Vendor:</strong> {data.properties.vendor}</p>
            )}
            {data.properties.series && (
              <p><strong>Series:</strong> {data.properties.series}</p>
            )}
          </section>

          <section>
            <h3>Physical Properties</h3>
            {data.properties.formFactor && (
              <p><strong>Form Factor:</strong> {data.properties.formFactor}</p>
            )}
            {data.properties.outdoorReady && (
              <p><strong>Outdoor Ready:</strong> {data.properties.outdoorReady}</p>
            )}
            {(data.properties.boxWidth || data.properties.boxHeight || data.properties.boxDepth) && (
              <p>
                <strong>Dimensions:</strong>{' '}
                {data.properties.boxWidth} × {data.properties.boxHeight} × {data.properties.boxDepth} mm
              </p>
            )}
          </section>

          <section>
            <h3>Dates</h3>
            {data.properties.externalReleaseDate && (
              <p><strong>Release Date:</strong> {data.properties.externalReleaseDate}</p>
            )}
            {data.properties.endOfLifeDate && (
              <p><strong>End of Life:</strong> {data.properties.endOfLifeDate}</p>
            )}
            {data.properties.endOfSupportDate && (
              <p><strong>End of Support:</strong> {data.properties.endOfSupportDate}</p>
            )}
          </section>

          <section>
            <h3>Warranty & Support</h3>
            {data.properties.stdWarranty && (
              <p><strong>Standard Warranty:</strong> {data.properties.stdWarranty} years</p>
            )}
            {data.properties.supportalIncluded && (
              <p><strong>Supportal Included:</strong> {data.properties.supportalIncluded}</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
```

### Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/pia',
  headers: {
    'Accept': 'application/json',
  },
});

async function getProductDetails(productId: number) {
  try {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Product ${productId} not found`);
      }
      throw new Error(`API Error: ${error.message}`);
    }
    throw error;
  }
}
```

### cURL Example

```bash
# Basic request
curl -X GET "http://localhost:5000/api/pia/products/12345" \
  -H "Accept: application/json"

# With pretty print (jq)
curl -X GET "http://localhost:5000/api/pia/products/12345" \
  -H "Accept: application/json" | jq '.'

# Save to file
curl -X GET "http://localhost:5000/api/pia/products/12345" \
  -H "Accept: application/json" \
  -o product-details.json
```

---

## Property Reference

### Core Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `id` | `number` | Unique product identifier | `12345` |
| `name` | `string` | Product name | `"AXIS P3245-LVE"` |
| `type` | `string` | Product type | `"Product"` |
| `url` | `string` | Product page URL | `"http://www.axis.com/products/..."` |
| `category` | `string` | Primary category | `"Camera"` |
| `categories` | `string` | All categories | `"Network cameras"` |
| `external` | `boolean` | External product flag | `false` |
| `state` | `number` | Product state code | `1` |
| `parentId` | `number \| null` | Parent product ID | `null` |

### Properties Object Fields

#### Category Properties
- `officialCategories`: JSON array string of official categories
- `productCategories`: JSON array string of product categories
- `piaCategory`: PIA category identifier

#### Identification Properties
- `productFamily`: Product family name
- `shortName`: Short product name
- `cnProdName`: Chinese product name
- `officialFullName`: Official full product name

#### Classification Properties
- `productType`: Product type classification
- `productGroup`: Product group (e.g., "CAMERA")
- `productSegment`: Product segment (e.g., "VIDEO")
- `productLine`: Product line identifier
- `psLine`: Product line code

#### Physical Properties
- `formFactor`: Physical form factor (e.g., "Dome", "Box")
- `boxWidth`: Box width in mm
- `boxHeight`: Box height in mm
- `boxDepth`: Box depth in mm
- `outdoorReady`: Outdoor readiness indicator

#### Date Properties
- `externalReleaseDate`: External release date
- `endOfLifeDate`: End of life date
- `endOfSupportDate`: End of support date

#### Vendor Properties
- `vendor`: Vendor name
- `vendorType`: Vendor type
- `manufacturerId`: Manufacturer identifier

#### Metadata Properties
- `series`: Product series
- `catalogGroup`: Catalog group code
- `spriteId`: Sprite identifier
- `hwId`: Hardware identifier
- `competitorCode`: Competitor code

#### Status Properties
- `active`: Active status ("0" or "1")
- `supportalIncluded`: Supportal inclusion status
- `stdWarranty`: Standard warranty period
- `newProductNumberOfDays`: New product indicator days

#### Technical Properties
- `channels`: Number of channels
- `compare`: Comparison flag
- `scaleQuantity`: Scale quantity

#### Project Properties
- `projectURL`: Project URL
- `projectName`: Project name
- `docmanId`: Document management ID

---

## Integration with Category Tree

This endpoint is designed to work seamlessly with the category tree structure endpoint:

### Typical User Flow

1. **Browse Categories**: User loads the category tree
   ```typescript
   GET /api/pia/categories/structure
   ```

2. **Select Product**: User clicks on a product in the tree
   ```typescript
   // Product ID from tree item
   const productId = item.id; // e.g., 12345
   ```

3. **Fetch Details**: Frontend calls this endpoint
   ```typescript
   GET /api/pia/products/12345
   ```

4. **Display Details**: Show product details page

### Example Integration

```typescript
// In your tree component
function ProductItem({ product }: { product: ProductSummaryDto }) {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to details page or open modal
    navigate(`/products/${product.id}`);
    // Or: setShowDetails(true);
  };

  return (
    <div onClick={handleClick} className="product-item">
      <span>{product.name}</span>
      <span className="product-id">ID: {product.id}</span>
    </div>
  );
}

// In your details page/component
function ProductDetailsView({ productId }: { productId: number }) {
  const { data, isLoading } = useProductDetails(productId);
  
  // Render product details...
}
```

---

## Error Handling Best Practices

### Frontend Error Handling

```typescript
function ProductDetailsPage({ productId }: { productId: number }) {
  const { data, isLoading, error, isError } = useProductDetails(productId);

  // Handle loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Handle error states
  if (isError) {
    if (error?.message.includes('404') || error?.message.includes('not found')) {
      return (
        <ErrorPage
          title="Product Not Found"
          message={`Product with ID ${productId} could not be found.`}
          action={<Link to="/products">Browse Products</Link>}
        />
      );
    }

    return (
      <ErrorPage
        title="Error Loading Product"
        message={error?.message || 'An unexpected error occurred'}
        action={
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        }
      />
    );
  }

  // Render product details
  return <ProductDetailsView product={data} />;
}
```

---

## Performance Considerations

### Caching Strategy

- **Client-Side**: Use React Query or similar with appropriate `staleTime`
- **Server-Side**: Consider implementing caching for frequently accessed products
- **Cache Duration**: 5-15 minutes recommended for product details

### Optimization Tips

1. **Lazy Loading**: Only fetch details when user clicks on a product
2. **Prefetching**: Consider prefetching details for visible products
3. **Error Boundaries**: Implement error boundaries to handle failures gracefully
4. **Loading States**: Always show loading indicators
5. **Request Deduplication**: Use React Query to prevent duplicate requests

---

## Implementation Details

### Backend Architecture

- **Controller**: `Controllers/PiaController.cs` - `GetProductDetails(int id)`
- **Service**: `Business/Services/PiaService.cs` - `GetProductDetailsAsync(int id)`
- **DTOs**: `Business/Models/CategoryGroupingDto.cs` - `ProductDetailsDto`, `ProductPropertiesDto`
- **Data Model**: `Data/Models/Product.cs` - `ProductWithProperties`, `ProductProperties`

### API Call Flow

1. Controller receives request with product ID
2. Service method calls PIA API: `items/{id}?fields=properties&includeLargeTextValues=false`
3. Response is mapped to `ProductDetailsDto`
4. Properties are dynamically captured using `JsonExtensionData`
5. DTO is returned to client

### PIA API Endpoint

The backend calls:
```
GET https://gw.ext.csi-api.axis.com/ext/pia/items/{id}?fields=properties&includeLargeTextValues=false
```

With Authorization header:
```
Authorization: Bearer {token}
```

---

## Testing

### Manual Testing

```bash
# Test with valid product ID
curl http://localhost:5000/api/pia/products/12345

# Test with invalid product ID
curl http://localhost:5000/api/pia/products/99999

# Test with verbose output
curl -v http://localhost:5000/api/pia/products/12345
```

### Automated Testing Example

```typescript
describe('Product Details API', () => {
  it('should fetch product details successfully', async () => {
    const productId = 12345;
    const response = await fetch(`/api/pia/products/${productId}`);
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data).toHaveProperty('id', productId);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('properties');
  });

  it('should return 404 for non-existent product', async () => {
    const response = await fetch('/api/pia/products/99999');
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('message');
  });
});
```

---

## Notes

- All properties in `ProductPropertiesDto` are optional (nullable) as they may not be present for all products
- Properties are dynamically captured from PIA API using `JsonExtensionData`
- The endpoint fetches data directly from PIA API (not cached on server)
- Response time depends on PIA API performance (typically 200-500ms)
- Product IDs are integers from the PIA system
- The `officialCategories` field may be a JSON array string that needs parsing on the frontend

---

## Related Endpoints

- **Category Tree Structure**: `GET /api/pia/categories/structure` - Browse products by category
- **Category Groupings**: `GET /api/pia/categories` - Get products grouped by category
- **All Products**: `GET /api/pia` - Get all products (simplified)

---

## Support

For issues or questions:
- Check API logs for detailed error messages
- Verify product ID exists in PIA system
- Ensure PIA API is accessible and responding
- Check CORS configuration if calling from browser
