import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  getCurrentEnvironment,
  setApiEnvironment as setStoredApiEnvironment,
  type ApiEnvironment,
} from "../config/api";

interface ApiEnvironmentContextType {
  environment: ApiEnvironment;
  setEnvironment: (env: ApiEnvironment) => void;
  environmentInfo: { name: ApiEnvironment; url: string };
}

const ApiEnvironmentContext = createContext<ApiEnvironmentContextType | undefined>(
  undefined
);

export function ApiEnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironmentState] = useState<ApiEnvironment>(() => {
    return getCurrentEnvironment().name;
  });

  const [environmentInfo, setEnvironmentInfo] = useState(() => {
    return getCurrentEnvironment();
  });

  // Listen for storage changes (in case of multiple tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "apiEnvironment") {
        const newEnv = (e.newValue as ApiEnvironment) || "prod";
        setEnvironmentState(newEnv);
        setEnvironmentInfo(getCurrentEnvironment());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setEnvironment = (env: ApiEnvironment) => {
    setStoredApiEnvironment(env);
    setEnvironmentState(env);
    setEnvironmentInfo(getCurrentEnvironment());
    // Dispatch custom event for hooks to listen
    window.dispatchEvent(new CustomEvent("apiEnvironmentChanged", { detail: env }));
  };

  return (
    <ApiEnvironmentContext.Provider
      value={{
        environment,
        setEnvironment,
        environmentInfo,
      }}
    >
      {children}
    </ApiEnvironmentContext.Provider>
  );
}

export function useApiEnvironment() {
  const context = useContext(ApiEnvironmentContext);
  if (context === undefined) {
    throw new Error("useApiEnvironment must be used within ApiEnvironmentProvider");
  }
  return context;
}
