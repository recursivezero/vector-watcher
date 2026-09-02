import "@/assets/styles/footer.css";

export const Footer = () => {
  return (
    <footer className="app-footer">
      <span>© {new Date().getFullYear()} Recursive Zero</span>

      <span className="app-footer__separator">·</span>

      <span>Vector Watcher</span>

      <span className="app-footer__separator">·</span>

      <span>MIT License</span>

      <span className="app-footer__separator">·</span>

      <a
        href="https://github.com/recursivezero/vector-watcher"
        target="_blank"
        rel="noopener noreferrer"
        className="app-footer__github"
        aria-label="View Vector Watcher on GitHub"
        title="View source code on GitHub"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-1.026-.013-1.862-2.782.604-3.369-1.18-3.369-1.18-.455-1.156-1.11-1.464-1.11-1.464-.908-.621.069-.608.069-.608 1.004.07 1.532 1.031 1.532 1.031.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.337-2.221-.253-4.556-1.111-4.556-4.943 0-1.092.39-1.985 1.029-2.685-.103-.253-.446-1.271.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.756a9.59 9.59 0 0 1 2.504.337c1.909-1.295 2.748-1.026 2.748-1.026.546 1.379.203 2.397.1 2.65.64.7 1.028 1.593 1.028 2.685 0 3.841-2.339 4.687-4.566 4.935.359.31.678.919.678 1.852 0 1.337-.012 2.415-.012 2.744 0 .267.18.578.688.48A10.001 10.001 0 0 0 22 12c0-5.523-4.477-10-10-10Z" />
        </svg>

        <span>GitHub</span>
      </a>
    </footer>
  );
};
