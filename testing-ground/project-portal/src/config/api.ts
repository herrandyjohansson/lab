/**
 * API Configuration
 * Supports switching between PROD and local development environments
 */

export type ApiEnvironment = "local" | "prod";

const API_ENVIRONMENTS = {
  local: "https://localhost:5001",
  prod: "https://axis365offeringportalapi.mangoground-912815eb.northeurope.azurecontainerapps.io",
} as const;

/**
 * Get the current API environment from localStorage or default to 'prod'
 */
function getStoredApiEnvironment(): ApiEnvironment {
  if (typeof window === "undefined") return "prod";

  const stored = localStorage.getItem("apiEnvironment") as ApiEnvironment | null;
  if (stored && (stored === "local" || stored === "prod")) {
    return stored;
  }

  // Default to prod
  return "prod";
}

/**
 * Set the API environment (without reloading)
 */
export function setApiEnvironment(env: ApiEnvironment): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("apiEnvironment", env);
    // Dispatch event for context/hooks to listen
    window.dispatchEvent(new CustomEvent("apiEnvironmentChanged", { detail: env }));
  }
}

/**
 * Get the current API base URL
 */
export function getApiBaseUrl(): string {
  const env = getStoredApiEnvironment();
  return API_ENVIRONMENTS[env];
}

/**
 * Get the current API environment name
 */
export function getApiEnvironment(): ApiEnvironment {
  return getStoredApiEnvironment();
}

/**
 * Build a full API URL
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // PIA endpoints
  rawProducts: () => buildApiUrl("/api/pia/products"),
  productsHierarchy: () => buildApiUrl("/api/pia/products/hierarchy"),
  productDetails: (id: number) => buildApiUrl(`/api/pia/products/${id}`),

  // Product metadata endpoints
  productMetadata: (id: number) => buildApiUrl(`/api/products/${id}/metadata`),

  // User endpoints
  user: (email: string) => buildApiUrl(`/api/user/${email}`),
} as const;

/**
 * Export current environment for display purposes
 */
export function getCurrentEnvironment(): { name: ApiEnvironment; url: string } {
  const env = getApiEnvironment();
  return {
    name: env,
    url: API_ENVIRONMENTS[env],
  };
}
