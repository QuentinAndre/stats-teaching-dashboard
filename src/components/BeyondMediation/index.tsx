import NavigationPane from './NavigationPane';
import BeyondSimpleMediation from './sections/BeyondSimpleMediation';
import ModeratedMediation from './sections/ModeratedMediation';
import ModuleNavigation from '../ModuleNavigation';
import '../shared/MediationShared.css';

export default function BeyondMediationModule() {
  return (
    <div className="mediation-analysis">
      <NavigationPane />

      <header className="mediation-analysis-header">
        <h1>Beyond Simple Mediation</h1>
        <p className="subtitle">
          Parallel mediation, serial mediation, and moderated mediation
        </p>
      </header>

      <main className="mediation-analysis-content">
        <section id="beyond-simple" className="narrative-section">
          <BeyondSimpleMediation />
        </section>

        <section id="moderated-mediation" className="narrative-section">
          <ModeratedMediation />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Based on{' '}
          <a
            href="https://doi.org/10.1080/10478400701598298"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hayes (2018)
          </a>
          {' '}&mdash; Introduction to Mediation, Moderation, and Conditional Process Analysis
        </p>
      </footer>

      <ModuleNavigation currentPath="/beyond-mediation" />
    </div>
  );
}
