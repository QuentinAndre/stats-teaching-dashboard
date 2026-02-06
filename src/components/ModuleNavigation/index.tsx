import { Link } from 'react-router-dom';
import { modules } from '../../config/modules';
import './ModuleNavigation.css';

interface ModuleNavigationProps {
  currentPath: string;
}

export default function ModuleNavigation({ currentPath }: ModuleNavigationProps) {
  const currentIndex = modules.findIndex((m) => m.path === currentPath);
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

  return (
    <nav className="module-navigation" aria-label="Module navigation">
      <Link to="/" className="home-link">
        <svg viewBox="0 0 24 24" className="home-icon" aria-hidden="true">
          <path
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        All Modules
      </Link>

      <div className="module-links">
        {prevModule ? (
          <Link to={prevModule.path} className="nav-link prev">
            <svg viewBox="0 0 24 24" className="nav-icon" aria-hidden="true">
              <path
                d="M15 19l-7-7 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="nav-text">
              <span className="nav-label">Previous</span>
              <span className="nav-title">{prevModule.title}</span>
            </div>
          </Link>
        ) : (
          <div className="nav-placeholder" />
        )}

        {nextModule ? (
          <Link to={nextModule.path} className="nav-link next">
            <div className="nav-text">
              <span className="nav-label">Next</span>
              <span className="nav-title">{nextModule.title}</span>
            </div>
            <svg viewBox="0 0 24 24" className="nav-icon" aria-hidden="true">
              <path
                d="M9 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ) : (
          <div className="nav-placeholder" />
        )}
      </div>
    </nav>
  );
}
