import NavigationPane from './NavigationPane';
import WithinSubjectsIntro from './sections/WithinSubjectsIntro';
import IndividualDifferences from './sections/IndividualDifferences';
import TwoCellDesign from './sections/TwoCellDesign';
import ThreeCellDesign from './sections/ThreeCellDesign';
import PowerComparison from './sections/PowerComparison';
import Sphericity from './sections/Sphericity';
import ModuleNavigation from '../ModuleNavigation';
import './WithinSubjects.css';

export default function WithinSubjects() {
  return (
    <div className="within-subjects">
      <NavigationPane />

      <header className="within-subjects-header">
        <h1>Within-Subject Designs</h1>
        <p className="subtitle">
          How measuring the same subjects multiple times changes everything
        </p>
      </header>

      <main className="within-subjects-content">
        <section id="within-intro" className="narrative-section">
          <WithinSubjectsIntro />
        </section>

        <section id="individual-differences" className="narrative-section">
          <IndividualDifferences />
        </section>

        <section id="two-cell" className="narrative-section">
          <TwoCellDesign />
        </section>

        <section id="three-cell" className="narrative-section">
          <ThreeCellDesign />
        </section>

        <section id="power-comparison" className="narrative-section">
          <PowerComparison />
        </section>

        <section id="sphericity" className="narrative-section">
          <Sphericity />
        </section>
      </main>

      <footer className="narrative-footer">
        <p>
          Example based on the Stroop effect (Stroop, 1935) — a classic
          demonstration of cognitive interference.
        </p>
      </footer>

      <ModuleNavigation currentPath="/within-subjects" />
    </div>
  );
}
