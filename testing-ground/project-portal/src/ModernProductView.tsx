import { useState, useMemo } from "react";
import type { CategoryTreeNode, ProductSummary } from "./types";
import { useCategoryTree } from "./useCategoryTree";
import { ProductDetailsModal } from "./ProductDetailsModal";
import {
  getNodeId,
  getNodeName,
  getNodeChildren,
  getNodeProducts,
  getProductId,
  getProductName,
} from "./utils";

interface Breadcrumb {
  id: string;
  name: string;
}

interface TreeNodeProps {
  node: CategoryTreeNode;
  level: number;
  expandedNodes: Set<string>;
  selectedNodeId: string | null;
  onToggle: (nodeId: string) => void;
  onSelect: (node: CategoryTreeNode, path: Breadcrumb[]) => void;
  onProductClick: (productId: number) => void;
  path: Breadcrumb[];
}

function TreeNode({
  node,
  level,
  expandedNodes,
  selectedNodeId,
  onToggle,
  onSelect,
  onProductClick,
  path,
}: TreeNodeProps) {
  const nodeId = getNodeId(node);
  const nodeName = getNodeName(node);
  const children = getNodeChildren(node);
  const products = getNodeProducts(node);
  const isExpanded = expandedNodes.has(nodeId);
  const isSelected = selectedNodeId === nodeId;
  const hasChildren = children && children.length > 0;
  const hasProducts = products.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(nodeId);
    }
  };

  const handleSelect = () => {
    onSelect(node, path);
  };

  return (
    <div className="modern-tree-node">
      <div
        className={`modern-tree-item ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        onClick={handleSelect}
      >
        <div className="modern-tree-item-content">
          {hasChildren ? (
            <button
              className="modern-tree-toggle"
              onClick={handleToggle}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <span className="modern-tree-icon">
                {isExpanded ? "▼" : "▶"}
              </span>
            </button>
          ) : (
            <span className="modern-tree-spacer" />
          )}
          <span className="modern-tree-label">{nodeName}</span>
          {(hasProducts || hasChildren) && (
            <span className="modern-tree-count">
              {hasProducts ? products.length : hasChildren ? children!.length : 0}
            </span>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="modern-tree-children">
          {children!.map((child) => {
            const childId = getNodeId(child);
            return (
              <TreeNode
                key={childId}
                node={child}
                level={level + 1}
                expandedNodes={expandedNodes}
                selectedNodeId={selectedNodeId}
                onToggle={onToggle}
                onSelect={onSelect}
                onProductClick={onProductClick}
                path={[...path, { id: childId, name: getNodeName(child) }]}
              />
            );
          })}
        </div>
      )}

      {isExpanded && hasProducts && (
        <div className="modern-tree-products" style={{ paddingLeft: `${(level + 1) * 1.5 + 0.5}rem` }}>
          {products.map((product) => {
            const productId = getProductId(product);
            const productName = getProductName(product);
            return (
              <button
                key={productId}
                className="modern-tree-product"
                onClick={(e) => {
                  e.stopPropagation();
                  onProductClick(productId);
                }}
              >
                <span className="modern-tree-product-name">{productName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ModernProductView() {
  const { data, loading, error } = useCategoryTree();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    if (!data) return [];
    return data.categories ?? data.structure ?? [];
  }, [data]);

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Select a node (update breadcrumbs and show its content)
  const selectNode = (node: CategoryTreeNode, path: Breadcrumb[]) => {
    const nodeId = getNodeId(node);
    setSelectedNodeId(nodeId);
    setBreadcrumbs(path);
    // Auto-expand selected node
    setExpandedNodes((prev) => new Set(prev).add(nodeId));
  };

  // Navigate via breadcrumb
  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    if (newBreadcrumbs.length > 0) {
      setSelectedNodeId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
    } else {
      setSelectedNodeId(null);
    }
  };

  // Get selected node's products
  const selectedNodeProducts = useMemo(() => {
    if (!selectedNodeId || breadcrumbs.length === 0) return [];

    // Find the selected node
    let current: CategoryTreeNode[] = categories;
    for (const crumb of breadcrumbs) {
      const node = current.find((n) => getNodeId(n) === crumb.id);
      if (!node) return [];
      if (getNodeId(node) === selectedNodeId) {
        return getNodeProducts(node);
      }
      const children = getNodeChildren(node);
      if (!children) return [];
      current = children;
    }
    return [];
  }, [selectedNodeId, breadcrumbs, categories]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase();
    const results: Array<{
      product: ProductSummary;
      path: string[];
    }> = [];

    const searchInNode = (node: CategoryTreeNode, path: string[] = []) => {
      const products = getNodeProducts(node);
      products.forEach((product) => {
        const productName = getProductName(product);
        if (productName.toLowerCase().includes(query)) {
          results.push({
            product,
            path: [...path, getNodeName(node)],
          });
        }
      });

      const children = getNodeChildren(node);
      if (children) {
        children.forEach((child) => {
          searchInNode(child, [...path, getNodeName(node)]);
        });
      }
    };

    categories.forEach((category) => {
      searchInNode(category, []);
    });

    return results.slice(0, 100);
  }, [categories, searchQuery]);

  // Handle product click from tree
  const handleProductClick = (productId: number) => {
    setSelectedProductId(productId);
  };

  if (loading) {
    return (
      <div className="modern-view-container">
        <div className="modern-loading">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-view-container">
        <div className="modern-error">
          <div className="modern-error-title">Error</div>
          <div className="modern-error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="modern-view-container">
        <div className="modern-error">No data available</div>
      </div>
    );
  }

  return (
    <div className="modern-view-container">
      {/* Search Bar */}
      <div className="modern-search-container">
        <input
          type="text"
          className="modern-search-input"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="modern-search-clear"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Breadcrumbs - Always visible */}
      <div className="modern-breadcrumbs">
        <button
          className={`modern-breadcrumb-link ${breadcrumbs.length === 0 ? "active" : ""}`}
          onClick={() => {
            setBreadcrumbs([]);
            setSelectedNodeId(null);
          }}
        >
          All Products
        </button>
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.id} className="modern-breadcrumb-group">
            <span className="modern-breadcrumb-separator">›</span>
            <button
              className={`modern-breadcrumb-link ${index === breadcrumbs.length - 1 ? "active" : ""}`}
              onClick={() => navigateToBreadcrumb(index)}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="modern-content-wrapper">
        {/* Tree Navigation */}
        <div className="modern-tree-panel">
          <div className="modern-tree-header">
            <h3 className="modern-tree-title">Categories</h3>
          </div>
          <div className="modern-tree-container">
            {categories.map((category) => {
              const categoryId = getNodeId(category);
              return (
                <TreeNode
                  key={categoryId}
                  node={category}
                  level={0}
                  expandedNodes={expandedNodes}
                  selectedNodeId={selectedNodeId}
                  onToggle={toggleNode}
                  onSelect={selectNode}
                  onProductClick={handleProductClick}
                  path={[{ id: categoryId, name: getNodeName(category) }]}
                />
              );
            })}
          </div>
        </div>

        {/* Products Panel */}
        <div className="modern-products-panel">
          {searchQuery.trim() && searchResults ? (
            // Search Results View
            <div className="modern-search-results">
              <div className="modern-results-header">
                <h2 className="modern-results-title">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                </h2>
              </div>
              <div className="modern-product-list">
                {searchResults.map((result) => {
                  const productId = getProductId(result.product);
                  const productName = getProductName(result.product);
                  return (
                    <button
                      key={productId}
                      className="modern-product-item"
                      onClick={() => handleProductClick(productId)}
                    >
                      <div className="modern-product-info">
                        <span className="modern-product-name">{productName}</span>
                        <span className="modern-product-path">
                          {result.path.join(" › ")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : selectedNodeProducts.length > 0 ? (
            // Selected Node Products View
            <div className="modern-products-view">
              <div className="modern-products-header">
                <h2 className="modern-products-title">
                  {selectedNodeProducts.length} product{selectedNodeProducts.length !== 1 ? "s" : ""}
                </h2>
              </div>
              <div className="modern-product-list">
                {selectedNodeProducts.map((product) => {
                  const productId = getProductId(product);
                  const productName = getProductName(product);
                  return (
                    <button
                      key={productId}
                      className="modern-product-item"
                      onClick={() => handleProductClick(productId)}
                    >
                      <span className="modern-product-name">{productName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Empty State
            <div className="modern-empty-state">
              <div className="modern-empty-icon">📁</div>
              <p className="modern-empty-text">
                {breadcrumbs.length === 0
                  ? "Select a category from the tree to view products"
                  : "No products in this category"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
}
