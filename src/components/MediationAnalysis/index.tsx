import NavigationPane from './NavigationPane';
import MediationIntro from './sections/MediationIntro';
import TheThreeRegressions from './sections/TheThreeRegressions';
import WhyNotSobel from './sections/WhyNotSobel';
import BootstrapIndirectEffect from './sections/BootstrapIndirectEffect';
import ModuleNavigation from '../ModuleNavigation';
import '../shared/MediationShared.css';

export default function MediationAnalysis() {
  return (
    <div className="mediation-analysis">
      <NavigationPane />

      <header className="mediation-analysis-header">
        <h1>Mediation Analysis</h1>
        <p className="subtitle">
          Simple mediation and the bootstrap test of the indirect effect
        </p>
      </header>

      <main className="mediation-analysis-content">
        <section id="mediation-intro" className="narrative-section">
          <MediationIntro />
        </section>

        <section id="three-regressions" className="narrative-section">
          <TheThreeRegressions />
        </section>

        <section id="why-not-sobel" className="narrative-section">
          <WhyNotSobel />
        </section>

        <section id="bootstrap-indirect" className="narrative-section">
          <BootstrapIndirectEffect />
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
            Preacher &amp; Hayes (2008)
          </a>
          {' '}&mdash; Behavior Research Methods
        </p>
      </footer>

      <ModuleNavigation currentPath="/mediation" />
    </div>
  );
}
