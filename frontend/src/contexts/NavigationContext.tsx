/* eslint-disable react-refresh/only-export-components */

import { createContext, type ReactNode, useContext, useState } from "react";

export type AppPage = "welcome" | "explorer" | "help" | "about";

interface NavigationContextValue {
  activePage: AppPage;
  hasExplorerSession: boolean;
  navigate: (page: AppPage) => void;
  navigateHome: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [activePage, setActivePage] = useState<AppPage>("welcome");

  const [hasExplorerSession, setHasExplorerSession] = useState(false);

  const navigate = (page: AppPage) => {
    if (page === "explorer") {
      setHasExplorerSession(true);
    }

    setActivePage(page);
  };

  const navigateHome = () => {
    navigate(hasExplorerSession ? "explorer" : "welcome");
  };

  return (
    <NavigationContext.Provider
      value={{
        activePage,
        hasExplorerSession,
        navigate,
        navigateHome
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigation must be used inside NavigationProvider");
  }

  return context;
}
