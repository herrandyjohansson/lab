# React Consumption Guide - Category Tree Structure

## Overview

The `/api/pia/categories/structure` endpoint has been optimized for React consumption by using arrays instead of dictionaries, making it much easier to work with in React components.

## Response Structure

### Optimized Structure (Current)

```json
{
  "structure": [
    {
      "id": "Network cameras",
      "name": "Network cameras",
      "children": [
        {
          "id": "Network cameras|Dome cameras",
          "name": "Dome cameras",
          "children": null,
          "items": [
            {
              "id": 123,
              "name": "AXIS P3245-LVE",
              "url": "/products/123",
              "category": "Camera",
              "officialCategories": "[\"Dome cameras\"]"
            }
          ],
          "count": 1
        }
      ],
      "items": [],
      "count": 1
    }
  ],
  "timeToFetchData": 245.67
}
```

### Key Improvements for React

1. **Arrays instead of Objects**: `structure` is now an array, making `.map()` straightforward
2. **Consistent Structure**: `children` is always an array (or null), never an object
3. **Unique IDs**: Each node has an `id` property perfect for React `key` props
4. **Predictable Iteration**: Arrays maintain order and are easier to iterate

## React Implementation Examples

### Basic Tree Component

```tsx
import React from "react";

interface ProductSummary {
  id: number;
  name: string;
  url: string;
  category: string;
  officialCategories?: string;
}

interface CategoryTreeNode {
  id: string;
  name: string;
  children?: CategoryTreeNode[] | null;
  items: ProductSummary[];
  count: number;
}

interface CategoryTreeResponse {
  structure: CategoryTreeNode[];
  timeToFetchData: number;
}

function CategoryTree({ node }: { node: CategoryTreeNode }) {
  const hasChildren = node.children && node.children.length > 0;
  const hasItems = node.items && node.items.length > 0;

  return (
    <div className="category-node">
      <div className="category-header">
        <span className="category-name">{node.name}</span>
        <span className="category-count">({node.count})</span>
      </div>

      {hasChildren && (
        <ul className="category-children">
          {node.children!.map((child) => (
            <li key={child.id}>
              <CategoryTree node={child} />
            </li>
          ))}
        </ul>
      )}

      {hasItems && (
        <ul className="category-items">
          {node.items.map((item) => (
            <li key={item.id}>
              <a href={item.url}>{item.name}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryTreeView() {
  const [data, setData] = React.useState<CategoryTreeResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/pia/categories/structure")
      .then((res) => res.json())
      .then((data: CategoryTreeResponse) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching category tree:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="category-tree">
      {data.structure.map((category) => (
        <CategoryTree key={category.id} node={category} />
      ))}
    </div>
  );
}

export default CategoryTreeView;
```

### Advanced: Collapsible Tree with Search

```tsx
import React, { useState, useMemo } from "react";

function CollapsibleCategoryTree({ node }: { node: CategoryTreeNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const hasItems = node.items && node.items.length > 0;

  return (
    <div className="collapsible-category-node">
      <div
        className="category-header"
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        style={{ cursor: hasChildren ? "pointer" : "default" }}
      >
        {hasChildren && (
          <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
        )}
        <span className="category-name">{node.name}</span>
        <span className="category-count">({node.count})</span>
      </div>

      {isExpanded && hasChildren && (
        <div className="category-children">
          {node.children!.map((child) => (
            <CollapsibleCategoryTree key={child.id} node={child} />
          ))}
        </div>
      )}

      {hasItems && (
        <ul className="category-items">
          {node.items.map((item) => (
            <li key={item.id}>
              <a href={item.url}>{item.name}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchableCategoryTree() {
  const [data, setData] = useState<CategoryTreeResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch("/api/pia/categories/structure")
      .then((res) => res.json())
      .then((data: CategoryTreeResponse) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  // Filter tree based on search term
  const filteredStructure = useMemo(() => {
    if (!data || !searchTerm) return data?.structure || [];

    const filterNode = (node: CategoryTreeNode): CategoryTreeNode | null => {
      const matchesName = node.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesItems = node.items.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Filter children recursively
      const filteredChildren =
        node.children
          ?.map((child) => filterNode(child))
          .filter((child): child is CategoryTreeNode => child !== null) || [];

      // Include node if it matches or has matching children/items
      if (matchesName || matchesItems || filteredChildren.length > 0) {
        return {
          ...node,
          children:
            filteredChildren.length > 0 ? filteredChildren : node.children,
          items: matchesItems
            ? node.items.filter((item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : node.items,
        };
      }

      return null;
    };

    return data.structure
      .map((node) => filterNode(node))
      .filter((node): node is CategoryTreeNode => node !== null);
  }, [data, searchTerm]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="searchable-category-tree">
      <input
        type="text"
        placeholder="Search categories or products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      <div className="category-tree">
        {filteredStructure.map((category) => (
          <CollapsibleCategoryTree key={category.id} node={category} />
        ))}
      </div>
    </div>
  );
}
```

### Using React Query / TanStack Query

```tsx
import { useQuery } from "@tanstack/react-query";

function useCategoryTree() {
  return useQuery({
    queryKey: ["categoryTree"],
    queryFn: async () => {
      const response = await fetch("/api/pia/categories/structure");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json() as Promise<CategoryTreeResponse>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function CategoryTreeWithReactQuery() {
  const { data, isLoading, error } = useCategoryTree();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="category-tree">
      {data.structure.map((category) => (
        <CategoryTree key={category.id} node={category} />
      ))}
    </div>
  );
}
```

## Benefits of Array-Based Structure

1. **Easy Mapping**: `data.structure.map()` works directly
2. **React Keys**: Use `node.id` directly as key prop
3. **Filtering**: Easy to filter with `.filter()`
4. **Sorting**: Easy to sort with `.sort()`
5. **Search**: Simple recursive search through arrays
6. **Type Safety**: TypeScript works better with arrays
7. **Predictable**: Arrays maintain order, objects don't guarantee order

## Comparison: Before vs After

### Before (Dictionary-based)

```tsx
// Had to convert object to array first
const categories = Object.entries(data.structure).map(([key, value]) => ({
  ...value,
  id: key
}));

// Or use Object.keys/Object.values
Object.values(data.structure).map(category => ...)
```

### After (Array-based)

```tsx
// Direct mapping - much cleaner!
data.structure.map(category => ...)
```

## TypeScript Types

```typescript
export interface ProductSummary {
  id: number;
  name: string;
  url: string;
  category: string;
  officialCategories?: string;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  children?: CategoryTreeNode[] | null;
  items: ProductSummary[];
  count: number;
}

export interface CategoryTreeResponse {
  structure: CategoryTreeNode[];
  timeToFetchData: number;
}
```

## Styling Example (CSS)

```css
.category-tree {
  padding: 1rem;
}

.category-node {
  margin: 0.5rem 0;
  padding-left: 1rem;
  border-left: 2px solid #e0e0e0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  padding: 0.5rem;
}

.category-name {
  color: #333;
}

.category-count {
  color: #666;
  font-size: 0.9em;
}

.category-children {
  list-style: none;
  margin: 0.5rem 0;
  padding-left: 1rem;
}

.category-items {
  list-style: none;
  margin: 0.5rem 0;
  padding-left: 1rem;
}

.category-items li {
  padding: 0.25rem 0;
}

.category-items a {
  color: #0066cc;
  text-decoration: none;
}

.category-items a:hover {
  text-decoration: underline;
}
```
