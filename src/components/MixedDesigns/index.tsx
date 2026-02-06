import NavigationPane from './NavigationPane';
import MixedDesignsIntro from './sections/MixedDesignsIntro';
import VariancePartitioning from './sections/VariancePartitioning';
import ErrorTerms from './sections/ErrorTerms';
import InteractionEffects from './sections/InteractionEffects';
import Sphericity from './sections/Sphericity';
import ModuleNavigation from '../ModuleNavigation';
import './MixedDesigns.css';

export default function MixedDesigns() {
  return (
    <div className="mixed-designs">
      <NavigationPane />

      <header className="mixed-designs-header">
        <h1>Mixed Designs</h1>
        <p className="subtitle">
          Combining between-subjects and within-subjects factors in one experiment
        </p>
      </header>

      <main className="mixed-designs-content">
        <section id="mixed-intro" className="narrative-section">
          <MixedDesignsIntro />
        </section>

        <section id="variance-partitioning" className="narrative-section">
          <VariancePartitioning />
        </section>

        <section id="error-terms" className="narrative-section">
          <ErrorTerms />
        </section>

        <section id="interaction-effects" className="narrative-section">
          <InteractionEffects />
        </section>

        <section id="sphericity" className="narrative-section">
          <Sphericity />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Example based on consumer research examining how advertising appeals
          affect purchase intentions over time.
        </p>
      </footer>

      <ModuleNavigation currentPath="/mixed-designs" />
    </div>
  );
}
