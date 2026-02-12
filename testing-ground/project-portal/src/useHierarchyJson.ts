import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "./config/api";
import { useApiEnvironment } from "./contexts/ApiEnvironmentContext";

// Helper function to sanitize data and detect issues
function sanitizeData(data: any, depth = 0): { data: any; warnings: string[] } {
  const warnings: string[] = [];
  
  if (depth > 50) {
    warnings.push("Maximum depth exceeded - data may be truncated");
    return { data: "[Max Depth]", warnings };
  }

  if (data === null || data === undefined) {
    return { data, warnings };
  }

  // Handle primitives
  if (typeof data !== "object") {
    return { data, warnings };
  }

  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length > 10000) {
      warnings.push(`Large array detected: ${data.length} items`);
    }
    const sanitized = data.map((item, index) => {
      if (index < 100) { // Only process first 100 items deeply
        return sanitizeData(item, depth + 1).data;
      }
      return item;
    });
    return { data: sanitized, warnings };
  }

  // Handle objects
  const sanitized: any = {};
  const seen = new WeakSet();
  
  try {
    for (const [key, value] of Object.entries(data)) {
      // Check for circular references
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          sanitized[key] = "[Circular Reference]";
          warnings.push(`Circular reference detected at key: ${key}`);
          continue;
        }
        seen.add(value);
      }

      // Handle non-serializable values
      if (typeof value === "function") {
        sanitized[key] = "[Function]";
        warnings.push(`Function found at key: ${key}`);
        continue;
      }

      if (typeof value === "symbol") {
        sanitized[key] = "[Symbol]";
        warnings.push(`Symbol found at key: ${key}`);
        continue;
      }

      // Recursively sanitize nested objects
      const result = sanitizeData(value, depth + 1);
      sanitized[key] = result.data;
      warnings.push(...result.warnings);
    }
  } catch (err) {
    warnings.push(`Error sanitizing data: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { data: sanitized, warnings };
}

export function useHierarchyJson() {
  const { environment } = useApiEnvironment();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setWarnings([]);

    fetch(API_ENDPOINTS.productsHierarchy())
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((rawData) => {
        console.log("Raw API response received:", {
          type: typeof rawData,
          isArray: Array.isArray(rawData),
          keys: typeof rawData === "object" && rawData !== null ? Object.keys(rawData) : [],
          size: JSON.stringify(rawData).length,
        });

        // Sanitize the data
        const { data: sanitized, warnings: dataWarnings } = sanitizeData(rawData);
        
        if (dataWarnings.length > 0) {
          console.warn("Data sanitization warnings:", dataWarnings);
          setWarnings(dataWarnings);
        }

        setData(sanitized);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching hierarchy JSON:", err);
        setError(err.message || "Failed to fetch hierarchy JSON");
        setLoading(false);
      });
  }, [environment]); // Refetch when environment changes

  return { data, loading, error, warnings };
}
