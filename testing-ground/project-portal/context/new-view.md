# Product Browser Component Structure

This document describes the architecture and implementation details of the Product Browser component for use with Cursor AI.

## Overview

A modern two-panel product browser that replaces traditional collapsible tree navigation with a sidebar-driven master-detail layout. Designed to handle ~1000+ products across a two-level hierarchy (Categories > Subcategories > Products).

## Data Structure

### Types

```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Subcategory {
  id: string;
  name: string;
  products: Product[];
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}
```

### Expected Data Format

```typescript
const data: Category[] = [
  {
    id: "category-id",
    name: "Category Name",
    subcategories: [
      {
        id: "subcategory-id",
        name: "Subcategory Name",
        products: [{ id: "product-1", name: "Product Name", sku: "SKU-001" }],
      },
    ],
  },
];
```

## Component Architecture

### File Structure

```
components/
├── product-browser.tsx    # Main container component
└── ui/
    ├── input.tsx          # Search input (shadcn)
    ├── badge.tsx          # Product count badges (shadcn)
    └── button.tsx         # View toggle buttons (shadcn)
```

### Component Breakdown

#### ProductBrowser (Main Component)

**Location:** `components/product-browser.tsx`

**State Management:**

- `selectedCategory: string | null` - Currently selected category ID
- `selectedSubcategory: string | null` - Currently selected subcategory ID
- `searchQuery: string` - Current search/filter query
- `viewMode: "grid" | "list"` - Product display mode

**Key Functions:**

- `handleCategoryClick(categoryId)` - Expands/collapses category, resets subcategory
- `handleSubcategoryClick(subcategoryId)` - Selects subcategory, shows products
- `handleSearchResultClick(categoryId, subcategoryId)` - Navigates from search result
- `clearSelection()` - Returns to home view

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ProductBrowser (flex h-screen)                              │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                          │
│    Sidebar       │           Main Content                   │
│    (w-72)        │           (flex-1)                       │
│                  │                                          │
│  ┌────────────┐  │  ┌────────────────────────────────────┐  │
│  │ Header     │  │  │ Content Header                     │  │
│  │ - Title    │  │  │ - Breadcrumbs                      │  │
│  │ - Count    │  │  │ - Title                            │  │
│  └────────────┘  │  │ - Search (when subcategory)        │  │
│                  │  │ - View toggle                       │  │
│  ┌────────────┐  │  └────────────────────────────────────┘  │
│  │ Search     │  │                                          │
│  └────────────┘  │  ┌────────────────────────────────────┐  │
│                  │  │ Content Area (scrollable)          │  │
│  ┌────────────┐  │  │                                    │  │
│  │ Categories │  │  │ Renders based on selection:        │  │
│  │ (scrollable│  │  │ - Home: Category cards             │  │
│  │  nav)      │  │  │ - Category: Subcategory cards      │  │
│  │            │  │  │ - Subcategory: Product grid/list   │  │
│  │ └ Subcats  │  │  │ - Search: Global search results    │  │
│  │   (nested) │  │  │                                    │  │
│  └────────────┘  │  └────────────────────────────────────┘  │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

## Navigation States

### 1. Home View (No Selection)

- Sidebar: All categories visible, none expanded
- Content: Grid of category cards with product counts

### 2. Category Selected

- Sidebar: Selected category expanded, showing subcategories
- Content: Grid of subcategory cards

### 3. Subcategory Selected

- Sidebar: Category expanded, subcategory highlighted
- Content: Product grid/list with filter search and view toggle

### 4. Global Search Active

- Sidebar: Search input focused, categories visible
- Content: List of matching products with category/subcategory path

## Styling Tokens

Uses shadcn/ui design tokens:

| Token                | Usage                             |
| -------------------- | --------------------------------- |
| `sidebar`            | Sidebar background                |
| `sidebar-foreground` | Sidebar text                      |
| `sidebar-accent`     | Sidebar hover/active states       |
| `background`         | Main content background           |
| `foreground`         | Main content text                 |
| `primary`            | Active states, hover accents      |
| `muted`              | Placeholder areas, secondary text |
| `border`             | Dividers, card borders            |
| `card`               | Product/category card backgrounds |

## Performance Considerations

1. **Memoization:** Uses `useMemo` for:

   - `currentCategory` / `currentSubcategory` lookups
   - `filteredProducts` (search within subcategory)
   - `globalSearchResults` (search across all products)
   - `totalProducts` count

2. **Search Optimization:**

   - Global search limited to 50 results
   - Local filtering happens client-side (fast for ~1000 items)

3. **Virtualization (Future):**
   - For >1000 products, consider `react-virtual` or `@tanstack/react-virtual`
   - Apply to product grid in subcategory view

## API Integration Points

Replace `generateSampleData()` with your data source:

```typescript
// Option 1: Server Component with fetch
async function getProductData(): Promise<Category[]> {
  const res = await fetch("/api/products");
  return res.json();
}

// Option 2: SWR for client-side
import useSWR from "swr";

function ProductBrowser() {
  const { data, error, isLoading } = useSWR<Category[]>("/api/products");
  // ...
}

// Option 3: Server Action
("use server");
async function fetchProducts(): Promise<Category[]> {
  // Database query
}
```

## Customization Guide

### Adding Product Details

Extend the Product interface and update the product cards:

```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
  // Add fields:
  price?: number;
  image?: string;
  description?: string;
  inStock?: boolean;
}
```

### Adding Filters

Add filter state and UI to the content header:

```typescript
const [filters, setFilters] = useState({
  inStock: false,
  priceRange: [0, 1000],
});
```

### Mobile Responsiveness

The sidebar can be converted to a sheet/drawer on mobile:

```typescript
// Use shadcn Sheet component
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Toggle sidebar visibility on mobile
const [sidebarOpen, setSidebarOpen] = useState(false);
```

## Dependencies

- `lucide-react` - Icons (Search, ChevronRight, Package, Grid3X3, List, X)
- `@/components/ui/*` - shadcn components (Input, Badge, Button)
- `@/lib/utils` - cn utility for className merging

## Testing Considerations

Key user flows to test:

1. Navigate: Home → Category → Subcategory → Product
2. Search globally from home view
3. Filter products within subcategory
4. Toggle between grid/list views
5. Navigate back via breadcrumbs
6. Collapse/expand categories in sidebar
