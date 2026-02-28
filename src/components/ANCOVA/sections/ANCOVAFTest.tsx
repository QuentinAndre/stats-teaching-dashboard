import { useMemo } from 'react';
import { getGroupedData } from '../data';
import { oneWayANCOVA, oneWayANOVA } from '../../../utils/statistics';

function formatP(p: number): string {
  if (p < 0.001) return '< .001';
  return p.toFixed(3);
}

export default function ANCOVAFTest() {
  const { anova, ancova } = useMemo(() => {
    const grouped = getGroupedData();
    const ancovaResult = oneWayANCOVA(grouped);
    const anovaResult = oneWayANOVA(grouped.map((g) => g.map((p) => p.y)));
    return { anova: anovaResult, ancova: ancovaResult };
  }, []);

  const fRatioIncrease = anova.fStatistic > 0
    ? ((ancova.fStatistic - anova.fStatistic) / anova.fStatistic * 100).toFixed(0)
    : '0';

  return (
    <div className="section-intro">
      <h2>The ANCOVA F-Test</h2>

      <p className="intro-text">
        The ANCOVA F-test evaluates whether the adjusted group means differ
        significantly. It uses the same logic as the ANOVA F-test, but with
        two important changes: the numerator uses the adjusted between-group
        variance, and the denominator uses the reduced error term.
      </p>

      <div className="formula-box">
        <h3>The ANCOVA F-Statistic</h3>
        <div className="formula">
          <span className="formula-main">
            F = MS<sub>Adj. Groups</sub> / MS<sub>Residual</sub>
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">df<sub>Adj. Groups</sub> = a &minus; 1</span>
            <span className="explanation">Same as ANOVA ({ancova.dfAdjustedGroups})</span>
          </div>
          <div className="formula-part">
            <span className="symbol">df<sub>Residual</sub> = N &minus; a &minus; 1</span>
            <span className="explanation">One fewer df than ANOVA ({ancova.dfResidual} vs. {anova.dfWithin})</span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        Notice the degrees of freedom for the error term: ANCOVA uses
        N &minus; a &minus; 1 = {ancova.dfResidual}, compared to
        ANOVA&rsquo;s N &minus; a = {anova.dfWithin}. Estimating the
        regression slope costs one degree of freedom. In practice, the
        reduction in SS<sub>Residual</sub> almost always more than compensates
        for this small df cost.
      </p>

      <h3>Side-by-Side Comparison</h3>

      <p className="intro-text">
        The tables below show the same dataset analyzed with ANOVA (left)
        and ANCOVA (right). Compare the error terms and the resulting
        F-statistics.
      </p>

      <div className="dual-panel">
        {/* ANOVA table */}
        <div className="viz-container" style={{ padding: 'var(--spacing-md)' }}>
          <h4>One-Way ANOVA</h4>
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
              <tr className="highlight-row">
                <td>Groups</td>
                <td>{anova.ssBetween.toFixed(2)}</td>
                <td>{anova.dfBetween}</td>
                <td>{anova.msBetween.toFixed(2)}</td>
                <td>{anova.fStatistic.toFixed(2)}</td>
                <td>{formatP(anova.pValue)}</td>
              </tr>
              <tr className="error-row">
                <td>Error</td>
                <td>{anova.ssWithin.toFixed(2)}</td>
                <td>{anova.dfWithin}</td>
                <td>{anova.msWithin.toFixed(2)}</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Total</td>
                <td>{anova.ssTotal.toFixed(2)}</td>
                <td>{anova.dfTotal}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ANCOVA table */}
        <div className="viz-container" style={{ padding: 'var(--spacing-md)' }}>
          <h4>ANCOVA</h4>
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
              <tr>
                <td>Covariate</td>
                <td>{ancova.ssCovariate.toFixed(2)}</td>
                <td>{ancova.dfCovariate}</td>
                <td>{ancova.msCovariate.toFixed(2)}</td>
                <td>{ancova.fCovariate.toFixed(2)}</td>
                <td>{formatP(ancova.pCovariate)}</td>
              </tr>
              <tr className="highlight-row">
                <td>Adj. Groups</td>
                <td>{ancova.ssAdjustedGroups.toFixed(2)}</td>
                <td>{ancova.dfAdjustedGroups}</td>
                <td>{ancova.msAdjustedGroups.toFixed(2)}</td>
                <td><strong>{ancova.fStatistic.toFixed(2)}</strong></td>
                <td><strong>{formatP(ancova.pValue)}</strong></td>
              </tr>
              <tr className="improved-row">
                <td>Residual</td>
                <td>{ancova.ssResidual.toFixed(2)}</td>
                <td>{ancova.dfResidual}</td>
                <td>{ancova.msResidual.toFixed(2)}</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Total</td>
                <td>{ancova.ssTotal.toFixed(2)}</td>
                <td>{ancova.dfTotal}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary cards */}
      <div className="results-row">
        <div className="result-card">
          <h5>ANOVA F</h5>
          <div className="result-value">{anova.fStatistic.toFixed(2)}</div>
          <div className="result-detail">p = {formatP(anova.pValue)}</div>
        </div>
        <div className="result-card">
          <h5>ANCOVA F</h5>
          <div className="result-value" style={{ color: 'var(--primary)' }}>
            {ancova.fStatistic.toFixed(2)}
          </div>
          <div className="result-detail">p = {formatP(ancova.pValue)}</div>
        </div>
        <div className="result-card">
          <h5>F Increase</h5>
          <div className="result-value" style={{ color: '#10b981' }}>
            +{fRatioIncrease}%
          </div>
          <div className="result-detail">More sensitive test</div>
        </div>
        <div className="result-card">
          <h5>Error Reduction</h5>
          <div className="result-value" style={{ color: '#10b981' }}>
            {((1 - ancova.msResidual / anova.msWithin) * 100).toFixed(0)}%
          </div>
          <div className="result-detail">MS<sub>Residual</sub> vs. MS<sub>Within</sub></div>
        </div>
      </div>

      {/* SS bar comparison */}
      <h3>Variance Partitioning Comparison</h3>
      <div className="ss-bar-comparison">
        <div>
          <div className="ss-bar-label">
            ANOVA
          </div>
          <div className="ss-bar">
            <div
              className="ss-segment"
              style={{
                width: `${(anova.ssBetween / anova.ssTotal) * 100}%`,
                background: '#8b5cf6',
              }}
            >
              Groups
            </div>
            <div
              className="ss-segment"
              style={{
                width: `${(anova.ssWithin / anova.ssTotal) * 100}%`,
                background: '#e63946',
              }}
            >
              Error
            </div>
          </div>
        </div>
        <div>
          <div className="ss-bar-label">
            ANCOVA
          </div>
          <div className="ss-bar">
            <div
              className="ss-segment"
              style={{
                width: `${(ancova.ssAdjustedGroups / ancova.ssTotal) * 100}%`,
                background: '#8b5cf6',
              }}
            >
              Adj.
            </div>
            <div
              className="ss-segment"
              style={{
                width: `${(ancova.ssCovariate / ancova.ssTotal) * 100}%`,
                background: '#4361ee',
              }}
            >
              Cov.
            </div>
            <div
              className="ss-segment"
              style={{
                width: `${(ancova.ssResidual / ancova.ssTotal) * 100}%`,
                background: '#e63946',
                opacity: 0.7,
              }}
            >
              Resid.
            </div>
          </div>
        </div>
      </div>

      <div className="key-insight">
        <h4>Two Sources of Power</h4>
        <p>
          ANCOVA&rsquo;s power gain comes from two sources. First,
          SS<sub>Residual</sub> is smaller than SS<sub>Within</sub> because
          covariate-related variance has been removed. Second,
          MS<sub>Residual</sub> is therefore smaller, making the F-ratio
          larger. The only cost is one degree of freedom &mdash; a small price
          for a substantially more sensitive test.
        </p>
      </div>
    </div>
  );
}
