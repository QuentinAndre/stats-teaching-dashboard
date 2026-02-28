import NavigationPane from './NavigationPane';
import ANCOVAIntro from './sections/ANCOVAIntro';
import TheANCOVAModel from './sections/TheANCOVAModel';
import AdjustedMeans from './sections/AdjustedMeans';
import VariancePartitioning from './sections/VariancePartitioning';
import ANCOVAFTest from './sections/ANCOVAFTest';
import AssumptionsPitfalls from './sections/AssumptionsPitfalls';
import ModuleNavigation from '../ModuleNavigation';
import './ANCOVA.css';

export default function ANCOVA() {
  return (
    <div className="ancova">
      <NavigationPane />

      <header className="ancova-header">
        <h1>Analysis of Covariance (ANCOVA)</h1>
        <p className="subtitle">
          How adding a covariate to ANOVA reduces error variance, increases
          power, and adjusts group means for pre-existing differences
        </p>
      </header>

      <main className="ancova-content">
        <section id="ancova-intro" className="narrative-section">
          <ANCOVAIntro />
        </section>

        <section id="ancova-model" className="narrative-section">
          <TheANCOVAModel />
        </section>

        <section id="adjusted-means" className="narrative-section">
          <AdjustedMeans />
        </section>

        <section id="variance-partitioning" className="narrative-section">
          <VariancePartitioning />
        </section>

        <section id="ancova-ftest" className="narrative-section">
          <ANCOVAFTest />
        </section>

        <section id="assumptions" className="narrative-section">
          <AssumptionsPitfalls />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Based on the covariance adjustment approach in{' '}
          <em>Design and Analysis: A Researcher&apos;s Handbook</em>{' '}
          by Keppel &amp; Wickens (2004), Chapters 15&ndash;16
        </p>
      </footer>

      <ModuleNavigation currentPath="/ancova" />
    </div>
  );
}
