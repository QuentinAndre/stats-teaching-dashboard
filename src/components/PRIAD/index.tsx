import NavigationPane from './NavigationPane';
import SampleSizeDilemma from './sections/SampleSizeDilemma';
import WhyPeekingFails from './sections/WhyPeekingFails';
import AdjustedThresholds from './sections/AdjustedThresholds';
import EfficiencyTradeoff from './sections/EfficiencyTradeoff';
import Implementation from './sections/Implementation';
import ModuleNavigation from '../ModuleNavigation';
import './PRIAD.css';

export default function PRIAD() {
  return (
    <div className="priad">
      <NavigationPane />

      <header className="narrative-header">
        <h1>Pre-Registered Interim Analysis Designs (PRIADs)</h1>
        <p className="subtitle">
          Collect data efficiently while maintaining statistical rigor
        </p>
      </header>

      <main className="priad-content">
        <section id="sample-size-dilemma" className="narrative-section">
          <SampleSizeDilemma />
        </section>

        <section id="why-peeking-fails" className="narrative-section">
          <WhyPeekingFails />
        </section>

        <section id="adjusted-thresholds" className="narrative-section">
          <AdjustedThresholds />
        </section>

        <section id="efficiency-tradeoff" className="narrative-section">
          <EfficiencyTradeoff />
        </section>

        <section id="implementation" className="narrative-section">
          <Implementation />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Based on{' '}
          <a
            href="https://doi.org/10.1093/jcr/ucae028"
            target="_blank"
            rel="noopener noreferrer"
          >
            André, Q., & Reinholtz, N. (2024). Pre-Registered Interim Analysis
            Designs (PRIADs): Increasing the Cost-Effectiveness of Hypothesis Testing.{' '}
            <em>Journal of Consumer Research</em>, 51(4), 603–622.
          </a>
        </p>
      </footer>

      <ModuleNavigation currentPath="/priad" />
    </div>
  );
}
