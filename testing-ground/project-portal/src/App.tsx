import { useState } from "react";
import "./App.css";
import { ProductBrowser } from "./ProductBrowser";
import { ModernProductView } from "./ModernProductView";
import { RawJsonView } from "./RawJsonView";
import { HierarchyJsonView } from "./HierarchyJsonView";
import { CategoryStructureView } from "./CategoryStructureView";
import { ApiEnvironmentSwitcher } from "./components/ApiEnvironmentSwitcher";
import { ApiEnvironmentProvider } from "./contexts/ApiEnvironmentContext";

type ViewMode = "browser" | "modern" | "raw" | "hierarchy" | "structure";

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("modern");

  return (
    <ApiEnvironmentProvider>
      <div className="app">
        <div className="app-header">
          <ApiEnvironmentSwitcher />
        </div>
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === "modern" ? "active" : ""}`}
          onClick={() => setViewMode("modern")}
          aria-label="Data view"
        >
          Data
        </button>
        <button
          className={`toggle-btn ${viewMode === "raw" ? "active" : ""}`}
          onClick={() => setViewMode("raw")}
          aria-label="Raw JSON view"
        >
          Raw JSON
        </button>
        <button
          className={`toggle-btn ${viewMode === "hierarchy" ? "active" : ""}`}
          onClick={() => setViewMode("hierarchy")}
          aria-label="Hierarchy JSON view"
        >
          Hierarchy JSON
        </button>
        <button
          className={`toggle-btn ${viewMode === "structure" ? "active" : ""}`}
          onClick={() => setViewMode("structure")}
          aria-label="Category Structure view"
        >
          Category Structure
        </button>
      </div>
      {viewMode === "modern" ? (
        <ModernProductView />
      ) : viewMode === "raw" ? (
        <RawJsonView />
      ) : viewMode === "hierarchy" ? (
        <HierarchyJsonView />
      ) : viewMode === "structure" ? (
        <CategoryStructureView />
      ) : (
        <ProductBrowser />
      )}
      </div>
    </ApiEnvironmentProvider>
  );
}

export default App;
