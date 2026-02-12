import { useState, useEffect } from "react";
import type { ProductMetadataDto, ProductMetadataRequestDto } from "./types";
import { API_ENDPOINTS } from "./config/api";
import { useApiEnvironment } from "./contexts/ApiEnvironmentContext";

export function useProductMetadata(productId: number | null) {
  const { environment } = useApiEnvironment();
  const [data, setData] = useState<ProductMetadataDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(API_ENDPOINTS.productMetadata(productId))
      .then((res) => {
        if (res.status === 404) {
          // No metadata exists yet, that's okay
          setData(null);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch metadata: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: ProductMetadataDto | undefined) => {
        setData(data || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching product metadata:", err);
        setError(err.message || "Failed to fetch product metadata");
        setLoading(false);
      });
  }, [productId, environment]); // Refetch when environment or productId changes

  const saveMetadata = async (metadata: ProductMetadataRequestDto): Promise<ProductMetadataDto> => {
    if (!productId) {
      throw new Error("Product ID is required");
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.productMetadata(productId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to save metadata: ${response.statusText}`);
      }

      const savedData: ProductMetadataDto = await response.json();
      setData(savedData);
      setSaving(false);
      return savedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save metadata";
      setError(errorMessage);
      setSaving(false);
      throw err;
    }
  };

  return { data, loading, error, saving, saveMetadata };
}
