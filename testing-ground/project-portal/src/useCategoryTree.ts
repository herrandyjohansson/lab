import { useState, useEffect } from "react";
import type { CategoryTreeResponse } from "./types";
import { API_ENDPOINTS } from "./config/api";
import { useApiEnvironment } from "./contexts/ApiEnvironmentContext";

export function useCategoryTree() {
  const { environment } = useApiEnvironment();
  const [data, setData] = useState<CategoryTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(API_ENDPOINTS.productsHierarchy())
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: CategoryTreeResponse) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching category tree:", err);
        setError(err.message || "Failed to fetch category tree");
        setLoading(false);
      });
  }, [environment]); // Refetch when environment changes

  return { data, loading, error };
}
