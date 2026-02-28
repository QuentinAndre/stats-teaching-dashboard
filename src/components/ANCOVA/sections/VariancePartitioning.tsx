import { useState, useMemo } from 'react';
import { ANCOVA_DATA, GROUP_COLORS, getGroupedData } from '../data';
import { oneWayANCOVA, oneWayANOVA } from '../../../utils/statistics';

const STEP_DESCRIPTIONS = [
  'Start with the raw data: each student\'s group, exam score (Y), and prior knowledge (X).',
  'Compute the grand means: Ȳ.. (overall exam mean) and X̄.. (overall prior knowledge mean).',
  'ANOVA partition: decompose each score\'s total deviation into between-group and within-group components.',
  'Fit the covariate: compute the within-group predicted score Ŷ using the pooled regression slope.',
  'ANCOVA partition: the within-group SS splits into SS_Covariate (explained by X) and SS_Residual (leftover error).',
];

export default function VariancePartitioning() {
  const [currentStep, setCurrentStep] = useState(0);

  const { rows, grandMeanY, ssTotal, ssBetween, ssWithin, ssCovariate, ssResidual, ssAdjustedGroups, slope } = useMemo(() => {
    const grouped = getGroupedData();
    const ancova = oneWayANCOVA(grouped);
    const anova = oneWayANOVA(grouped.map((g) => g.map((p) => p.y)));

    const computedRows = ANCOVA_DATA.map((d) => {
      const yBar = ancova.rawMeans[d.groupIndex];
      const xBar = ancova.covariateMeans[d.groupIndex];
      const totalDev = d.examScore - ancova.grandMeanY;
      const betweenDev = yBar - ancova.grandMeanY;
      const withinDev = d.examScore - yBar;
      const predicted = yBar + ancova.pooledSlope * (d.priorKnowledge - xBar);
      const residual = d.examScore - predicted;

      return {
        ...d,
        yBar,
        totalDev,
        totalDevSq: totalDev ** 2,
        betweenDev,
        betweenDevSq: betweenDev ** 2,
        withinDev,
        withinDevSq: withinDev ** 2,
        predicted,
        residual,
        residualSq: residual ** 2,
      };
    });

    return {
      rows: computedRows,
      grandMeanY: ancova.grandMeanY,
      ssTotal: anova.ssTotal,
      ssBetween: anova.ssBetween,
      ssWithin: anova.ssWithin,
      ssCovariate: ancova.ssCovariate,
      ssResidual: ancova.ssResidual,
      ssAdjustedGroups: ancova.ssAdjustedGroups,
      slope: ancova.pooledSlope,
    };
  }, []);

  const groupClass = (gi: number) =>
    gi === 0 ? 'group-lecture' : gi === 1 ? 'group-discussion' : 'group-flipped';

  return (
    <div className="section-intro">
      <h2>Variance Partitioning in ANCOVA</h2>

      <p className="intro-text">
        In standard ANOVA, SS<sub>Total</sub> splits into SS<sub>Between</sub>{' '}
        and SS<sub>Within</sub>. ANCOVA goes further: it decomposes
        SS<sub>Within</sub> into variance <em>explained</em> by the covariate
        (SS<sub>Covariate</sub>) and variance that remains unexplained
        (SS<sub>Residual</sub>). This is where ANCOVA&rsquo;s power advantage
        comes from.
      </p>

      <div className="formula-box">
        <h3>The ANCOVA Partition</h3>
        <div className="formula">
          <span className="formula-main">
            SS<sub>Total</sub> = SS<sub>Adj. Groups</sub> + SS<sub>Covariate</sub> + SS<sub>Residual</sub>
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">SS<sub>Adj. Groups</sub></span>
            <span className="explanation">Between-group variance after covariate adjustment</span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>Covariate</sub></span>
            <span className="explanation">Variance explained by the covariate</span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>Residual</sub></span>
            <span className="explanation">Leftover error (smaller than SS<sub>Within</sub>)</span>
          </div>
        </div>
      </div>

      <h3>Step-by-Step Decomposition</h3>

      <p className="intro-text">
        Step through the decomposition below to see how each component is
        computed. The table builds column by column, revealing how the total
        variability is partitioned.
      </p>

      {/* Step controls */}
      <div className="step-controls">
        <button
          className="step-button"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          &larr; Previous
        </button>
        <span className="step-label">
          Step {currentStep + 1} of {STEP_DESCRIPTIONS.length}
        </span>
        <button
          className="step-button"
          onClick={() => setCurrentStep((s) => Math.min(STEP_DESCRIPTIONS.length - 1, s + 1))}
          disabled={currentStep === STEP_DESCRIPTIONS.length - 1}
        >
          Next &rarr;
        </button>
      </div>

      <p className="intro-text" style={{ fontStyle: 'italic', textAlign: 'center' }}>
        {STEP_DESCRIPTIONS[currentStep]}
      </p>

      {/* Decomposition table */}
      <div className="decomposition-table-wrapper">
        <table className="decomposition-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Y</th>
              <th>X</th>
              {currentStep >= 1 && <th>Ȳ..</th>}
              {currentStep >= 2 && <th className="col-between">(Ȳ<sub>j</sub> &minus; Ȳ..)<sup>2</sup></th>}
              {currentStep >= 2 && <th className="col-within">(Y &minus; Ȳ<sub>j</sub>)<sup>2</sup></th>}
              {currentStep >= 3 && <th className="col-covariate">Ŷ</th>}
              {currentStep >= 4 && <th className="col-covariate">(Ŷ &minus; Ȳ<sub>j</sub>)<sup>2</sup></th>}
              {currentStep >= 4 && <th className="col-residual">(Y &minus; Ŷ)<sup>2</sup></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const covDev = r.predicted - r.yBar; // deviation predicted from group mean
              return (
                <tr key={r.id} className={groupClass(r.groupIndex)}>
                  <td style={{ color: GROUP_COLORS[r.groupIndex], fontWeight: 500, fontSize: '0.75rem' }}>
                    {r.group}
                  </td>
                  <td>{r.examScore}</td>
                  <td>{r.priorKnowledge}</td>
                  {currentStep >= 1 && (
                    <td className={currentStep === 1 ? 'col-entering' : ''}>
                      {i === 0 ? grandMeanY.toFixed(2) : ''}
                    </td>
                  )}
                  {currentStep >= 2 && (
                    <td className={`col-between ${currentStep === 2 ? 'col-entering' : ''}`}>
                      {r.betweenDevSq.toFixed(2)}
                    </td>
                  )}
                  {currentStep >= 2 && (
                    <td className={`col-within ${currentStep === 2 ? 'col-entering' : ''}`}>
                      {r.withinDevSq.toFixed(2)}
                    </td>
                  )}
                  {currentStep >= 3 && (
                    <td className={`col-covariate ${currentStep === 3 ? 'col-entering' : ''}`}>
                      {r.predicted.toFixed(2)}
                    </td>
                  )}
                  {currentStep >= 4 && (
                    <td className={`col-covariate ${currentStep === 4 ? 'col-entering' : ''}`}>
                      {(covDev ** 2).toFixed(2)}
                    </td>
                  )}
                  {currentStep >= 4 && (
                    <td className={`col-residual ${currentStep === 4 ? 'col-entering' : ''}`}>
                      {r.residualSq.toFixed(2)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {currentStep >= 2 && (
            <tfoot>
              <tr className="sum-row">
                <td colSpan={currentStep >= 1 ? 4 : 3}><strong>Sum</strong></td>
                <td className="col-between"><strong>{ssBetween.toFixed(2)}</strong></td>
                <td className="col-within"><strong>{ssWithin.toFixed(2)}</strong></td>
                {currentStep >= 3 && <td>&mdash;</td>}
                {currentStep >= 4 && <td className="col-covariate"><strong>{ssCovariate.toFixed(2)}</strong></td>}
                {currentStep >= 4 && <td className="col-residual"><strong>{ssResidual.toFixed(2)}</strong></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Verification at final step */}
      {currentStep === 4 && (
        <div className="verification-box">
          <h4>Verification: The Partition Holds</h4>
          <div className="verification-equation">
            SS<sub>Within</sub> = SS<sub>Covariate</sub> + SS<sub>Residual</sub>
          </div>
          <div className="verification-equation">
            {ssWithin.toFixed(2)} = {ssCovariate.toFixed(2)} + {ssResidual.toFixed(2)}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)' }}>
            The covariate explains {((ssCovariate / ssWithin) * 100).toFixed(1)}% of the within-group
            variance, reducing the error term from {ssWithin.toFixed(1)} to {ssResidual.toFixed(1)}.
          </p>
        </div>
      )}

      {/* SS bar comparison */}
      {currentStep >= 2 && (
        <>
          <h3>Visual Comparison</h3>
          <div className="ss-bar-comparison">
            <div>
              <div className="ss-bar-label">ANOVA: SS<sub>Total</sub> = SS<sub>Between</sub> + SS<sub>Within</sub></div>
              <div className="ss-bar">
                <div
                  className="ss-segment"
                  style={{
                    width: `${(ssBetween / ssTotal) * 100}%`,
                    background: '#8b5cf6',
                  }}
                >
                  {ssBetween.toFixed(0)}
                </div>
                <div
                  className="ss-segment"
                  style={{
                    width: `${(ssWithin / ssTotal) * 100}%`,
                    background: '#10b981',
                  }}
                >
                  {ssWithin.toFixed(0)}
                </div>
              </div>
            </div>

            {currentStep >= 4 && (
              <div>
                <div className="ss-bar-label">ANCOVA: SS<sub>Total</sub> = SS<sub>Adj. Groups</sub> + SS<sub>Covariate</sub> + SS<sub>Residual</sub></div>
                <div className="ss-bar">
                  <div
                    className="ss-segment"
                    style={{
                      width: `${(ssAdjustedGroups / ssTotal) * 100}%`,
                      background: '#8b5cf6',
                    }}
                  >
                    {ssAdjustedGroups.toFixed(0)}
                  </div>
                  <div
                    className="ss-segment"
                    style={{
                      width: `${(ssCovariate / ssTotal) * 100}%`,
                      background: '#4361ee',
                    }}
                  >
                    {ssCovariate.toFixed(0)}
                  </div>
                  <div
                    className="ss-segment"
                    style={{
                      width: `${(ssResidual / ssTotal) * 100}%`,
                      background: '#e63946',
                    }}
                  >
                    {ssResidual.toFixed(0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="key-insight">
        <h4>Where the Power Comes From</h4>
        <p>
          In standard ANOVA, all within-group variance is error. ANCOVA
          extracts the portion attributable to the covariate, leaving a
          smaller error term. The F-ratio uses this reduced error in the
          denominator, making it easier to detect a real treatment effect.
          The pooled within-group slope for this dataset is b = {slope.toFixed(3)}.
        </p>
      </div>
    </div>
  );
}
