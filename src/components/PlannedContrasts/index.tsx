import NavigationPane from './NavigationPane';
import ContrastsIntro from './sections/ContrastsIntro';
import DefiningContrasts from './sections/DefiningContrasts';
import ContrastTestStatistic from './sections/ContrastTestStatistic';
import OrthogonalContrasts from './sections/OrthogonalContrasts';
import ContrastsSummary from './sections/ContrastsSummary';
import ModuleNavigation from '../ModuleNavigation';
import './PlannedContrasts.css';

export default function PlannedContrasts() {
  return (
    <div className="planned-contrasts">
      <NavigationPane />

      <header className="planned-contrasts-header">
        <h1>Planned Contrasts</h1>
        <p className="subtitle">
          Asking specific, theory-driven questions about group differences
        </p>
      </header>

      <main className="planned-contrasts-content">
        <section id="contrasts-intro" className="narrative-section">
          <ContrastsIntro />
        </section>

        <section id="defining-contrasts" className="narrative-section">
          <DefiningContrasts />
        </section>

        <section id="contrast-test" className="narrative-section">
          <ContrastTestStatistic />
        </section>

        <section id="orthogonal-contrasts" className="narrative-section">
          <OrthogonalContrasts />
        </section>

        <section id="contrasts-summary" className="narrative-section">
          <ContrastsSummary />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Contrast methods following Keppel &amp; Wickens (2004), Chapter 6
        </p>
      </footer>

      <ModuleNavigation currentPath="/planned-contrasts" />
    </div>
  );
}
