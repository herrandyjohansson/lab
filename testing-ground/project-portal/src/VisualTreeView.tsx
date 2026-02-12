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

function VisualCategoryCard({
  node,
  level = 0,
  onProductClick,
}: {
  node: CategoryTreeNode;
  level?: number;
  onProductClick: (productId: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const children = getNodeChildren(node);
  const products = getNodeProducts(node);
  const hasChildren = children && children.length > 0;
  const hasItems = products.length > 0;
  const nodeName = getNodeName(node);
  const nodeCount = getNodeCount(node);

  return (
    <div
      className="visual-category-card"
      style={{ marginLeft: `${level * 1.5}rem` }}
    >
      <div
        className="visual-card-header"
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        <div className="visual-card-content">
          <span className="visual-category-name">{nodeName}</span>
          <span className="visual-category-badge">{nodeCount}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="visual-card-body">
          {hasChildren && (
            <div className="visual-children">
              {children!.map((child) => {
                const childId = getNodeId(child);
                return (
                  <VisualCategoryCard
                    key={childId}
                    node={child}
                    level={level + 1}
                    onProductClick={onProductClick}
                  />
                );
              })}
            </div>
          )}

          {hasItems && (
            <div className="visual-items">
              {products.map((item) => {
                const productId = getProductId(item);
                const productName = getProductName(item);
                return (
                  <button
                    key={productId}
                    className="visual-item-link"
                    onClick={() => onProductClick(productId)}
                    title={`View details for ${productName}`}
                  >
                    <span className="visual-item-name">{productName}</span>
                    {item.category && (
                      <span className="visual-item-category">
                        {item.category}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function VisualTreeView() {
  const { data, loading, error } = useCategoryTree();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

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
      <div className="visual-tree">
        {(data.categories ?? data.structure ?? []).map((category) => {
          const categoryId = getNodeId(category);
          return (
            <VisualCategoryCard
              key={categoryId}
              node={category}
              onProductClick={setSelectedProductId}
            />
          );
        })}
      </div>
      <ProductDetailsModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
}
