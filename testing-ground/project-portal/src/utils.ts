import type { CategoryTreeNode, ProductSummary } from "./types";

/**
 * Helper functions to access node properties with backward compatibility
 * These functions prefer new field names but fall back to legacy fields
 */

export function getNodeId(node: CategoryTreeNode): string {
  return node.nodeId ?? node.id ?? "";
}

export function getNodeName(node: CategoryTreeNode): string {
  return node.displayName ?? node.name ?? "";
}

export function getNodeChildren(node: CategoryTreeNode): CategoryTreeNode[] | null {
  return node.subNodes ?? node.children ?? null;
}

export function getNodeProducts(node: CategoryTreeNode): ProductSummary[] {
  return node.products ?? node.items ?? [];
}

export function getNodeCount(node: CategoryTreeNode): number {
  return node.productCount ?? node.count ?? 0;
}

export function getNodeType(node: CategoryTreeNode): "Category" | "Subcategory" | "Series" {
  if (node.nodeType) {
    return node.nodeType;
  }
  // Fallback to legacy detection
  const children = getNodeChildren(node);
  const products = getNodeProducts(node);
  if (children && children.length > 0) {
    return products.length === 0 ? "Category" : "Subcategory";
  }
  return "Series";
}

export function getProductId(product: ProductSummary): number {
  return product.productId ?? product.id ?? 0;
}

export function getProductName(product: ProductSummary): string {
  return product.productName ?? product.name ?? "";
}

export function getProductUrl(product: ProductSummary): string {
  return product.productUrl ?? product.url ?? "";
}

export function getProductSeries(product: ProductSummary): string | null {
  return product.seriesName ?? product.series ?? null;
}

export function getProductCategories(product: ProductSummary): string | null {
  return product.categories ?? product.officialCategories ?? null;
}
