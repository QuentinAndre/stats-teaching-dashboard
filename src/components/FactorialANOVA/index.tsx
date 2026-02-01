import NavigationPane from './NavigationPane';
import FactorialIntro from './sections/FactorialIntro';
import MainEffects from './sections/MainEffects';
import InteractionEffect from './sections/InteractionEffect';
import VariancePartitioning from './sections/VariancePartitioning';
import ModuleNavigation from '../ModuleNavigation';
import './FactorialANOVA.css';

export default function FactorialANOVA() {
  return (
    <div className="factorial-anova">
      <NavigationPane />

      <header className="factorial-anova-header">
        <h1>Factorial ANOVA</h1>
        <p className="subtitle">
          Understanding how multiple factors combine to influence outcomes
        </p>
      </header>

      <main className="factorial-anova-content">
        <section id="factorial-intro" className="narrative-section">
          <FactorialIntro />
        </section>

        <section id="main-effects" className="narrative-section">
          <MainEffects />
        </section>

        <section id="interaction" className="narrative-section">
          <InteractionEffect />
        </section>

        <section id="variance-partitioning" className="narrative-section">
          <VariancePartitioning />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Example based on{' '}
          <a
            href="https://academic.oup.com/jcr/article-abstract/10/2/135/1801204"
            target="_blank"
            rel="noopener noreferrer"
          >
            Petty, Cacioppo & Schumann (1983)
          </a>
          {' '}— Journal of Consumer Research
        </p>
      </footer>

      <ModuleNavigation currentPath="/factorial-anova" />
    </div>
  );
}
