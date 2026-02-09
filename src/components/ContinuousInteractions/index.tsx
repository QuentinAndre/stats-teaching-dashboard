import NavigationPane from './NavigationPane';
import ContinuousInteractionsIntro from './sections/ContinuousInteractionsIntro';
import TheRegressionModel from './sections/TheRegressionModel';
import SpotlightAnalysis from './sections/SpotlightAnalysis';
import FloodlightAnalysis from './sections/FloodlightAnalysis';
import CenteringPredictors from './sections/CenteringPredictors';
import PuttingItAllTogether from './sections/PuttingItAllTogether';
import ModuleNavigation from '../ModuleNavigation';
import './ContinuousInteractions.css';

export default function ContinuousInteractions() {
  return (
    <div className="continuous-interactions">
      <NavigationPane />

      <header className="continuous-interactions-header">
        <h1>Continuous Moderators</h1>
        <p className="subtitle">
          Spotlight analysis, floodlight analysis, and the interpretation of
          interactions with continuous predictors
        </p>
      </header>

      <main className="continuous-interactions-content">
        <section id="continuous-intro" className="narrative-section">
          <ContinuousInteractionsIntro />
        </section>

        <section id="regression-model" className="narrative-section">
          <TheRegressionModel />
        </section>

        <section id="spotlight" className="narrative-section">
          <SpotlightAnalysis />
        </section>

        <section id="floodlight" className="narrative-section">
          <FloodlightAnalysis />
        </section>

        <section id="centering" className="narrative-section">
          <CenteringPredictors />
        </section>

        <section id="putting-together" className="narrative-section">
          <PuttingItAllTogether />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Based on{' '}
          <a
            href="https://doi.org/10.1509/jmr.12.0420"
            target="_blank"
            rel="noopener noreferrer"
          >
            Spiller, Fitzsimons, Lynch &amp; McClelland (2013)
          </a>
          {' '}&mdash; Journal of Marketing Research
        </p>
      </footer>

      <ModuleNavigation currentPath="/continuous-interactions" />
    </div>
  );
}
