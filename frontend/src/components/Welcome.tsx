import { useNavigation } from "@/contexts/NavigationContext";
import { useEffect, useState } from "react";

import "@/assets/styles/welcome.css";
import { Footer } from "./Footer";
import { Header } from "./Header";

const getConnectionStatus = () => navigator.onLine;

export const Welcome = () => {
  const { navigate } = useNavigation();
  const [isOnline, setIsOnline] = useState(getConnectionStatus);

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

  return (
    <div className="welcome-screen">
      <Header />
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
            <button
              type="button"
              className="button button-primary welcome-actions__start"
              onClick={() => navigate("explorer")}
            >
              Start exploring
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
