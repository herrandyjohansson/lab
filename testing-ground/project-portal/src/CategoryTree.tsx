import { useState } from "react";
import type { CategoryTreeNode } from "./types";
import { useCategoryTree } from "./useCategoryTree";
import { ProductDetailsModal } from "./ProductDetailsModal";
import {
  getNodeId,
  getNodeName,
  getNodeChildren,
  getNodeProducts,
  getNodeCount,
  getProductId,
  getProductName,
} from "./utils";

function CategoryTree({
  node,
  onProductClick,
  searchQuery,
}: {
  node: CategoryTreeNode;
  onProductClick: (productId: number) => void;
  searchQuery: string;
}) {
  // Filter products by search query (name or ID)
  const matchesSearch = (product: any): boolean => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const productName = getProductName(product);
    const productId = getProductId(product);
    const nameMatch = productName.toLowerCase().includes(query);
    const idMatch = productId.toString().includes(query);
    return nameMatch || idMatch;
  };

  // Filter items based on search query
  const products = getNodeProducts(node);
  const filteredItems = products.filter(matchesSearch);

  // Recursively filter children and check if they have matching products
  const filterNode = (n: CategoryTreeNode): CategoryTreeNode | null => {
    const children = getNodeChildren(n);
    const filteredChildren = children
      ?.map(filterNode)
      .filter((child): child is CategoryTreeNode => child !== null) || [];
    const nodeProducts = getNodeProducts(n);
    const filteredItems = nodeProducts.filter(matchesSearch);

    // Include node if it has matching items or children with matches
    if (filteredItems.length > 0 || filteredChildren.length > 0) {
      return {
        ...n,
        subNodes: filteredChildren.length > 0 ? filteredChildren : null,
        children: filteredChildren.length > 0 ? filteredChildren : null,
        products: filteredItems,
        items: filteredItems,
        productCount: filteredItems.length + filteredChildren.reduce((sum, child) => sum + getNodeCount(child), 0),
        count: filteredItems.length + filteredChildren.reduce((sum, child) => sum + getNodeCount(child), 0),
      };
    }
    return null;
  };

  const children = getNodeChildren(node);
  const filteredChildren = children
    ?.map(filterNode)
    .filter((child): child is CategoryTreeNode => child !== null) || [];

  const hasChildren = filteredChildren.length > 0;
  const hasItems = filteredItems.length > 0;

  // Don't render node if it has no matching items or children
  if (!hasChildren && !hasItems) {
    return null;
  }

  const nodeName = getNodeName(node);

  return (
    <div className="category-node">
      <div className="category-header">
        <span className="category-name">{nodeName}</span>
        <span className="category-count">
          ({hasItems ? filteredItems.length : 0}
          {hasChildren && hasItems ? " + " : ""}
          {hasChildren
            ? filteredChildren.reduce((sum, child) => sum + getNodeCount(child), 0)
            : ""}
          )
        </span>
      </div>

      {hasChildren && (
        <ul className="category-children">
          {filteredChildren.map((child) => {
            const childId = getNodeId(child);
            return (
              <li key={childId}>
                <CategoryTree
                  node={child}
                  onProductClick={onProductClick}
                  searchQuery={searchQuery}
                />
              </li>
            );
          })}
        </ul>
      )}

      {hasItems && (
        <ul className="category-items">
          {filteredItems.map((item) => {
            const productId = getProductId(item);
            const productName = getProductName(item);
            return (
              <li key={productId}>
                <button
                  className="product-link-button"
                  onClick={() => onProductClick(productId)}
                  title={`View details for ${productName} (ID: ${productId})`}
                >
                  <span className="product-name">{productName}</span>
                  <span className="product-id-badge">#{productId}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function CategoryTreeView() {
  const { data, loading, error } = useCategoryTree();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (loading)
    return (
      <div className="view-container">
        <div className="loading">Loading...</div>
      </div>
    );
  if (error)
    return (
      <div className="view-container">
        <div className="error">
          Error: {error}
          <br />
          <small>Make sure the API is running</small>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="view-container">
        <div>No data available</div>
      </div>
    );

  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Category Tree</h1>
        {(data.meta?.fetchTimeMs ?? data.timeToFetchData) && (
          <span className="fetch-time">
            Fetched in {(data.meta?.fetchTimeMs ?? data.timeToFetchData)!.toFixed(2)}ms
          </span>
        )}
      </div>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by product name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
      <div className="category-tree">
        {(data.categories ?? data.structure ?? []).map((category) => {
          const filtered = (() => {
            const matchesSearch = (product: any): boolean => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase().trim();
              const productName = getProductName(product);
              const productId = getProductId(product);
              return (
                productName.toLowerCase().includes(query) ||
                productId.toString().includes(query)
              );
            };

            const filterNode = (n: CategoryTreeNode): CategoryTreeNode | null => {
              const children = getNodeChildren(n);
              const filteredChildren = children
                ?.map(filterNode)
                .filter((child): child is CategoryTreeNode => child !== null) || [];
              const products = getNodeProducts(n);
              const filteredItems = products.filter(matchesSearch);

              if (filteredItems.length > 0 || filteredChildren.length > 0) {
                return {
                  ...n,
                  subNodes: filteredChildren.length > 0 ? filteredChildren : null,
                  children: filteredChildren.length > 0 ? filteredChildren : null,
                  products: filteredItems,
                  items: filteredItems,
                  productCount:
                    filteredItems.length +
                    filteredChildren.reduce(
                      (sum, child) => sum + getNodeCount(child),
                      0
                    ),
                  count:
                    filteredItems.length +
                    filteredChildren.reduce(
                      (sum, child) => sum + getNodeCount(child),
                      0
                    ),
                };
              }
              return null;
            };

            return filterNode(category);
          })();

          if (!filtered) return null;

          const categoryId = getNodeId(category);
          return (
            <CategoryTree
              key={categoryId}
              node={filtered}
              onProductClick={setSelectedProductId}
              searchQuery={searchQuery}
            />
          );
        })}
        {searchQuery &&
          (data.categories ?? data.structure ?? []).every((category) => {
            const matchesSearch = (product: any): boolean => {
              const query = searchQuery.toLowerCase().trim();
              const productName = getProductName(product);
              const productId = getProductId(product);
              return (
                productName.toLowerCase().includes(query) ||
                productId.toString().includes(query)
              );
            };
            const hasMatches = (n: CategoryTreeNode): boolean => {
              const products = getNodeProducts(n);
              if (products.some(matchesSearch)) return true;
              const children = getNodeChildren(n);
              return children?.some(hasMatches) || false;
            };
            return !hasMatches(category);
          }) && (
            <div className="no-results">
              <p>No products found matching "{searchQuery}"</p>
            </div>
          )}
      </div>
      <ProductDetailsModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
}
