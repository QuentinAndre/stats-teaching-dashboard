import MixedDecompositionTable from '../MixedDecompositionTable';

export default function VariancePartitioning() {
  return (
    <div className="section-intro">
      <h2>How Variance Is Partitioned</h2>

      <p className="intro-text">
        In a mixed design, total variance splits into <strong>five</strong> components—more
        than either a pure between-subjects design (3 components) or a pure within-subjects
        design (3 components). This is because we need to account for both types of structure.
      </p>

      <div className="formula-box">
        <h3>The Full Partition</h3>
        <div className="formula">
          <span className="formula-main">
            SS<sub>T</sub> = SS<sub>A</sub> + SS<sub>S/A</sub> + SS<sub>B</sub> + SS<sub>A×B</sub> + SS<sub>B×S/A</sub>
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol between">SS<sub>A</sub></span>
            <span className="explanation">Between-subjects factor (Ad Appeal)</span>
          </div>
          <div className="formula-part">
            <span className="symbol subject">SS<sub>S/A</sub></span>
            <span className="explanation">Subjects within groups (error for A)</span>
          </div>
          <div className="formula-part">
            <span className="symbol within">SS<sub>B</sub></span>
            <span className="explanation">Within-subjects factor (Time)</span>
          </div>
          <div className="formula-part">
            <span className="symbol interaction">SS<sub>A×B</sub></span>
            <span className="explanation">Interaction (A × B)</span>
          </div>
          <div className="formula-part">
            <span className="symbol residual">SS<sub>B×S/A</sub></span>
            <span className="explanation">Residual (error for B and A×B)</span>
          </div>
        </div>
      </div>

      <h3>Two Distinct Portions</h3>

      <p className="intro-text">
        Notice that the partition naturally divides into two portions:
      </p>

      <div className="error-comparison">
        <div className="error-card between-error">
          <h5>Between-Subjects Portion</h5>
          <div className="formula">SS<sub>A</sub> + SS<sub>S/A</sub></div>
          <p className="explanation">
            This portion captures variation <em>between</em> subjects. SS<sub>A</sub> is the
            effect of ad appeal; SS<sub>S/A</sub> is individual differences within each
            group (people who saw the same ad differ from each other).
          </p>
        </div>
        <div className="error-card within-error">
          <h5>Within-Subjects Portion</h5>
          <div className="formula">SS<sub>B</sub> + SS<sub>A×B</sub> + SS<sub>B×S/A</sub></div>
          <p className="explanation">
            This portion captures variation <em>within</em> subjects (across time points).
            SS<sub>B</sub> is the main effect of time; SS<sub>A×B</sub> is the interaction;
            SS<sub>B×S/A</sub> is inconsistency in individual time effects.
          </p>
        </div>
      </div>

      <h3>Step Through the Decomposition</h3>

      <p className="intro-text">
        Use the interactive table below to see how we compute each sum of squares. Pay
        attention to which deviations involve between-subjects comparisons (comparing
        groups or subjects) versus within-subjects comparisons (comparing time points
        within the same person).
      </p>

      <MixedDecompositionTable />

      <h3>Understanding the Components</h3>

      <p className="intro-text">
        Each component captures a specific source of variation:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>
          <strong>SS<sub>A</sub> (Ad Appeal):</strong> Do emotional and rational ad groups
          differ overall? In our data, group means are moderately different (5.1 vs 4.5), giving a small SS<sub>A</sub>.
        </li>
        <li>
          <strong>SS<sub>S/A</sub> (Subjects within groups):</strong> Within each ad group,
          how much do subjects differ from their group mean? This captures individual
          differences.
        </li>
        <li>
          <strong>SS<sub>B</sub> (Time):</strong> Does purchase intention change from
          immediate to delayed? Time means differ modestly (5.0 vs 4.6), giving a small SS<sub>B</sub>.
        </li>
        <li>
          <strong>SS<sub>A×B</sub> (Interaction):</strong> Does the time effect differ
          between ad types? Emotional drops ~1.8 points while rational rises ~1.0 points—a strong interaction.
        </li>
        <li>
          <strong>SS<sub>B×S/A</sub> (Residual):</strong> How inconsistently do individual
          subjects show the time effect? This is the "noise" for within-subjects effects.
        </li>
      </ul>

      <div className="key-insight">
        <h4>Why Five Components?</h4>
        <p>
          A fully between-subjects 2×2 design has three components: SS<sub>A</sub>,
          SS<sub>B</sub>, SS<sub>A×B</sub>, and SS<sub>error</sub>. A fully within-subjects
          2-condition design has three: SS<sub>A</sub>, SS<sub>S</sub>, and SS<sub>A×S</sub>.
          Mixed designs need more components because we have both types of structure:
          subjects nested within groups <em>and</em> repeated measures across time.
        </p>
      </div>
    </div>
  );
}
