import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "./config/api";
import { useApiEnvironment } from "./contexts/ApiEnvironmentContext";

export function useRawProducts() {
  const { environment } = useApiEnvironment();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(API_ENDPOINTS.rawProducts())
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching raw products:", err);
        setError(err.message || "Failed to fetch raw products");
        setLoading(false);
      });
  }, [environment]); // Refetch when environment changes

  return { data, loading, error };
}
