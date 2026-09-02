import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigation } from "@/contexts/NavigationContext";

import "@/assets/styles/header.css";

interface AppHeaderProps {
  connected?: boolean;
  connectionName?: string;
  onDisconnect?: () => void;
}

export function Header({ connected, connectionName, onDisconnect }: AppHeaderProps) {
  const { activePage, navigateHome, navigate } = useNavigation();
  const hasConnectionStatus = typeof connected === "boolean";

  return (
    <header className="app-header">
      <button type="button" className="app-header__brand" onClick={navigateHome}>
        <span className="app-header__brand-mark">◈</span>

        <span className="app-header__brand-content">
          <strong>Vector Watcher</strong>
          <span>LanceDB explorer</span>
        </span>
      </button>

      <div className="app-header__right">
        {hasConnectionStatus && (
          <div className="header-status">
            <span className={`status-dot ${connected ? "is-connected" : ""}`} />
            {connected ? connectionName : "No connection"}
          </div>
        )}

        <div className="app-header__actions">
          <button
            type="button"
            className={`app-header__link ${activePage === "welcome" || activePage === "explorer" ? "app-header__link--active" : ""}`}
            onClick={navigateHome}
          >
            Home
          </button>
          <button
            type="button"
            className={`app-header__link ${activePage === "help" ? "app-header__link--active" : ""}`}
            onClick={() => navigate("help")}
          >
            Help
          </button>

          <button
            type="button"
            className={`app-header__link ${activePage === "about" ? "app-header__link--active" : ""}`}
            onClick={() => navigate("about")}
          >
            About
          </button>
          {connected && onDisconnect && (
            <button type="button" className="app-header__disconnect" onClick={() => void onDisconnect()}>
              <span className="app-header__disconnect-icon">⇥</span>
              Disconnect
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
