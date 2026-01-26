import NavigationPane from './NavigationPane';
import OutlierIntro from './sections/OutlierIntro';
import WithinVsAcross from './sections/WithinVsAcross';
import TheIntuition from './sections/TheIntuition';
import InteractiveDemo from './sections/InteractiveDemo';
import TypeIErrorSection from './sections/TypeIErrorSection';
import './OutlierExclusions.css';

export default function OutlierExclusions() {
  return (
    <div className="outlier-exclusions">
      <NavigationPane />

      <header className="narrative-header">
        <h1>Outlier Exclusions in Experiments</h1>
        <p className="subtitle">
          Why outlier detection must be blind to experimental conditions
        </p>
      </header>

      <main className="outlier-content">
        <section id="outlier-intro" className="narrative-section">
          <OutlierIntro />
        </section>

        <section id="within-vs-across" className="narrative-section">
          <WithinVsAcross />
        </section>

        <section id="the-intuition" className="narrative-section">
          <TheIntuition />
        </section>

        <section id="interactive-demo" className="narrative-section">
          <InteractiveDemo />
        </section>

        <section id="type-i-error" className="narrative-section">
          <TypeIErrorSection />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Based on{' '}
          <a
            href="https://doi.org/10.3758/s13423-021-01961-8"
            target="_blank"
            rel="noopener noreferrer"
          >
            Andre (2021): Outlier Exclusion Procedures Must Be Blind to the
            Researcher's Hypothesis
          </a>
        </p>
      </footer>
    </div>
  );
}
