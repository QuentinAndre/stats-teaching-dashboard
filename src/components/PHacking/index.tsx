import NavigationPane from './NavigationPane';
import PHackingIntro from './sections/PHackingIntro';
import DegreesOfFreedom from './sections/DegreesOfFreedom';
import PHackingSimulation from './sections/PHackingSimulation';
import PreRegistration from './sections/PreRegistration';
import ModuleNavigation from '../ModuleNavigation';
import './PHacking.css';

export default function PHacking() {
  return (
    <div className="p-hacking">
      <NavigationPane />

      <header className="narrative-header">
        <h1>P-Hacking and Researcher Degrees of Freedom</h1>
        <p className="subtitle">
          How analytic flexibility inflates false-positive rates
        </p>
      </header>

      <main className="p-hacking-content">
        <section id="p-hacking-intro" className="narrative-section">
          <PHackingIntro />
        </section>

        <section id="degrees-of-freedom" className="narrative-section">
          <DegreesOfFreedom />
        </section>

        <section id="simulation" className="narrative-section">
          <PHackingSimulation />
        </section>

        <section id="pre-registration" className="narrative-section">
          <PreRegistration />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Based on{' '}
          <a
            href="https://doi.org/10.1177/0956797611417632"
            target="_blank"
            rel="noopener noreferrer"
          >
            Simmons, Nelson, & Simonsohn (2011): False-Positive Psychology
          </a>
          {' '}and{' '}
          <a
            href="https://doi.org/10.1037/a0021524"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bem (2011): Feeling the Future
          </a>
        </p>
      </footer>

      <ModuleNavigation currentPath="/p-hacking" />
    </div>
  );
}
