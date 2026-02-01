import { useMemo } from 'react';
import FactorialDecompositionTable from '../FactorialDecompositionTable';

export default function VariancePartitioning() {
  // Pre-calculated SS values for the ANOVA table (must match FactorialDecompositionTable)
  const anovaResults = useMemo(() => {
    const ssT = 40;
    const ssA = 0;
    const ssB = 16;
    const ssAB = 16;
    const ssW = 8;

    const dfA = 1;
    const dfB = 1;
    const dfAB = 1;
    const dfW = 12;
    const dfT = 15;

    const msA = ssA / dfA;
    const msB = ssB / dfB;
    const msAB = ssAB / dfAB;
    const msW = ssW / dfW;

    const fA = msA / msW;
    const fB = msB / msW;
    const fAB = msAB / msW;

    return {
      ssT, ssA, ssB, ssAB, ssW,
      dfA, dfB, dfAB, dfW, dfT,
      msA, msB, msAB, msW,
      fA, fB, fAB,
    };
  }, []);

  return (
    <div className="section-intro">
      <h2>Partitioning Variance in Factorial Designs</h2>

      <p className="intro-text">
        Just as one-way ANOVA partitions total variance into between-group and within-group
        components, factorial ANOVA partitions variance into <strong>four sources</strong>:
        Factor A, Factor B, their interaction, and error.
      </p>

      <div className="formula-box">
        <h3>The Fundamental Partition</h3>
        <div className="formula">
          <span className="formula-main">
            SS<sub>T</sub> = SS<sub>A</sub> + SS<sub>B</sub> + SS<sub>A×B</sub> + SS<sub>S/AB</sub>
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">SS<sub>A</sub></span>
            <span className="explanation">
              Variance due to Factor A (Involvement)
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>B</sub></span>
            <span className="explanation">
              Variance due to Factor B (Argument Quality)
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>A×B</sub></span>
            <span className="explanation">
              Variance due to the interaction
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>S/AB</sub></span>
            <span className="explanation">
              Within-cell variance (error)
            </span>
          </div>
        </div>
      </div>

      <h3>See How It's Calculated</h3>

      <p className="intro-text">
        Step through the calculation to see exactly how factorial ANOVA partitions total
        variance into its four components:
      </p>

      <FactorialDecompositionTable />

      <h3>The ANOVA Summary Table</h3>

      <p className="intro-text">
        After computing the sums of squares, we divide by degrees of freedom to get mean
        squares, then form F-ratios to test each effect:
      </p>

      <div className="viz-container">
        <table className="anova-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>SS</th>
              <th>df</th>
              <th>MS</th>
              <th>F</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Factor A (Involvement)</td>
              <td>{anovaResults.ssA.toFixed(1)}</td>
              <td>{anovaResults.dfA}</td>
              <td>{anovaResults.msA.toFixed(2)}</td>
              <td>{anovaResults.fA.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Factor B (Arguments)</td>
              <td>{anovaResults.ssB.toFixed(1)}</td>
              <td>{anovaResults.dfB}</td>
              <td>{anovaResults.msB.toFixed(2)}</td>
              <td>{anovaResults.fB.toFixed(2)}</td>
            </tr>
            <tr className="interaction-row">
              <td>A × B Interaction</td>
              <td>{anovaResults.ssAB.toFixed(1)}</td>
              <td>{anovaResults.dfAB}</td>
              <td>{anovaResults.msAB.toFixed(2)}</td>
              <td style={{ fontWeight: 600, color: '#8b5cf6' }}>{anovaResults.fAB.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Within (Error)</td>
              <td>{anovaResults.ssW.toFixed(1)}</td>
              <td>{anovaResults.dfW}</td>
              <td>{anovaResults.msW.toFixed(2)}</td>
              <td></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>{anovaResults.ssT.toFixed(1)}</strong></td>
              <td><strong>{anovaResults.dfT}</strong></td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="key-insight">
        <h4>Interpreting the Results</h4>
        <p>
          There is no main effect of involvement (F = {anovaResults.fA.toFixed(2)}), because
          both involvement conditions have the same marginal mean. There is a main effect of
          argument quality (F = {anovaResults.fB.toFixed(2)}), but this must be interpreted
          cautiously given the significant interaction (F = {anovaResults.fAB.toFixed(2)}).
          The interaction tells us that argument quality matters under high involvement but
          not under low involvement—exactly what Petty et al. predicted based on the
          Elaboration Likelihood Model.
        </p>
      </div>

      <h3>Key Takeaways</h3>

      <div style={{
        background: 'var(--bg-secondary)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border)',
        marginTop: 'var(--spacing-md)'
      }}>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.8 }}>
          <li>
            <strong>Factorial designs</strong> let us study multiple factors simultaneously
            and detect interactions.
          </li>
          <li>
            <strong>Main effects</strong> describe the average effect of each factor,
            but can be misleading when interactions are present.
          </li>
          <li>
            <strong>Interactions</strong> tell us that the effect of one factor depends
            on the level of another—often the most interesting finding.
          </li>
          <li>
            <strong>Variance partitioning</strong> extends naturally from one-way to
            factorial designs: we simply add more sources to the partition.
          </li>
        </ul>
      </div>
    </div>
  );
}
