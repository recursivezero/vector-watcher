import "@/assets/styles/help.css";

interface HelpProps {
  onClose: () => void;
}

export function Help({ onClose }: HelpProps) {
  return (
    <div className="help-screen">
      <header className="help-header">
        <div>
          <span className="eyebrow">Vector Watcher</span>
          <h1>Help</h1>
          <p>Everything you need to get started with Vector Watcher.</p>
        </div>

        <button type="button" className="button" onClick={onClose}>
          Back
        </button>
      </header>

      <main className="help-content">
        <section className="help-section">
          <span className="help-section__number">01</span>

          <div>
            <h2>Connect to LanceDB</h2>

            <p>Start by opening the Connection tab and entering the details for your LanceDB database.</p>

            <p>Vector Watcher supports local databases and configured remote storage connections.</p>
          </div>
        </section>

        <section className="help-section">
          <span className="help-section__number">02</span>

          <div>
            <h2>Explore your database</h2>

            <p>After connecting, Vector Watcher loads the available tables in your database.</p>

            <p>Select a table to inspect its structure, metadata, and available records.</p>
          </div>
        </section>

        <section className="help-section">
          <span className="help-section__number">03</span>

          <div>
            <h2>Browse records and vectors</h2>

            <p>
              Use the Explorer to browse records, search available data, apply filters, and inspect individual vector
              records.
            </p>

            <p>Vector Watcher provides pagination and sorting controls to help you explore larger tables.</p>
          </div>
        </section>

        <section className="help-section">
          <span className="help-section__number">04</span>

          <div>
            <h2>Saved connections</h2>

            <p>
              Connection configuration can be saved for later use. Sensitive credentials are stored separately using the
              application's secure credential vault.
            </p>
          </div>
        </section>

        <section className="help-section">
          <span className="help-section__number">05</span>

          <div>
            <h2>Working offline</h2>

            <p>An internet connection is not required when working with local LanceDB databases.</p>

            <p>Remote databases and cloud storage connections may require an active internet connection.</p>
          </div>
        </section>

        <section className="help-section">
          <span className="help-section__number">06</span>

          <div>
            <h2>Troubleshooting</h2>

            <p>
              If a connection cannot be established, verify the database path, storage configuration, and credentials.
            </p>

            <p>
              For technical information about your installation, open the About page and copy the diagnostic
              information.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
