import { useState, useMemo } from "react";
import type { CategoryTreeNode, ProductSummary } from "./types";
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

// Helper function to count all products in a category tree
function countAllProducts(node: CategoryTreeNode): number {
  let count = getNodeProducts(node).length;
  const children = getNodeChildren(node);
  if (children) {
    count += children.reduce(
      (sum, child) => sum + countAllProducts(child),
      0
    );
  }
  return count;
}


function Sidebar({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedSeriesId,
  onCategoryClick,
  onSubcategoryClick,
  onSeriesClick,
  searchQuery,
  onSearchChange,
  totalProducts,
}: {
  categories: CategoryTreeNode[];
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  selectedSeriesId: string | null;
  onCategoryClick: (categoryId: string | null) => void;
  onSubcategoryClick: (subcategoryId: string) => void;
  onSeriesClick: (seriesId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalProducts: number;
}) {
  return (
    <div className="browser-sidebar">
      <div className="sidebar-header">
        <h2>Products</h2>
        <p className="sidebar-count">{totalProducts} items</p>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sidebar-categories">
        <h3>All Categories</h3>
        <nav className="category-nav">
          {categories.map((category) => {
            const categoryId = getNodeId(category);
            const categoryName = getNodeName(category);
            const categoryCount = getNodeCount(category);
            const subcategories = getNodeChildren(category);
            const isExpanded = selectedCategoryId === categoryId;
            const hasSubcategories = subcategories && subcategories.length > 0;

            return (
              <div key={categoryId} className="category-nav-item">
                <button
                  className={`category-nav-button ${
                    isExpanded ? "expanded" : ""
                  }`}
                  onClick={() =>
                    onCategoryClick(isExpanded ? null : categoryId)
                  }
                >
                  <span className="category-nav-name">{categoryName}</span>
                  <span className="category-nav-count">{categoryCount}</span>
                </button>

                {isExpanded && hasSubcategories && (
                  <div className="subcategory-nav">
                    {subcategories!.map((subcategory) => {
                      const subcategoryId = getNodeId(subcategory);
                      const subcategoryName = getNodeName(subcategory);
                      const subcategoryCount = getNodeCount(subcategory);
                      const series = getNodeChildren(subcategory);
                      const isSubcategoryExpanded =
                        selectedSubcategoryId === subcategoryId;
                      const hasSeries = series && series.length > 0;

                      return (
                        <div key={subcategoryId}>
                          <button
                            className={`subcategory-nav-button ${
                              isSubcategoryExpanded ? "active" : ""
                            }`}
                            onClick={() => onSubcategoryClick(subcategoryId)}
                          >
                            <span className="subcategory-nav-name">
                              {subcategoryName}
                            </span>
                            <span className="subcategory-nav-count">
                              {subcategoryCount}
                            </span>
                          </button>
                          {isSubcategoryExpanded && hasSeries && (
                            <div className="series-nav">
                              {series!.map((seriesNode) => {
                                const seriesId = getNodeId(seriesNode);
                                const seriesName = getNodeName(seriesNode);
                                const seriesCount = getNodeCount(seriesNode);
                                return (
                                  <button
                                    key={seriesId}
                                    className={`series-nav-button ${
                                      selectedSeriesId === seriesId
                                        ? "active"
                                        : ""
                                    }`}
                                    onClick={() => onSeriesClick(seriesId)}
                                  >
                                    <span className="series-nav-name">
                                      {seriesName}
                                    </span>
                                    <span className="series-nav-count">
                                      {seriesCount}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  onClick,
}: {
  category: CategoryTreeNode;
  onClick: () => void;
}) {
  const categoryName = getNodeName(category);
  const categoryCount = getNodeCount(category);
  const subcategories = getNodeChildren(category);
  const subcategoryCount = subcategories?.length || 0;

  return (
    <button className="browser-list-item" onClick={onClick}>
      <div className="browser-list-info">
        <span className="browser-list-name">{categoryName}</span>
        <span className="browser-list-subtitle">
          {subcategoryCount}{" "}
          {subcategoryCount === 1 ? "subcategory" : "subcategories"}
        </span>
      </div>
      <span className="browser-list-badge">{categoryCount}</span>
    </button>
  );
}

function SubcategoryCard({
  subcategory,
  onClick,
}: {
  subcategory: CategoryTreeNode;
  onClick: () => void;
}) {
  const subcategoryName = getNodeName(subcategory);
  const subcategoryCount = getNodeCount(subcategory);
  const series = getNodeChildren(subcategory);
  const seriesCount = series?.length || 0;

  return (
    <button className="browser-list-item" onClick={onClick}>
      <div className="browser-list-info">
        <span className="browser-list-name">{subcategoryName}</span>
        <span className="browser-list-subtitle">
          {seriesCount} {seriesCount === 1 ? "series" : "series"}
        </span>
      </div>
      <span className="browser-list-badge">{subcategoryCount}</span>
    </button>
  );
}

function SeriesCard({
  series,
  onClick,
}: {
  series: CategoryTreeNode;
  onClick: () => void;
}) {
  const seriesName = getNodeName(series);
  const seriesCount = getNodeCount(series);

  return (
    <button className="browser-list-item" onClick={onClick}>
      <div className="browser-list-info">
        <span className="browser-list-name">{seriesName}</span>
        <span className="browser-list-subtitle">
          {seriesCount} {seriesCount === 1 ? "product" : "products"}
        </span>
      </div>
      <span className="browser-list-badge">{seriesCount}</span>
    </button>
  );
}

function ProductCard({
  product,
  onClick,
}: {
  product: ProductSummary;
  onClick: () => void;
}) {
  const productName = getProductName(product);
  const productCategory = product.category;

  return (
    <button className="product-list-item" onClick={onClick}>
      <div className="product-list-info">
        <span className="product-list-name">{productName}</span>
        <span className="product-list-category">{productCategory}</span>
      </div>
    </button>
  );
}

function ContentArea({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedSeriesId,
  searchQuery,
  onProductClick,
  onCategoryClick,
  onSubcategoryClick,
  onSeriesClick,
  onSearchChange,
}: {
  categories: CategoryTreeNode[];
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  selectedSeriesId: string | null;
  searchQuery: string;
  onProductClick: (productId: number) => void;
  onCategoryClick: (categoryId: string | null) => void;
  onSubcategoryClick: (subcategoryId: string) => void;
  onSeriesClick: (seriesId: string) => void;
  onSearchChange: (query: string) => void;
}) {
  const selectedCategory = useMemo(
    () =>
      categories.find((c) => getNodeId(c) === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const selectedSubcategory = useMemo(() => {
    if (!selectedCategory) return null;
    const subcategories = getNodeChildren(selectedCategory);
    if (!subcategories) return null;
    return (
      subcategories.find((s) => getNodeId(s) === selectedSubcategoryId) ||
      null
    );
  }, [selectedCategory, selectedSubcategoryId]);

  const selectedSeries = useMemo(() => {
    if (!selectedSubcategory) return null;
    const series = getNodeChildren(selectedSubcategory);
    if (!series) return null;
    return (
      series.find((s) => getNodeId(s) === selectedSeriesId) || null
    );
  }, [selectedSubcategory, selectedSeriesId]);

  // Global search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase();
    const results: Array<{
      product: ProductSummary;
      categoryPath: string;
      subcategoryPath: string | null;
    }> = [];

    // Recursive function to search products in the tree
    const searchInNode = (
      node: CategoryTreeNode,
      categoryPath: string,
      subcategoryPath: string | null = null
    ) => {
      // Search products at current level (Series level)
      const products = getNodeProducts(node);
      products.forEach((product) => {
        const productName = getProductName(product);
        if (productName.toLowerCase().includes(query)) {
          results.push({
            product,
            categoryPath,
            subcategoryPath,
          });
        }
      });

      // Recursively search in children (Subcategories → Series)
      const children = getNodeChildren(node);
      if (children) {
        children.forEach((child) => {
          const childName = getNodeName(child);
          const newSubcategoryPath = subcategoryPath
            ? `${subcategoryPath} / ${childName}`
            : childName;
          searchInNode(child, categoryPath, newSubcategoryPath);
        });
      }
    };

    categories.forEach((category) => {
      const categoryName = getNodeName(category);
      searchInNode(category, categoryName);
    });

    return results.slice(0, 50); // Limit to 50 results
  }, [categories, searchQuery]);

  // Filtered products for selected series
  const filteredProducts = useMemo(() => {
    if (!selectedSeries) return [];
    
    const products = getNodeProducts(selectedSeries);
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      const productName = getProductName(product);
      const productId = getProductId(product);
      return (
        productName.toLowerCase().includes(query) ||
        productId.toString().includes(query)
      );
    });
  }, [selectedSeries, searchQuery]);

  // Render based on state
  if (searchQuery.trim() && searchResults) {
    return (
      <div className="browser-content">
        <div className="content-header">
          <div>
            <h1>Search Results</h1>
            <p className="content-subtitle">
              Found {searchResults.length}{" "}
              {searchResults.length === 1 ? "result" : "results"}
            </p>
          </div>
        </div>
        <div className="search-results">
          {searchResults.map((result) => {
            const productId = getProductId(result.product);
            const productName = getProductName(result.product);
            return (
              <button
                key={productId}
                className="search-result-item"
                onClick={() => onProductClick(productId)}
              >
                <div className="search-result-info">
                  <span className="search-result-name">{productName}</span>
                  <span className="search-result-path">
                    {result.categoryPath}
                    {result.subcategoryPath && ` / ${result.subcategoryPath}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (selectedSeries) {
    // Show products for selected series
    return (
      <div className="browser-content">
        <div className="content-header">
          <div>
            <div className="breadcrumbs">
              <button
                className="breadcrumb-link"
                onClick={() => onCategoryClick(selectedCategoryId)}
              >
                {selectedCategory ? getNodeName(selectedCategory) : ""}
              </button>
              <span className="breadcrumb-separator">/</span>
              <button
                className="breadcrumb-link"
                onClick={() => onSubcategoryClick(selectedSubcategoryId!)}
              >
                {selectedSubcategory ? getNodeName(selectedSubcategory) : ""}
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {getNodeName(selectedSeries)}
              </span>
            </div>
            <h1>{getNodeName(selectedSeries)}</h1>
            <p className="content-subtitle">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "product" : "products"}
            </p>
          </div>
          <div className="content-actions">
            <div className="content-search">
              <input
                type="text"
                placeholder="Filter products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="content-search-input"
              />
            </div>
          </div>
        </div>
        <div className="product-list-container">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const productId = getProductId(product);
              return (
                <ProductCard
                  key={productId}
                  product={product}
                  onClick={() => onProductClick(productId)}
                />
              );
            })
          ) : (
            <div className="empty-state">
              <p>No products found in this series.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedSubcategory) {
    // Show series groups for selected subcategory
    const seriesList = getNodeChildren(selectedSubcategory) || [];
    const filteredSeries = searchQuery.trim()
      ? seriesList.filter((series) => {
          const seriesName = getNodeName(series);
          const products = getNodeProducts(series);
          return (
            seriesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            products.some((p) =>
              getProductName(p).toLowerCase().includes(searchQuery.toLowerCase())
            )
          );
        })
      : seriesList;

    return (
      <div className="browser-content">
        <div className="content-header">
          <div>
            <div className="breadcrumbs">
              <button
                className="breadcrumb-link"
                onClick={() => onCategoryClick(selectedCategoryId)}
              >
                {selectedCategory ? getNodeName(selectedCategory) : ""}
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {getNodeName(selectedSubcategory)}
              </span>
            </div>
            <h1>{getNodeName(selectedSubcategory)}</h1>
            <p className="content-subtitle">
              {filteredSeries.length}{" "}
              {filteredSeries.length === 1 ? "series" : "series"}
            </p>
          </div>
          <div className="content-actions">
            <div className="content-search">
              <input
                type="text"
                placeholder="Filter series..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="content-search-input"
              />
            </div>
          </div>
        </div>
        <div className="browser-list-container">
          {filteredSeries.length > 0 ? (
            filteredSeries.map((series) => {
              const seriesId = getNodeId(series);
              return (
                <SeriesCard
                  key={seriesId}
                  series={series}
                  onClick={() => onSeriesClick(seriesId)}
                />
              );
            })
          ) : (
            <div className="empty-state">
              <p>No series found.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    return (
      <div className="browser-content">
        <div className="content-header">
          <div>
            <div className="breadcrumbs">
              <button
                className="breadcrumb-link"
                onClick={() => onCategoryClick(null)}
              >
                All Products
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {getNodeName(selectedCategory)}
              </span>
            </div>
            <h1>{getNodeName(selectedCategory)}</h1>
            <p className="content-subtitle">
              {(getNodeChildren(selectedCategory)?.length || 0)}{" "}
              {(getNodeChildren(selectedCategory)?.length || 0) === 1
                ? "subcategory"
                : "subcategories"}
            </p>
          </div>
        </div>
        <div className="browser-list-container">
          {(getNodeChildren(selectedCategory) || []).map((subcategory) => {
            const subcategoryId = getNodeId(subcategory);
            return (
              <SubcategoryCard
                key={subcategoryId}
                subcategory={subcategory}
                onClick={() => onSubcategoryClick(subcategoryId)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="browser-content">
      <div className="content-header">
        <div>
          <h1>All Products</h1>
          <p className="content-subtitle">
            Select a category to start browsing
          </p>
        </div>
      </div>
      <div className="browser-list-container">
        {categories.map((category) => {
          const categoryId = getNodeId(category);
          return (
            <CategoryCard
              key={categoryId}
              category={category}
              onClick={() => onCategoryClick(categoryId)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ProductBrowser() {
  const { data, loading, error } = useCategoryTree();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | null
  >(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const categories = useMemo(() => {
    if (!data) return [];
    // Use new 'categories' field if available, fallback to legacy 'structure'
    return data.categories ?? data.structure ?? [];
  }, [data]);

  const totalProducts = useMemo(() => {
    if (!categories.length) return 0;
    return categories.reduce(
      (sum, category) => sum + countAllProducts(category),
      0
    );
  }, [categories]);

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
    setSelectedSeriesId(null);
    setSearchQuery("");
  };

  const handleSubcategoryClick = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
    setSelectedSeriesId(null);
    setSearchQuery("");
  };

  const handleSeriesClick = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setSearchQuery("");
  };

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
    <div className="product-browser">
      <Sidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        selectedSeriesId={selectedSeriesId}
        onCategoryClick={handleCategoryClick}
        onSubcategoryClick={handleSubcategoryClick}
        onSeriesClick={handleSeriesClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalProducts={totalProducts}
      />
      <ContentArea
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        selectedSeriesId={selectedSeriesId}
        searchQuery={searchQuery}
        onProductClick={setSelectedProductId}
        onCategoryClick={handleCategoryClick}
        onSubcategoryClick={handleSubcategoryClick}
        onSeriesClick={handleSeriesClick}
        onSearchChange={setSearchQuery}
      />
      <ProductDetailsModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
}
