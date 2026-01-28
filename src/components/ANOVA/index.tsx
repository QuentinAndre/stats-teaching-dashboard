import NavigationPane from './NavigationPane';
import ANOVAIntro from './sections/ANOVAIntro';
import TwoGroupANOVA from './sections/TwoGroupANOVA';
import VariancePartitioning from './sections/VariancePartitioning';
import TheFRatio from './sections/TheFRatio';
import MultiGroupANOVA from './sections/MultiGroupANOVA';
import ANOVASummary from './sections/ANOVASummary';
import ModuleNavigation from '../ModuleNavigation';
import './ANOVA.css';

export default function ANOVA() {
  return (
    <div className="anova">
      <NavigationPane />

      <header className="anova-header">
        <h1>Analysis of Variance (ANOVA)</h1>
        <p className="subtitle">
          Understanding ANOVA as a tool for partitioning variance into meaningful sources
        </p>
      </header>

      <main className="anova-content">
        <section id="anova-intro" className="narrative-section">
          <ANOVAIntro />
        </section>

        <section id="two-group" className="narrative-section">
          <TwoGroupANOVA />
        </section>

        <section id="variance-partitioning" className="narrative-section">
          <VariancePartitioning />
        </section>

        <section id="f-ratio" className="narrative-section">
          <TheFRatio />
        </section>

        <section id="multi-group" className="narrative-section">
          <MultiGroupANOVA />
        </section>

        <section id="anova-summary" className="narrative-section">
          <ANOVASummary />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Inspired by the variance partitioning approach in{' '}
          <a
            href="https://www.amazon.com/Design-Analysis-Researchers-Handbook-4th/dp/0135159415"
            target="_blank"
            rel="noopener noreferrer"
          >
            Keppel & Wickens: Design and Analysis
          </a>
        </p>
      </footer>

      <ModuleNavigation currentPath="/anova" />
    </div>
  );
}
