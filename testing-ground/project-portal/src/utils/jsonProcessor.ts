/**
 * Utility functions for processing large JSON data safely
 */

interface ProcessingOptions {
  maxDepth?: number;
  maxArrayLength?: number;
  maxStringLength?: number;
  truncateStrings?: boolean;
}

interface ProcessedData {
  data: any;
  truncated: boolean;
  stats: {
    originalSize: number;
    processedSize: number;
    arraysTruncated: number;
    depthLimitReached: boolean;
  };
}

/**
 * Safely process JSON data by limiting depth and array sizes
 */
export function processLargeJson(
  data: any,
  options: ProcessingOptions = {}
): ProcessedData {
  const {
    maxDepth = 10,
    maxArrayLength = 1000,
    maxStringLength = 1000,
    truncateStrings = true,
  } = options;

  let arraysTruncated = 0;
  let depthLimitReached = false;
  const originalSize = JSON.stringify(data).length;

  function processValue(value: any, depth: number): any {
    if (depth > maxDepth) {
      depthLimitReached = true;
      return "[Max Depth Reached]";
    }

    if (value === null || value === undefined) {
      return value;
    }

    // Handle strings
    if (typeof value === "string") {
      if (truncateStrings && value.length > maxStringLength) {
        return value.substring(0, maxStringLength) + `... [truncated ${value.length - maxStringLength} chars]`;
      }
      return value;
    }

    // Handle numbers, booleans
    if (typeof value !== "object") {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length > maxArrayLength) {
        arraysTruncated++;
        const truncated = value.slice(0, maxArrayLength);
        truncated.push({
          _truncated: `[${value.length - maxArrayLength} more items...]`,
        });
        return truncated.map((item) => processValue(item, depth + 1));
      }
      return value.map((item) => processValue(item, depth + 1));
    }

    // Handle objects
    const processed: any = {};
    for (const [key, val] of Object.entries(value)) {
      processed[key] = processValue(val, depth + 1);
    }
    return processed;
  }

  const processed = processValue(data, 0);
  const processedSize = JSON.stringify(processed).length;

  return {
    data: processed,
    truncated: arraysTruncated > 0 || depthLimitReached,
    stats: {
      originalSize,
      processedSize,
      arraysTruncated,
      depthLimitReached,
    },
  };
}

/**
 * Estimate JSON size in MB
 */
export function estimateJsonSize(data: any): number {
  try {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size / (1024 * 1024);
  } catch {
    return 0;
  }
}

/**
 * Check if data is too large to render safely
 */
export function isDataTooLarge(data: any, thresholdMB: number = 10): boolean {
  return estimateJsonSize(data) > thresholdMB;
}
