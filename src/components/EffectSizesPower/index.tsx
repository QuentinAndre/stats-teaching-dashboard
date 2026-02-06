import NavigationPane from './NavigationPane';
import EffectSizeIntro from './sections/EffectSizeIntro';
import CohensD from './sections/CohensD';
import VarianceExplained from './sections/VarianceExplained';
import PowerAnalysis from './sections/PowerAnalysis';
import PublicationBias from './sections/PublicationBias';
import StudyPlanning from './sections/StudyPlanning';
import ModuleNavigation from '../ModuleNavigation';
import './EffectSizesPower.css';

export default function EffectSizesPower() {
  return (
    <div className="effect-sizes-power">
      <NavigationPane />

      <header className="effect-sizes-power-header">
        <h1>Effect Sizes & Power</h1>
        <p className="subtitle">
          Beyond p-values: Quantifying the magnitude of effects and planning adequately powered studies
        </p>
      </header>

      <main className="effect-sizes-power-content">
        <section id="effect-size-intro" className="narrative-section">
          <EffectSizeIntro />
        </section>

        <section id="cohens-d" className="narrative-section">
          <CohensD />
        </section>

        <section id="variance-explained" className="narrative-section">
          <VarianceExplained />
        </section>

        <section id="power-analysis" className="narrative-section">
          <PowerAnalysis />
        </section>

        <section id="publication-bias" className="narrative-section">
          <PublicationBias />
        </section>

        <section id="study-planning" className="narrative-section">
          <StudyPlanning />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Effect size conventions based on{' '}
          <a
            href="https://www.amazon.com/Statistical-Power-Analysis-Behavioral-Sciences/dp/0805802835"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cohen (1988): Statistical Power Analysis for the Behavioral Sciences
          </a>
        </p>
      </footer>

      <ModuleNavigation currentPath="/effect-sizes-power" />
    </div>
  );
}
