import { useState, useMemo, useCallback } from "react";
import JsonView from "@uiw/react-json-view";
import { useHierarchyJson } from "./useHierarchyJson";
import { ErrorBoundary } from "./ErrorBoundary";
import {
  processLargeJson,
  estimateJsonSize,
} from "./utils/jsonProcessor";

export function HierarchyJsonView() {
  const { data, loading, error, warnings } = useHierarchyJson();
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [maxArrayLength, setMaxArrayLength] = useState(500);
  const [appliedMaxArrayLength, setAppliedMaxArrayLength] = useState(500);
  const [showObjectSize, setShowObjectSize] = useState(false);

  // Process data with full depth, only limit array length
  const processedData = useMemo(() => {
    if (!data) return null;

    const sizeInMB = estimateJsonSize(data);
    console.log(`JSON size: ${sizeInMB.toFixed(2)}MB`);

    // Process with full depth, only limit array length
    const result = processLargeJson(data, {
      maxDepth: 9999, // Effectively unlimited depth
      maxArrayLength: appliedMaxArrayLength,
      maxStringLength: 500,
      truncateStrings: true,
    });

    if (result.truncated) {
      console.warn("Data was truncated:", result.stats);
    }

    return result.data;
  }, [data, appliedMaxArrayLength]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!processedData || !searchQuery.trim()) return processedData;

    const query = searchQuery.toLowerCase();
    const filterObject = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;

      if (Array.isArray(obj)) {
        const filtered = obj
          .map(filterObject)
          .filter((item) => item !== null && item !== undefined);
        return filtered.length > 0 ? filtered : null;
      }

      if (typeof obj === "object") {
        const filtered: any = {};
        let hasMatch = false;

        for (const [key, value] of Object.entries(obj)) {
          const keyMatch = key.toLowerCase().includes(query);
          
          if (typeof value === "string" && value.toLowerCase().includes(query)) {
            filtered[key] = value;
            hasMatch = true;
          } else if (typeof value === "number" && value.toString().includes(query)) {
            filtered[key] = value;
            hasMatch = true;
          } else if (typeof value === "object" && value !== null) {
            const filteredValue = filterObject(value);
            if (filteredValue !== null && filteredValue !== undefined) {
              filtered[key] = filteredValue;
              hasMatch = true;
            } else if (keyMatch) {
              filtered[key] = value;
              hasMatch = true;
            }
          } else if (keyMatch) {
            filtered[key] = value;
            hasMatch = true;
          }
        }

        return hasMatch ? filtered : null;
      }

      const stringValue = String(obj).toLowerCase();
      return stringValue.includes(query) ? obj : null;
    };

    return filterObject(processedData);
  }, [processedData, searchQuery]);

  // Apply max array length changes
  const handleApplyArrayLength = useCallback(() => {
    setAppliedMaxArrayLength(maxArrayLength);
  }, [maxArrayLength]);

  // Expand/collapse all
  const handleToggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Toggle object size display
  const handleToggleObjectSize = useCallback(() => {
    setShowObjectSize((prev) => !prev);
  }, []);

  if (loading) {
    return (
      <div className="view-container">
        <div className="hierarchy-json-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading hierarchy JSON data...</div>
          <div className="loading-subtitle">This may take a moment for large datasets</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-container">
        <div className="hierarchy-json-error">
          <div className="error-icon">⚠️</div>
          <div className="error-title">Error Loading Data</div>
          <div className="error-message">{error}</div>
          <div className="error-hint">
            Make sure the API is running
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="view-container">
        <div className="hierarchy-json-error">
          <div className="error-icon">📭</div>
          <div className="error-title">No Data Available</div>
          <div className="error-message">The API returned no data</div>
        </div>
      </div>
    );
  }

  // Show warnings if any
  const showWarnings = warnings.length > 0;

  return (
    <ErrorBoundary>
      <div className="view-container">
        <div className="hierarchy-json-container">
          <div className="hierarchy-json-header">
            <div className="header-content">
              <h1>Hierarchy JSON Data</h1>
              <p className="content-subtitle">
                Data from /api/pia/products/hierarchy
                {data && (
                  <span className="data-size">
                    {" "}
                    ({estimateJsonSize(data).toFixed(2)} MB)
                  </span>
                )}
              </p>
              {showWarnings && (
                <div className="warnings-banner">
                  <strong>⚠️ Warnings:</strong> {warnings.length} issue(s) detected in data structure
                </div>
              )}
            </div>
            <div className="header-actions">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search JSON..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="search-clear-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="array-length-controls">
                <label className="array-length-label">
                  Max Array Length:
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    value={maxArrayLength}
                    onChange={(e) => setMaxArrayLength(Number(e.target.value))}
                    className="control-input"
                  />
                </label>
                <button
                  className="action-btn"
                  onClick={handleApplyArrayLength}
                  disabled={maxArrayLength === appliedMaxArrayLength}
                >
                  Apply
                </button>
              </div>
              <button
                className="action-btn"
                onClick={handleToggleExpand}
                aria-label={expanded ? "Collapse all" : "Expand all"}
              >
                {expanded ? "Collapse All" : "Expand All"}
              </button>
              <button
                className={`action-btn ${showObjectSize ? "active" : ""}`}
                onClick={handleToggleObjectSize}
                aria-label={showObjectSize ? "Hide item counts" : "Show item counts"}
              >
                {showObjectSize ? "Hide Counts" : "Show Counts"}
              </button>
            </div>
          </div>
          {renderError ? (
            <div className="hierarchy-json-content">
              <div className="hierarchy-json-error">
                <div className="error-icon">💥</div>
                <div className="error-title">Rendering Error</div>
                <div className="error-message">{renderError}</div>
                <button
                  className="action-btn"
                  onClick={() => {
                    setRenderError(null);
                    window.location.reload();
                  }}
                  style={{ marginTop: "1rem" }}
                >
                  Reload Page
                </button>
              </div>
            </div>
          ) : (
            <div className="hierarchy-json-content">
              {filteredData === null ? (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <div className="no-results-text">No results found for "{searchQuery}"</div>
                </div>
              ) : (
                <>
                  {useFallback ? (
                    <div className="json-viewer-wrapper">
                      <div style={{ padding: "1rem", background: "#fff3cd", borderRadius: "4px", marginBottom: "1rem" }}>
                        <strong>⚠️ Large Dataset Mode:</strong> Using simplified JSON viewer due to data size.
                        <button
                          className="action-btn"
                          onClick={() => setUseFallback(false)}
                          style={{ marginLeft: "1rem", fontSize: "0.85rem", padding: "0.25rem 0.5rem" }}
                        >
                          Try Advanced Viewer
                        </button>
                      </div>
                      <pre
                        style={{
                          background: "#1e1e1e",
                          color: "#d4d4d4",
                          padding: "1rem",
                          borderRadius: "8px",
                          overflow: "auto",
                          maxHeight: "100%",
                          fontSize: "0.85rem",
                          fontFamily: "Monaco, Menlo, monospace",
                          lineHeight: "1.6",
                        }}
                      >
                        {JSON.stringify(filteredData, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="json-viewer-wrapper">
                      <ErrorBoundary
                        fallback={
                          <div className="hierarchy-json-error">
                            <div className="error-icon">💥</div>
                            <div className="error-title">JSON Viewer Error</div>
                            <div className="error-message">
                              The JSON viewer encountered an error. The data structure may be too complex or contain invalid values.
                            </div>
                            <button
                              className="action-btn"
                              onClick={() => setUseFallback(true)}
                              style={{ marginTop: "1rem" }}
                            >
                              Use Fallback Viewer
                            </button>
                            <details style={{ marginTop: "1rem", textAlign: "left" }}>
                              <summary style={{ cursor: "pointer", marginBottom: "0.5rem" }}>
                                Show raw JSON (fallback)
                              </summary>
                              <pre
                                style={{
                                  background: "#1e1e1e",
                                  color: "#d4d4d4",
                                  padding: "1rem",
                                  borderRadius: "4px",
                                  overflow: "auto",
                                  maxHeight: "400px",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {JSON.stringify(filteredData, null, 2)}
                              </pre>
                            </details>
                          </div>
                        }
                      >
                        <div style={{ padding: "1rem", backgroundColor: "#1e1e1e" }}>
                          <JsonView
                            value={filteredData}
                            style={{
                              backgroundColor: "#1e1e1e",
                              color: "#ffffff",
                              maxHeight: "100%",
                              overflow: "auto",
                            }}
                            displayDataTypes={false}
                            displayObjectSize={showObjectSize}
                            enableClipboard={true}
                            collapsed={expanded ? 0 : 3}
                          />
                        </div>
                      </ErrorBoundary>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
