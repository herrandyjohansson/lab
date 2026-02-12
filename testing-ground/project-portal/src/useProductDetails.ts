import { useState, useEffect } from "react";
import type { ProductDetailsDto } from "./types";
import { API_ENDPOINTS } from "./config/api";
import { useApiEnvironment } from "./contexts/ApiEnvironmentContext";

export function useProductDetails(productId: number | null) {
  const { environment } = useApiEnvironment();
  const [data, setData] = useState<ProductDetailsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(API_ENDPOINTS.productDetails(productId))
      .then((res) => {
        if (res.status === 404) {
          throw new Error(`Product ${productId} not found`);
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch product: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: ProductDetailsDto) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching product details:", err);
        setError(err.message || "Failed to fetch product details");
        setLoading(false);
      });
  }, [productId, environment]); // Refetch when environment or productId changes

  return { data, loading, error };
}
