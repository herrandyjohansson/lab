import { useState, useEffect } from "react";
import { useApiEnvironment } from "../contexts/ApiEnvironmentContext";
import type { ApiEnvironment } from "../config/api";

export function ApiEnvironmentSwitcher() {
  const { environment, setEnvironment, environmentInfo } = useApiEnvironment();
  const [isOpen, setIsOpen] = useState(false);

  const handleSwitch = (env: ApiEnvironment) => {
    if (env !== environment) {
      setEnvironment(env);
      setIsOpen(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".api-environment-switcher")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="api-environment-switcher">
      <button
        className="env-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch API environment"
        title={`Current: ${environment.toUpperCase()} (${environmentInfo.url})`}
      >
        <span className="env-label">
          API: <strong>{environment.toUpperCase()}</strong>
        </span>
        <span className="env-indicator" data-env={environment}>
          {environment === "prod" ? "🌐" : "💻"}
        </span>
      </button>
      {isOpen && (
        <div className="env-switcher-menu">
          <div className="env-switcher-header">Select API Environment</div>
          <button
            className={`env-option ${environment === "local" ? "active" : ""}`}
            onClick={() => handleSwitch("local")}
          >
            <span className="env-option-icon">💻</span>
            <div className="env-option-content">
              <div className="env-option-name">Local</div>
              <div className="env-option-url">https://localhost:5001</div>
            </div>
            {environment === "local" && <span className="env-check">✓</span>}
          </button>
          <button
            className={`env-option ${environment === "prod" ? "active" : ""}`}
            onClick={() => handleSwitch("prod")}
          >
            <span className="env-option-icon">🌐</span>
            <div className="env-option-content">
              <div className="env-option-name">Production</div>
              <div className="env-option-url">
                axis365offeringportalapi.mangoground...
              </div>
            </div>
            {environment === "prod" && <span className="env-check">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
