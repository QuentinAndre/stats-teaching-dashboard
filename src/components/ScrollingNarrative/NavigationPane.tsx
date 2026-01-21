import { useState, useEffect } from 'react';
import './NavigationPane.css';

interface NavSection {
  id: string;
  label: string;
}

const sections: NavSection[] = [
  { id: 'sampling-intro', label: 'What is Sampling?' },
  { id: 'sampling-distribution', label: 'The Sampling Distribution' },
  { id: 'skewed-sampling', label: 'Skewed Populations' },
  { id: 'heterogeneity-comparison', label: 'Population Variability' },
  { id: 'sample-size-comparison', label: 'Sample Size' },
  { id: 'sampling-summary', label: 'Putting It Together' },
];

export default function NavigationPane() {
  const [activeSection, setActiveSection] = useState<string>('sampling-intro');
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
