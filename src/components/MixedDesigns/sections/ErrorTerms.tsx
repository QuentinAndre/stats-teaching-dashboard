import { useState, useMemo } from 'react';
import { mixedANOVA, fDistributionCDF, type MixedDesignData } from '../../../utils/statistics';

// Fixed example data: crossing interaction with small main effects
// Emotional drops ~2 points, Rational rises ~1.8 points
// Results in: small main effects of A and B, strong A×B interaction
const STUDY_DATA: MixedDesignData[] = [
  { subject: 'S1', group: 'Emotional', time: 'Immediate', value: 6.4 },
  { subject: 'S1', group: 'Emotional', time: 'Delayed', value: 5.2 },
  { subject: 'S2', group: 'Emotional', time: 'Immediate', value: 5.4 },
  { subject: 'S2', group: 'Emotional', time: 'Delayed', value: 3.0 },
  { subject: 'S3', group: 'Emotional', time: 'Immediate', value: 6.6 },
  { subject: 'S3', group: 'Emotional', time: 'Delayed', value: 4.2 },
  { subject: 'S4', group: 'Emotional', time: 'Immediate', value: 5.6 },
  { subject: 'S4', group: 'Emotional', time: 'Delayed', value: 4.4 },
  { subject: 'S5', group: 'Rational', time: 'Immediate', value: 4.4 },
  { subject: 'S5', group: 'Rational', time: 'Delayed', value: 4.6 },
  { subject: 'S6', group: 'Rational', time: 'Immediate', value: 3.4 },
  { subject: 'S6', group: 'Rational', time: 'Delayed', value: 5.2 },
  { subject: 'S7', group: 'Rational', time: 'Immediate', value: 4.4 },
  { subject: 'S7', group: 'Rational', time: 'Delayed', value: 5.2 },
  { subject: 'S8', group: 'Rational', time: 'Immediate', value: 3.8 },
  { subject: 'S8', group: 'Rational', time: 'Delayed', value: 5.0 },
];

export default function ErrorTerms() {
  const [showComparison, setShowComparison] = useState(false);

  const anovaResult = useMemo(() => mixedANOVA(STUDY_DATA), []);

  // Compute what it would look like as a fully between-subjects design
  // (treating each observation as independent - ignoring pairing)
  const betweenSubjectsAnalysis = useMemo(() => {
    // In a between-subjects design, all error would be pooled
    // SS_error would be SS_S/A + SS_B×S/A
    // df_error would be N - a*b
    const ssErrorPooled = anovaResult.SS_S_A + anovaResult.SS_BS_A;
    const dfErrorPooled = 16 - 4; // N - cells
    const msErrorPooled = ssErrorPooled / dfErrorPooled;

    // Calculate F and p for each effect using pooled error
    const F_A = anovaResult.MS_A / msErrorPooled;
    const F_B = anovaResult.MS_B / msErrorPooled;
    const F_AB = anovaResult.MS_AB / msErrorPooled;

    const p_A = 1 - fDistributionCDF(F_A, anovaResult.df_A, dfErrorPooled);
    const p_B = 1 - fDistributionCDF(F_B, anovaResult.df_B, dfErrorPooled);
    const p_AB = 1 - fDistributionCDF(F_AB, anovaResult.df_AB, dfErrorPooled);

    return { ss: ssErrorPooled, df: dfErrorPooled, ms: msErrorPooled, F_A, F_B, F_AB, p_A, p_B, p_AB };
  }, [anovaResult]);

  const formatNum = (n: number, d: number = 2) => n.toFixed(d);
  const formatP = (p: number) => (p < 0.002 ? '< .001' : p.toFixed(3));

  return (
    <div className="section-intro">
      <h2>Different Error Terms for Different Effects</h2>

      <p className="intro-text">
        Here's the key insight of mixed designs: <strong>different effects use different
        error terms</strong>. This isn't arbitrary—it follows from the logic of what's
        being compared.
      </p>

      <h3>The Three F-Ratios</h3>

      <div className="formula-box">
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol between">F<sub>A</sub> = MS<sub>A</sub> / MS<sub>S/A</sub></span>
            <span className="explanation">Between-subjects effect uses between-subjects error</span>
          </div>
          <div className="formula-part">
            <span className="symbol within">F<sub>B</sub> = MS<sub>B</sub> / MS<sub>B×S/A</sub></span>
            <span className="explanation">Within-subjects effect uses within-subjects error</span>
          </div>
          <div className="formula-part">
            <span className="symbol interaction">F<sub>A×B</sub> = MS<sub>A×B</sub> / MS<sub>B×S/A</sub></span>
            <span className="explanation">Interaction uses within-subjects error</span>
          </div>
        </div>
      </div>

      <h3>Why Different Error Terms?</h3>

      <p className="intro-text">
        Consider what each effect is testing:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>
          <strong>Factor A (Ad Appeal):</strong> Are the <em>group means</em> different?
          This compares different people in different groups. The appropriate error is
          variability between subjects within each group (MS<sub>S/A</sub>).
        </li>
        <li>
          <strong>Factor B (Time):</strong> Are the <em>time means</em> different? This
          compares the same people at different times. The appropriate error is the
          inconsistency in how individuals change over time (MS<sub>B×S/A</sub>).
        </li>
        <li>
          <strong>Interaction (A×B):</strong> Does the time effect differ by group?
          This also involves within-person change, so it uses MS<sub>B×S/A</sub>.
        </li>
      </ul>

      <h3>ANOVA Summary Table</h3>

      <div className="viz-container">
        <h4>Ad Appeal × Time Mixed ANOVA</h4>
        <table className="anova-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>SS</th>
              <th>df</th>
              <th>MS</th>
              <th>F</th>
              <th>p</th>
            </tr>
          </thead>
          <tbody>
            <tr className="between-row">
              <td>Ad Appeal (A)</td>
              <td>{formatNum(anovaResult.SS_A)}</td>
              <td>{anovaResult.df_A}</td>
              <td>{formatNum(anovaResult.MS_A)}</td>
              <td>{formatNum(anovaResult.F_A)}</td>
              <td className={anovaResult.p_A < 0.05 ? 'significant' : ''}>
                {formatP(anovaResult.p_A)}
              </td>
            </tr>
            <tr className="subject-row">
              <td>Subjects within groups (S/A)</td>
              <td>{formatNum(anovaResult.SS_S_A)}</td>
              <td>{anovaResult.df_S_A}</td>
              <td>{formatNum(anovaResult.MS_S_A)}</td>
              <td>—</td>
              <td>—</td>
            </tr>
            <tr className="within-row">
              <td>Time (B)</td>
              <td>{formatNum(anovaResult.SS_B)}</td>
              <td>{anovaResult.df_B}</td>
              <td>{formatNum(anovaResult.MS_B)}</td>
              <td>{formatNum(anovaResult.F_B)}</td>
              <td className={anovaResult.p_B < 0.05 ? 'significant' : ''}>
                {formatP(anovaResult.p_B)}
              </td>
            </tr>
            <tr className="interaction-row">
              <td>Ad Appeal × Time (A×B)</td>
              <td>{formatNum(anovaResult.SS_AB)}</td>
              <td>{anovaResult.df_AB}</td>
              <td>{formatNum(anovaResult.MS_AB)}</td>
              <td>{formatNum(anovaResult.F_AB)}</td>
              <td className={anovaResult.p_AB < 0.05 ? 'significant' : ''}>
                {formatP(anovaResult.p_AB)}
              </td>
            </tr>
            <tr className="residual-row">
              <td>B × S/A (residual)</td>
              <td>{formatNum(anovaResult.SS_BS_A)}</td>
              <td>{anovaResult.df_BS_A}</td>
              <td>{formatNum(anovaResult.MS_BS_A)}</td>
              <td>—</td>
              <td>—</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{formatNum(anovaResult.SS_Total)}</td>
              <td>{anovaResult.df_Total}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <h3>The Power Advantage</h3>

      <p className="intro-text">
        Notice the two error terms have very different sizes:
      </p>

      <div className="error-comparison">
        <div className="error-card between-error">
          <h5>Between-Subjects Error</h5>
          <div className="formula">MS<sub>S/A</sub> = {formatNum(anovaResult.MS_S_A)}</div>
          <p className="explanation">
            Used for testing Ad Appeal (Factor A). Includes individual differences
            between people.
          </p>
        </div>
        <div className="error-card within-error">
          <h5>Within-Subjects Error</h5>
          <div className="formula">MS<sub>B×S/A</sub> = {formatNum(anovaResult.MS_BS_A)}</div>
          <p className="explanation">
            Used for testing Time (B) and Interaction (A×B). Individual differences
            are removed.
          </p>
        </div>
      </div>

      <p className="intro-text">
        The within-subjects error (MS<sub>B×S/A</sub> = {formatNum(anovaResult.MS_BS_A)})
        is much smaller than the between-subjects error (MS<sub>S/A</sub> = {formatNum(anovaResult.MS_S_A)}).
        This means we have <strong>more power</strong> to detect the Time effect and
        the interaction than we would in a fully between-subjects design.
      </p>

      <h3>Comparison: Mixed vs. Fully Between-Subjects</h3>

      <div className="view-toggle">
        <button
          className={`toggle-button ${!showComparison ? 'active' : ''}`}
          onClick={() => setShowComparison(false)}
        >
          Mixed Design
        </button>
        <button
          className={`toggle-button ${showComparison ? 'active' : ''}`}
          onClick={() => setShowComparison(true)}
        >
          As Between-Subjects
        </button>
      </div>

      <div className="viz-container">
        {!showComparison ? (
          <>
            <h4>Mixed Design Analysis (Correct)</h4>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Using appropriate error terms for each effect
            </p>
            <table className="anova-table" style={{ marginTop: 'var(--spacing-md)' }}>
              <thead>
                <tr>
                  <th>Effect</th>
                  <th>MS Effect</th>
                  <th>MS Error</th>
                  <th>F</th>
                  <th>p</th>
                </tr>
              </thead>
              <tbody>
                <tr className="between-row">
                  <td>Ad Appeal (A)</td>
                  <td>{formatNum(anovaResult.MS_A)}</td>
                  <td>{formatNum(anovaResult.MS_S_A)}</td>
                  <td>{formatNum(anovaResult.F_A)}</td>
                  <td className={anovaResult.p_A < 0.05 ? 'significant' : ''}>
                    {formatP(anovaResult.p_A)}
                  </td>
                </tr>
                <tr className="within-row">
                  <td>Time (B)</td>
                  <td>{formatNum(anovaResult.MS_B)}</td>
                  <td>{formatNum(anovaResult.MS_BS_A)}</td>
                  <td>{formatNum(anovaResult.F_B)}</td>
                  <td className={anovaResult.p_B < 0.05 ? 'significant' : ''}>
                    {formatP(anovaResult.p_B)}
                  </td>
                </tr>
                <tr className="interaction-row">
                  <td>A × B</td>
                  <td>{formatNum(anovaResult.MS_AB)}</td>
                  <td>{formatNum(anovaResult.MS_BS_A)}</td>
                  <td>{formatNum(anovaResult.F_AB)}</td>
                  <td className={anovaResult.p_AB < 0.05 ? 'significant' : ''}>
                    {formatP(anovaResult.p_AB)}
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <>
            <h4>If Treated as Fully Between-Subjects (Wrong)</h4>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Using pooled error for all effects (ignoring repeated measures)
            </p>
            <table className="anova-table" style={{ marginTop: 'var(--spacing-md)' }}>
              <thead>
                <tr>
                  <th>Effect</th>
                  <th>MS Effect</th>
                  <th>MS Error</th>
                  <th>F</th>
                  <th>p</th>
                </tr>
              </thead>
              <tbody>
                <tr className="between-row">
                  <td>Ad Appeal (A)</td>
                  <td>{formatNum(anovaResult.MS_A)}</td>
                  <td>{formatNum(betweenSubjectsAnalysis.ms)}</td>
                  <td>{formatNum(betweenSubjectsAnalysis.F_A)}</td>
                  <td className={betweenSubjectsAnalysis.p_A < 0.05 ? 'significant' : ''}>
                    {formatP(betweenSubjectsAnalysis.p_A)}
                  </td>
                </tr>
                <tr className="within-row">
                  <td>Time (B)</td>
                  <td>{formatNum(anovaResult.MS_B)}</td>
                  <td>{formatNum(betweenSubjectsAnalysis.ms)}</td>
                  <td>{formatNum(betweenSubjectsAnalysis.F_B)}</td>
                  <td className={betweenSubjectsAnalysis.p_B < 0.05 ? 'significant' : ''}>
                    {formatP(betweenSubjectsAnalysis.p_B)}
                  </td>
                </tr>
                <tr className="interaction-row">
                  <td>A × B</td>
                  <td>{formatNum(anovaResult.MS_AB)}</td>
                  <td>{formatNum(betweenSubjectsAnalysis.ms)}</td>
                  <td>{formatNum(betweenSubjectsAnalysis.F_AB)}</td>
                  <td className={betweenSubjectsAnalysis.p_AB < 0.05 ? 'significant' : ''}>
                    {formatP(betweenSubjectsAnalysis.p_AB)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Note: The pooled error ({formatNum(betweenSubjectsAnalysis.ms)}) combines both error terms.
              For B and A×B, this is much larger than their proper error term ({formatNum(anovaResult.MS_BS_A)}),
              dramatically reducing power.
            </p>
          </>
        )}
      </div>

      <div className="key-insight">
        <h4>The Key Takeaway</h4>
        <p>
          Mixed designs separate between-subjects and within-subjects error. The
          within-subjects effects (B and A×B) benefit from the smaller error term because
          individual differences are removed. This is why mixed designs can detect
          interactions and within-subjects main effects with substantially more power than
          fully between-subjects designs.
        </p>
      </div>
    </div>
  );
}
