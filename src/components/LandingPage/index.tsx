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
    id: 'nhst',
    title: 'Null Hypothesis Significance Testing',
    description:
      'Understand how sampling distributions enable hypothesis testing. Learn the logic of p-values, t-statistics, and statistical decisions.',
    path: '/nhst',
    icon: (
      <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
        {/* Bell curve */}
        <path
          d="M4 38 Q12 38 16 30 Q20 20 24 12 Q28 20 32 30 Q36 38 44 38"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
        />
        {/* Shaded rejection region (right tail) */}
        <path
          d="M34 30 Q38 36 44 38 L44 38 L34 38 Z"
          fill="var(--accent)"
          opacity="0.4"
        />
        {/* Critical line */}
        <line
          x1="34"
          y1="20"
          x2="34"
          y2="38"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="3,2"
        />
        {/* Observed value marker */}
        <circle cx="38" cy="34" r="4" fill="var(--accent)" />
        {/* Center line */}
        <line
          x1="24"
          y1="10"
          x2="24"
          y2="38"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity="0.4"
        />
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
  {
    id: 'anova',
    title: 'Analysis of Variance (ANOVA)',
    description:
      'Understand ANOVA as a tool for partitioning variance. See how between-group and within-group variability combine to test for group differences.',
    path: '/anova',
    icon: (
      <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
        {/* Three groups of bars representing variance partitioning */}
        {/* Group A bars */}
        <rect x="4" y="20" width="4" height="18" fill="currentColor" opacity="0.5" />
        <rect x="9" y="24" width="4" height="14" fill="currentColor" opacity="0.5" />
        <rect x="14" y="22" width="4" height="16" fill="currentColor" opacity="0.5" />
        {/* Group B bars */}
        <rect x="20" y="14" width="4" height="24" fill="var(--primary)" opacity="0.7" />
        <rect x="25" y="18" width="4" height="20" fill="var(--primary)" opacity="0.7" />
        <rect x="30" y="16" width="4" height="22" fill="var(--primary)" opacity="0.7" />
        {/* Group C bars */}
        <rect x="36" y="26" width="4" height="12" fill="var(--accent)" opacity="0.6" />
        <rect x="41" y="28" width="4" height="10" fill="var(--accent)" opacity="0.6" />
        {/* Grand mean line */}
        <line
          x1="2"
          y1="28"
          x2="46"
          y2="28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3,2"
          opacity="0.4"
        />
        {/* Baseline */}
        <line
          x1="2"
          y1="38"
          x2="46"
          y2="38"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />
      </svg>
    ),
  },
  {
    id: 'factorial-anova',
    title: 'Factorial ANOVA',
    description:
      'Explore how multiple factors combine in experimental designs. Understand main effects, interactions, and variance partitioning in 2×2 designs.',
    path: '/factorial-anova',
    icon: (
      <svg viewBox="0 0 48 48" className="module-icon" aria-hidden="true">
        {/* 2x2 grid representing factorial design */}
        <rect x="4" y="4" width="18" height="18" fill="var(--primary)" opacity="0.7" rx="2" />
        <rect x="26" y="4" width="18" height="18" fill="var(--primary)" opacity="0.3" rx="2" />
        <rect x="4" y="26" width="18" height="18" fill="var(--accent)" opacity="0.3" rx="2" />
        <rect x="26" y="26" width="18" height="18" fill="var(--accent)" opacity="0.7" rx="2" />
        {/* Interaction lines */}
        <line x1="13" y1="13" x2="35" y2="35" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        <line x1="35" y1="13" x2="13" y2="35" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        {/* Center dot */}
        <circle cx="24" cy="24" r="4" fill="currentColor" />
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
