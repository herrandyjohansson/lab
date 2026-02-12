import { useMemo } from "react";

interface JsonViewerProps {
  data: any;
  className?: string;
}

export function JsonViewer({ data, className = "" }: JsonViewerProps) {
  const highlightedJson = useMemo(() => {
    // Handle null/undefined data
    if (data === null || data === undefined) {
      return [<div key="null" className="json-line"><span className="json-keyword">null</span></div>];
    }

    let jsonString: string;
    try {
      // Use a replacer function to handle circular references and non-serializable values
      const seen = new WeakSet();
      jsonString = JSON.stringify(data, (_key, value) => {
        // Handle circular references
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        // Handle undefined (which JSON.stringify omits by default)
        if (value === undefined) {
          return null;
        }
        // Handle functions
        if (typeof value === "function") {
          return "[Function]";
        }
        return value;
      }, 2);
    } catch (error) {
      console.error("Error stringifying JSON:", error);
      return [
        <div key="error" className="json-line">
          <span className="json-string">Error rendering JSON: {String(error)}</span>
        </div>
      ];
    }
    
    // Split by lines and highlight each line
    const lines = jsonString.split("\n");
    
    return lines.map((line, index) => {
      const parts: Array<{ text: string; type: string }> = [];
      let lastIndex = 0;
      
      // Match keys first (strings followed by colon and optional whitespace)
      const keyRegex = /"([^"\\]|\\.)*"\s*:/g;
      // Match strings (but exclude keys)
      const stringRegex = /"([^"\\]|\\.)*"/g;
      // Match numbers (but not inside strings)
      const numberRegex = /-?\d+\.?\d*(?=\s*[,}\]])/g;
      // Match keywords
      const keywordRegex = /\b(true|false|null)\b/g;
      
      const matches: Array<{ start: number; end: number; type: string }> = [];
      let match;
      
      // Find keys first (highest priority)
      while ((match = keyRegex.exec(line)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: "key",
        });
      }
      
      // Find strings (but skip if they're part of a key)
      while ((match = stringRegex.exec(line)) !== null) {
        const isKey = matches.some(
          (m) => m.type === "key" && m.start <= match!.index && match!.index < m.end
        );
        if (!isKey) {
          // Check if this string overlaps with any existing match
          const overlaps = matches.some(
            (m) => !(match!.index >= m.end || match!.index + match![0].length <= m.start)
          );
          if (!overlaps) {
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              type: "string",
            });
          }
        }
      }
      
      // Find numbers (but skip if inside strings)
      while ((match = numberRegex.exec(line)) !== null) {
        const insideString = matches.some(
          (m) => m.type === "string" && m.start <= match!.index && match!.index < m.end
        );
        if (!insideString) {
          const overlaps = matches.some(
            (m) => !(match!.index >= m.end || match!.index + match![0].length <= m.start)
          );
          if (!overlaps) {
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              type: "number",
            });
          }
        }
      }
      
      // Find keywords
      while ((match = keywordRegex.exec(line)) !== null) {
        const overlaps = matches.some(
          (m) => !(match!.index >= m.end || match!.index + match![0].length <= m.start)
        );
        if (!overlaps) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: "keyword",
          });
        }
      }
      
      // Sort matches by start position
      matches.sort((a, b) => a.start - b.start);
      
      // Build parts array, avoiding overlaps
      matches.forEach((m) => {
        if (m.start > lastIndex) {
          parts.push({
            text: line.substring(lastIndex, m.start),
            type: "text",
          });
        }
        parts.push({
          text: line.substring(m.start, m.end),
          type: m.type,
        });
        lastIndex = Math.max(lastIndex, m.end);
      });
      
      if (lastIndex < line.length) {
        parts.push({
          text: line.substring(lastIndex),
          type: "text",
        });
      }
      
      if (parts.length === 0) {
        parts.push({ text: line, type: "text" });
      }
      
      return (
        <div key={index} className="json-line">
          {parts.map((part, partIndex) => (
            <span key={partIndex} className={`json-${part.type}`}>
              {part.text}
            </span>
          ))}
        </div>
      );
    });
  }, [data]);

  return (
    <pre className={`json-viewer ${className}`}>
      <code className="json-code">{highlightedJson}</code>
    </pre>
  );
}
