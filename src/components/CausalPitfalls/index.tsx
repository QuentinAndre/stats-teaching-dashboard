import NavigationPane from './NavigationPane';
import CausalPitfalls from './sections/CausalPitfalls';
import ConfoundingDemo from './sections/ConfoundingDemo';
import EquivalentModelsDemo from './sections/EquivalentModelsDemo';
import ModuleNavigation from '../ModuleNavigation';
import '../shared/MediationShared.css';

export default function CausalPitfallsModule() {
  return (
    <div className="mediation-analysis">
      <NavigationPane />

      <header className="mediation-analysis-header">
        <h1>Causal Pitfalls of Mediation</h1>
        <p className="subtitle">
          Why a significant indirect effect does not establish causal mediation
        </p>
      </header>

      <main className="mediation-analysis-content">
        <section id="causal-pitfalls" className="narrative-section">
          <CausalPitfalls />
        </section>

        <section id="confounding-demo" className="narrative-section">
          <ConfoundingDemo />
        </section>

        <section id="equivalent-models" className="narrative-section">
          <EquivalentModelsDemo />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Based on{' '}
          <a
            href="https://doi.org/10.1177/25152459221095823"
            target="_blank"
            rel="noopener noreferrer"
          >
            Rohrer et al. (2022)
          </a>
          {' '}&mdash; Advances in Methods and Practices in Psychological Science
        </p>
      </footer>

      <ModuleNavigation currentPath="/causal-pitfalls" />
    </div>
  );
}
