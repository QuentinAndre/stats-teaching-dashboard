import NavigationPane from './NavigationPane';
import NHSTIntro from './sections/NHSTIntro';
import OneSampleTest from './sections/OneSampleTest';
import TwoSampleTest from './sections/TwoSampleTest';
import NHSTSummary from './sections/NHSTSummary';
import ModuleNavigation from '../ModuleNavigation';
import './NHST.css';

export default function NHST() {
  return (
    <div className="nhst">
      <NavigationPane />

      <header className="nhst-header">
        <h1>Null Hypothesis Significance Testing</h1>
        <p className="subtitle">
          Understanding how sampling distributions enable hypothesis testing
        </p>
      </header>

      <main className="nhst-content">
        <section id="nhst-intro" className="narrative-section">
          <NHSTIntro />
        </section>

        <section id="one-sample" className="narrative-section">
          <OneSampleTest />
        </section>

        <section id="two-sample" className="narrative-section">
          <TwoSampleTest />
        </section>

        <section id="nhst-summary" className="narrative-section">
          <NHSTSummary />
        </section>
      </main>

      <ModuleNavigation currentPath="/nhst" />
    </div>
  );
}
