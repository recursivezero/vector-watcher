import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";

import { formatDiagnosticInfo, getAppInfo, type AppInfo } from "@/libs/info";

import "@/assets/styles/about.css";
import { useNavigation } from "@/contexts/NavigationContext";

export const About = () => {
  const { navigateHome } = useNavigation();

  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const loadAppInfo = async () => {
      try {
        const info = await getAppInfo();

        setAppInfo(info);
      } catch {
        setAppInfo({
          version: "Unavailable",
          platform: navigator.platform
        });
      }
    };

    void loadAppInfo();
  }, []);

  useEffect(() => {
    const handleLoadAppInfo = async () => {
      try {
        const info = await getAppInfo();

        setAppInfo(info);
      } catch {
        setAppInfo({
          version: "Unavailable",
          platform: navigator.platform
        });
      }
    };

    void handleLoadAppInfo();
  }, []);

  const handleCopyDiagnostics = async () => {
    if (!appInfo) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formatDiagnosticInfo(appInfo));

      setCopyStatus("Copied");

      window.setTimeout(() => {
        setCopyStatus("");
      }, 2000);
    } catch {
      setCopyStatus("Unable to copy");
    }
  };

  return (
    <div className="about-screen">
      <Header />

      <main className="about-main">
        <div className="about-content">
          <section className="about-hero">
            <div className="about-hero__mark">◈</div>

            <div>
              <span className="eyebrow">Recursive Zero</span>

              <h1>Vector Watcher</h1>

              <p>A desktop application for connecting to and exploring LanceDB vector databases.</p>
            </div>
          </section>

          <section className="about-section">
            <h2>About Vector Watcher</h2>

            <p>Vector Watcher provides a desktop interface for connecting to local and remote LanceDB databases.</p>

            <p>
              Explore database tables, inspect records and metadata, and work with vector data from a single desktop
              application.
            </p>
          </section>

          <section className="about-section">
            <h2>Application</h2>

            <div className="about-details">
              <div className="about-detail">
                <span className="about-detail__label">Application</span>
                <span className="about-detail__value">Vector Watcher</span>
              </div>

              <div className="about-detail">
                <span className="about-detail__label">Version</span>
                <span className="about-detail__value">{appInfo?.version ?? "Loading..."}</span>
              </div>

              <div className="about-detail">
                <span className="about-detail__label">Platform</span>
                <span className="about-detail__value">{appInfo?.platform ?? "Loading..."}</span>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Technology</h2>

            <div className="about-details">
              <div className="about-detail">
                <span className="about-detail__label">Desktop</span>
                <span className="about-detail__value">Tauri</span>
              </div>

              <div className="about-detail">
                <span className="about-detail__label">Frontend</span>
                <span className="about-detail__value">React + TypeScript</span>
              </div>

              <div className="about-detail">
                <span className="about-detail__label">Backend</span>
                <span className="about-detail__value">Python</span>
              </div>

              <div className="about-detail">
                <span className="about-detail__label">Database</span>
                <span className="about-detail__value">LanceDB</span>
              </div>
            </div>
          </section>
          <section className="about-section">
            <div className="about-section__heading">
              <div>
                <h2>Diagnostics</h2>

                <p>Copy application information when reporting an issue.</p>
              </div>

              <button type="button" className="button" onClick={() => void handleCopyDiagnostics()} disabled={!appInfo}>
                {copyStatus || "Copy diagnostics"}
              </button>
            </div>
          </section>

          <section className="about-section">
            <h2>Support</h2>

            <p>For help using Vector Watcher, visit the Help section or contact support.</p>

            <div className="about-support">
              <a className="about-support__email" href="mailto:support@recursivezero.com">
                support@recursivezero.com
              </a>
            </div>
            <button type="button" className="button" onClick={navigateHome}>
              Go to Home
            </button>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
