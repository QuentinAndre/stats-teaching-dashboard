import { Link } from 'react-router-dom';
import './LandingPage.css';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

const modules: ModuleCard[] = [
  {
    id: 'sampling-distributions',
    title: 'Sampling Distributions',
    description:
      'Explore how sample means vary and why larger samples give more precise estimates. Visualize the Central Limit Theorem in action.',
    path: '/sampling-distributions',
    icon: (
      <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
        <path
          d="M4 34 Q12 10 24 24 Q36 38 44 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="8" cy="30" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="16" cy="20" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <circle cx="32" cy="28" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="40" cy="18" r="3" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'outlier-exclusions',
    title: 'Outlier Exclusions',
    description:
      'Learn why outlier exclusion procedures must be blind to experimental conditions. See how improper exclusions inflate false positive rates.',
    path: '/outlier-exclusions',
    icon: (
      <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
        <line
          x1="4"
          y1="36"
          x2="44"
          y2="36"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />
        <circle cx="10" cy="28" r="4" fill="currentColor" opacity="0.6" />
        <circle cx="18" cy="26" r="4" fill="currentColor" opacity="0.6" />
        <circle cx="26" cy="27" r="4" fill="currentColor" opacity="0.6" />
        <circle cx="34" cy="25" r="4" fill="currentColor" opacity="0.6" />
        <circle cx="40" cy="10" r="5" fill="var(--accent)" />
        <line
          x1="36"
          y1="6"
          x2="44"
          y2="14"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="44"
          y1="6"
          x2="36"
          y2="14"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

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
            <div className="module-icon-container">{module.icon}</div>
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
