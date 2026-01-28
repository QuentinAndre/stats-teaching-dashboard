import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface NavSection {
  id: string;
  label: string;
}

const sections: NavSection[] = [
  { id: 'anova-intro', label: 'From t-Tests to ANOVA' },
  { id: 'two-group', label: 'Two Groups: t² = F' },
  { id: 'variance-partitioning', label: 'Partitioning Variance' },
  { id: 'f-ratio', label: 'The F-Ratio' },
  { id: 'multi-group', label: 'Multiple Groups' },
  { id: 'anova-summary', label: 'The Logic of ANOVA' },
];

export default function NavigationPane() {
  const [activeSection, setActiveSection] = useState<string>('anova-intro');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Toggle button for collapsed mode */}
      <button
        className={`nav-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleNav}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={isOpen}
      >
        <span className="nav-toggle-icon" />
      </button>

      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="nav-overlay-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation pane */}
      <nav
        className={`navigation-pane ${isOpen ? 'open' : ''}`}
        aria-label="Page sections"
      >
        <Link to="/" className="back-to-home">
          <svg
            viewBox="0 0 24 24"
            className="back-icon"
            aria-hidden="true"
          >
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Home
        </Link>
        <ul>
          {sections.map(({ id, label }) => (
            <li key={id}>
              <button
                className={activeSection === id ? 'active' : ''}
                onClick={() => handleNavClick(id)}
                aria-current={activeSection === id ? 'true' : undefined}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
