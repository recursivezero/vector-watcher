import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components//ThemeToggle";
import { Help } from "@/components/Help";

import "@/assets/styles/welcome.css";
import { Footer } from "./Footer";

interface WelcomeProps {
  onStart: () => void;
}

const getConnectionStatus = () => navigator.onLine;

export function Welcome({ onStart }: WelcomeProps) {
  const [isOnline, setIsOnline] = useState(getConnectionStatus);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (showHelp) {
    return <Help onClose={() => setShowHelp(false)} />;
  }

  return (
    <div className="welcome-screen">
      <header className="welcome-topbar">
        <div className="welcome-topbar__brand">Vector Watcher</div>

        <ThemeToggle />
      </header>
      <main className="welcome-main">
        <div className="welcome-card">
          <div className="welcome-brand">
            <div className="welcome-brand__mark">◈</div>

            <div>
              <span className="eyebrow">Recursive Zero</span>
              <h1>Vector Watcher</h1>
              <p>LanceDB explorer</p>
            </div>
          </div>

          <div className="welcome-content">
            <h2>Explore your vector databases.</h2>

            <p>Connect to local or remote LanceDB databases and explore tables, records, vectors, and metadata.</p>
          </div>

          <div className={`welcome-network ${isOnline ? "is-online" : "is-offline"}`}>
            <span className="welcome-network__dot" />

            <div>
              <strong>{isOnline ? "Internet connection available" : "No internet connection"}</strong>

              <p>
                {isOnline
                  ? "You can connect to local and remote LanceDB databases."
                  : "Local LanceDB databases can still be used while offline."}
              </p>
            </div>
          </div>

          <div className="welcome-actions">
            <button type="button" className="button button-primary welcome-actions__start" onClick={onStart}>
              Start exploring
            </button>

            <div className="welcome-actions__secondary">
              <button type="button" className="welcome-link" onClick={() => setShowHelp(true)}>
                Help
              </button>

              <span aria-hidden="true">·</span>

              <button type="button" className="welcome-link">
                About
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
