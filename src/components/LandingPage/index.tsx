import { Link } from 'react-router-dom';
import { modules } from '../../config/modules';
import './LandingPage.css';

const moduleIcons: Record<string, React.ReactNode> = {
  'sampling-distributions': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <line x1="16" y1="10" x2="16" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="10" x2="24" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="10" x2="32" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="22" x2="40" y2="22" stroke="var(--accent)" strokeWidth="3" strokeDasharray="4,3" strokeLinecap="round" />
    </svg>
  ),
  'nhst': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <path
        d="M4 40 Q10 40 14 32 Q18 22 24 14 Q30 22 34 32 Q38 40 44 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line x1="34" y1="14" x2="34" y2="40" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 32 Q38 38 44 40 L34 40 Z" fill="var(--accent)" />
    </svg>
  ),
  'outlier-exclusions': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <circle cx="12" cy="24" r="5" fill="currentColor" />
      <circle cx="22" cy="28" r="5" fill="currentColor" />
      <circle cx="17" cy="18" r="5" fill="currentColor" />
      <circle cx="40" cy="24" r="5" fill="var(--accent)" />
      <line x1="36" y1="20" x2="44" y2="28" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <line x1="44" y1="20" x2="36" y2="28" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  'anova': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <rect x="6" y="22" width="10" height="20" fill="currentColor" rx="2" />
      <rect x="19" y="10" width="10" height="32" fill="var(--primary)" rx="2" />
      <rect x="32" y="28" width="10" height="14" fill="var(--accent)" rx="2" />
    </svg>
  ),
  'effect-sizes-power': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <line x1="12" y1="10" x2="12" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="36" y1="10" x2="36" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="24" x2="32" y2="24" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <path d="M19 20 L15 24 L19 28" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M29 20 L33 24 L29 28" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'p-hacking': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <line x1="24" y1="6" x2="24" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="24" x2="12" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="24" x2="36" y2="38" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="36" cy="38" r="5" fill="var(--accent)" />
    </svg>
  ),
  'priad': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <circle cx="8" cy="24" r="6" fill="currentColor" />
      <circle cx="24" cy="24" r="6" fill="currentColor" />
      <circle cx="40" cy="24" r="6" fill="var(--accent)" />
      <line x1="14" y1="24" x2="18" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="24" x2="34" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 24 L39 27 L44 20" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'factorial-anova': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <rect x="6" y="6" width="16" height="16" fill="currentColor" rx="2" />
      <rect x="26" y="6" width="16" height="16" fill="var(--accent)" rx="2" />
      <rect x="6" y="26" width="16" height="16" fill="var(--accent)" rx="2" />
      <rect x="26" y="26" width="16" height="16" fill="currentColor" rx="2" />
    </svg>
  ),
  'continuous-interactions': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <line x1="6" y1="38" x2="42" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="38" x2="6" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="34" x2="40" y2="12" stroke="#4361ee" strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="26" x2="40" y2="20" stroke="#f4a261" strokeWidth="3" strokeLinecap="round" />
      <line x1="26" y1="10" x2="26" y2="38" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4,3" strokeLinecap="round" />
    </svg>
  ),
  'within-subjects': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <circle cx="10" cy="12" r="4" fill="currentColor" />
      <circle cx="38" cy="12" r="4" fill="var(--accent)" />
      <line x1="14" y1="12" x2="34" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="10" cy="24" r="4" fill="currentColor" />
      <circle cx="38" cy="24" r="4" fill="var(--accent)" />
      <line x1="14" y1="24" x2="34" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="10" cy="36" r="4" fill="currentColor" />
      <circle cx="38" cy="36" r="4" fill="var(--accent)" />
      <line x1="14" y1="36" x2="34" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  'mixed-designs': (
    <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
      <circle cx="10" cy="10" r="4" fill="currentColor" />
      <circle cx="38" cy="10" r="4" fill="currentColor" />
      <line x1="14" y1="10" x2="34" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="10" cy="20" r="4" fill="currentColor" />
      <circle cx="38" cy="20" r="4" fill="currentColor" />
      <line x1="14" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="4" y1="26" x2="44" y2="26" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4,3" />
      <circle cx="10" cy="32" r="4" fill="var(--accent)" />
      <circle cx="38" cy="32" r="4" fill="var(--accent)" />
      <line x1="14" y1="32" x2="34" y2="32" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="10" cy="42" r="4" fill="var(--accent)" />
      <circle cx="38" cy="42" r="4" fill="var(--accent)" />
      <line x1="14" y1="42" x2="34" y2="42" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>Statistics Teaching Dashboard</h1>
        <p className="subtitle">
          Interactive visualizations for understanding experimental design
        </p>
      </header>

      <main className="modules-grid">
        {modules.map((module) => (
          <Link to={module.path} key={module.id} className="module-card">
            <div className="module-icon-container">{moduleIcons[module.id]}</div>
            <h2 className="module-title">{module.title}</h2>
            <p className="module-description">{module.description}</p>
            <span className="module-link">
              Explore Module
              <svg
                viewBox="0 0 24 24"
                className="arrow-icon"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        ))}
      </main>

      <footer className="landing-footer">
        <p>
          Built for teaching experimental design concepts through interactive
          simulations.
        </p>
      </footer>
    </div>
  );
}
