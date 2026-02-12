import { useState, useEffect } from "react";
import categoryStructureData from "../pia-category-structure.json";

export function CategoryStructureView() {
  const [jsonString, setJsonString] = useState("");

  useEffect(() => {
    try {
      setJsonString(JSON.stringify(categoryStructureData, null, 2));
    } catch (err) {
      setJsonString(
        `Error: Could not stringify JSON data. ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }, []);

  return (
    <div className="view-container">
      <div className="raw-json-container">
        <div className="raw-json-header">
          <h1>PIA Category Structure</h1>
          <p className="content-subtitle">
            Category structure from pia-category-structure.json
          </p>
        </div>
        <div className="raw-json-content">
          <pre
            style={{
              margin: 0,
              padding: "1rem",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              overflow: "auto",
              fontSize: "14px",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
}
