import { useState, useMemo } from 'react';
import { ANCOVA_DATA, GROUP_COLORS, GROUP_NAMES, getGroupedData } from '../data';
import { oneWayANCOVA, oneWayANOVA } from '../../../utils/statistics';

const SVG_WIDTH = 500;
const SVG_HEIGHT = 300;
const MARGIN = { top: 20, right: 20, bottom: 50, left: 55 };
const PLOT_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

const BAR_SVG_WIDTH = 360;
const BAR_SVG_HEIGHT = 280;
const BAR_MARGIN = { top: 20, right: 20, bottom: 50, left: 55 };
const BAR_PLOT_WIDTH = BAR_SVG_WIDTH - BAR_MARGIN.left - BAR_MARGIN.right;
const BAR_PLOT_HEIGHT = BAR_SVG_HEIGHT - BAR_MARGIN.top - BAR_MARGIN.bottom;

export default function AdjustedMeans() {
  const [slopeMultiplier, setSlopeMultiplier] = useState(1.0);

  // Base statistics from the real data
  const baseStats = useMemo(() => {
    const grouped = getGroupedData();
    const ancova = oneWayANCOVA(grouped);
    const anova = oneWayANOVA(grouped.map((g) => g.map((p) => p.y)));
    return { ancova, anova, grouped };
  }, []);

  // Adjusted statistics based on slider (scales the pooled slope)
  const adjusted = useMemo(() => {
    const b = baseStats.ancova.pooledSlope * slopeMultiplier;
    const grandMeanX = baseStats.ancova.grandMeanX;
    const rawMeans = baseStats.ancova.rawMeans;
    const covMeans = baseStats.ancova.covariateMeans;

    // Adjusted means: Ȳ'_j = Ȳ_j - b(X̄_j - X̄..)
    const adjMeans = rawMeans.map(
      (yBar, j) => yBar - b * (covMeans[j] - grandMeanX)
    );

    // Compute SS_residual with the scaled slope
    let ssResidual = 0;
    for (let j = 0; j < 3; j++) {
      const group = baseStats.grouped[j];
      const yBar = rawMeans[j];
      const xBar = covMeans[j];
      for (const p of group) {
        const predicted = yBar + b * (p.x - xBar);
        ssResidual += (p.y - predicted) ** 2;
      }
    }

    const ssWithin = baseStats.anova.ssWithin;
    const ssCovariate = ssWithin - ssResidual;
    const reduction = ssWithin > 0 ? ((ssCovariate) / ssWithin) * 100 : 0;

    return { adjMeans, slope: b, ssResidual, ssCovariate, reduction };
  }, [slopeMultiplier, baseStats]);

  // Scatter plot scales
  const X_MIN = 2;
  const X_MAX = 9;
  const Y_MIN = 55;
  const Y_MAX = 90;

  function xScale(val: number): number {
    return MARGIN.left + ((val - X_MIN) / (X_MAX - X_MIN)) * PLOT_WIDTH;
  }
  function yScale(val: number): number {
    return MARGIN.top + ((Y_MAX - val) / (Y_MAX - Y_MIN)) * PLOT_HEIGHT;
  }

  // Bar chart scales
  const barYMin = 55;
  const barYMax = 85;
  function barYScale(val: number): number {
    return BAR_MARGIN.top + ((barYMax - val) / (barYMax - barYMin)) * BAR_PLOT_HEIGHT;
  }

  const barWidth = BAR_PLOT_WIDTH / 3 - 20;
  const barXPositions = GROUP_NAMES.map((_, i) => BAR_MARGIN.left + (BAR_PLOT_WIDTH / 3) * i + (BAR_PLOT_WIDTH / 3 - barWidth) / 2);

  const scatterXTicks = [3, 4, 5, 6, 7, 8];
  const scatterYTicks = [60, 65, 70, 75, 80, 85];
  const barYTicks = [55, 60, 65, 70, 75, 80, 85];

  return (
    <div className="section-intro">
      <h2>Adjusted Means</h2>

      <p className="intro-text">
        The adjusted mean for each group answers the question: what would the
        group mean be if all groups had the same average covariate score? The
        formula shifts each group&rsquo;s raw mean up or down based on how far
        the group&rsquo;s covariate mean deviates from the overall covariate
        mean.
      </p>

      <div className="formula-box">
        <h3>Adjusted Group Mean</h3>
        <div className="formula">
          <span className="formula-main">
            Ȳ&prime;<sub>j</sub> = Ȳ<sub>j</sub> &minus; b(X̄<sub>j</sub> &minus; X̄<sub>..</sub>)
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">Ȳ&prime;<sub>j</sub></span>
            <span className="explanation">Adjusted mean for group <em>j</em></span>
          </div>
          <div className="formula-part">
            <span className="symbol">Ȳ<sub>j</sub></span>
            <span className="explanation">Raw (unadjusted) mean</span>
          </div>
          <div className="formula-part">
            <span className="symbol">b</span>
            <span className="explanation">Pooled within-group slope</span>
          </div>
          <div className="formula-part">
            <span className="symbol">X̄<sub>j</sub> &minus; X̄<sub>..</sub></span>
            <span className="explanation">Covariate deviation from grand mean</span>
          </div>
        </div>
      </div>

      <h3>How It Works</h3>

      <p className="intro-text">
        If a group has above-average covariate scores, its raw mean is
        inflated by the covariate&rsquo;s effect. The adjustment
        subtracts b &times; (X̄<sub>j</sub> &minus; X̄<sub>..</sub>) to remove that
        advantage. For groups with below-average covariate scores, the
        adjustment adds points back.
      </p>

      <h3>Numerical Example</h3>

      <div className="viz-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Ȳ<sub>j</sub></th>
              <th>X̄<sub>j</sub></th>
              <th>X̄<sub>j</sub> &minus; X̄<sub>..</sub></th>
              <th>Adjustment</th>
              <th>Ȳ&prime;<sub>j</sub></th>
            </tr>
          </thead>
          <tbody>
            {GROUP_NAMES.map((name, gi) => {
              const dev = baseStats.ancova.covariateMeans[gi] - baseStats.ancova.grandMeanX;
              const adj = baseStats.ancova.pooledSlope * dev;
              return (
                <tr key={name}>
                  <td style={{ color: GROUP_COLORS[gi], fontWeight: 600 }}>{name}</td>
                  <td>{baseStats.ancova.rawMeans[gi].toFixed(2)}</td>
                  <td>{baseStats.ancova.covariateMeans[gi].toFixed(2)}</td>
                  <td>{dev >= 0 ? '+' : ''}{dev.toFixed(2)}</td>
                  <td>{adj >= 0 ? '' : '+'}{(-adj).toFixed(2)}</td>
                  <td><strong>{baseStats.ancova.adjustedMeans[gi].toFixed(2)}</strong></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>Grand</td>
              <td>{baseStats.ancova.grandMeanY.toFixed(2)}</td>
              <td>{baseStats.ancova.grandMeanX.toFixed(2)}</td>
              <td>&mdash;</td>
              <td>&mdash;</td>
              <td>{baseStats.ancova.grandMeanY.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'var(--spacing-sm)' }}>
          Pooled within-group slope: b = {baseStats.ancova.pooledSlope.toFixed(3)}
        </p>
      </div>

      <p className="intro-text">
        After adjustment, the Lecture group&rsquo;s mean <em>drops</em>{' '}
        (because it had above-average prior knowledge), while the Flipped
        group&rsquo;s mean <em>rises</em> (because it had below-average prior
        knowledge). The adjusted difference between groups is now larger than
        the raw difference, revealing a treatment effect that was partially
        hidden by the covariate imbalance.
      </p>

      <h3>Exploring the Covariate&rsquo;s Impact</h3>

      <p className="intro-text">
        Use the slider below to scale the regression slope. When the slope is
        near zero, the covariate has little effect and adjusted means match
        the raw means. As the slope increases, the covariate explains more
        within-group variance, adjusted means diverge further from raw means,
        and the error term shrinks.
      </p>

      <div className="controls-row">
        <div className="control-group">
          <label htmlFor="slope-slider">Regression slope strength</label>
          <input
            id="slope-slider"
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={slopeMultiplier}
            onChange={(e) => setSlopeMultiplier(parseFloat(e.target.value))}
          />
          <span className="control-value">b = {adjusted.slope.toFixed(2)}</span>
        </div>
      </div>

      <div className="dual-panel">
        {/* Left: Scatter plot with regression lines */}
        <div className="viz-container" style={{ padding: 'var(--spacing-md)' }}>
          <h4>Scatter Plot with Regression Lines</h4>
          <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} style={{ width: '100%' }}>
            {/* Grid */}
            {scatterYTicks.map((t) => (
              <line
                key={`grid-${t}`}
                x1={MARGIN.left}
                y1={yScale(t)}
                x2={SVG_WIDTH - MARGIN.right}
                y2={yScale(t)}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.4"
              />
            ))}

            {/* Regression lines */}
            {GROUP_NAMES.map((_, gi) => {
              const intercept = baseStats.ancova.rawMeans[gi] - adjusted.slope * baseStats.ancova.covariateMeans[gi];
              const y1Val = intercept + adjusted.slope * X_MIN;
              const y2Val = intercept + adjusted.slope * X_MAX;
              return (
                <line
                  key={`regline-${gi}`}
                  x1={xScale(X_MIN)}
                  y1={yScale(Math.max(Y_MIN, Math.min(Y_MAX, y1Val)))}
                  x2={xScale(X_MAX)}
                  y2={yScale(Math.max(Y_MIN, Math.min(Y_MAX, y2Val)))}
                  stroke={GROUP_COLORS[gi]}
                  strokeWidth={2}
                  opacity={0.7}
                />
              );
            })}

            {/* Data points */}
            {ANCOVA_DATA.map((d) => (
              <circle
                key={d.id}
                cx={xScale(d.priorKnowledge)}
                cy={yScale(d.examScore)}
                r={4.5}
                fill={GROUP_COLORS[d.groupIndex]}
                opacity={0.7}
                stroke="white"
                strokeWidth={1}
              />
            ))}

            {/* Axes */}
            <line x1={MARGIN.left} y1={MARGIN.top + PLOT_HEIGHT} x2={SVG_WIDTH - MARGIN.right} y2={MARGIN.top + PLOT_HEIGHT} stroke="var(--text-secondary)" />
            {scatterXTicks.map((t) => (
              <text key={t} x={xScale(t)} y={MARGIN.top + PLOT_HEIGHT + 16} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">{t}</text>
            ))}
            <text x={MARGIN.left + PLOT_WIDTH / 2} y={SVG_HEIGHT - 5} textAnchor="middle" fontSize="11" fill="var(--text-primary)">Prior Knowledge</text>

            <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + PLOT_HEIGHT} stroke="var(--text-secondary)" />
            {scatterYTicks.map((t) => (
              <text key={t} x={MARGIN.left - 8} y={yScale(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-secondary)">{t}</text>
            ))}
            <text x={12} y={MARGIN.top + PLOT_HEIGHT / 2} textAnchor="middle" fontSize="11" fill="var(--text-primary)" transform={`rotate(-90, 12, ${MARGIN.top + PLOT_HEIGHT / 2})`}>Exam Score</text>
          </svg>
        </div>

        {/* Right: Bar chart comparing raw vs adjusted means */}
        <div className="viz-container" style={{ padding: 'var(--spacing-md)' }}>
          <h4>Raw vs. Adjusted Means</h4>
          <svg viewBox={`0 0 ${BAR_SVG_WIDTH} ${BAR_SVG_HEIGHT}`} style={{ width: '100%' }}>
            {/* Grid */}
            {barYTicks.map((t) => (
              <line
                key={`bg-${t}`}
                x1={BAR_MARGIN.left}
                y1={barYScale(t)}
                x2={BAR_SVG_WIDTH - BAR_MARGIN.right}
                y2={barYScale(t)}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.4"
              />
            ))}

            {/* Bars */}
            {GROUP_NAMES.map((name, gi) => {
              const rawH = barYScale(barYMin) - barYScale(baseStats.ancova.rawMeans[gi]);
              const adjH = barYScale(barYMin) - barYScale(adjusted.adjMeans[gi]);
              const halfBar = barWidth / 2 - 2;
              return (
                <g key={name}>
                  {/* Raw mean bar (outline) */}
                  <rect
                    x={barXPositions[gi]}
                    y={barYScale(baseStats.ancova.rawMeans[gi])}
                    width={halfBar}
                    height={Math.max(0, rawH)}
                    fill={GROUP_COLORS[gi]}
                    opacity={0.2}
                    stroke={GROUP_COLORS[gi]}
                    strokeWidth={2}
                    rx={2}
                  />
                  {/* Adjusted mean bar (solid) */}
                  <rect
                    x={barXPositions[gi] + halfBar + 4}
                    y={barYScale(adjusted.adjMeans[gi])}
                    width={halfBar}
                    height={Math.max(0, adjH)}
                    fill={GROUP_COLORS[gi]}
                    opacity={0.7}
                    rx={2}
                  />
                  {/* Labels */}
                  <text
                    x={barXPositions[gi] + barWidth / 2}
                    y={barYScale(barYMin) + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--text-primary)"
                    fontWeight="500"
                  >
                    {name}
                  </text>
                  {/* Value labels */}
                  <text
                    x={barXPositions[gi] + halfBar / 2}
                    y={barYScale(baseStats.ancova.rawMeans[gi]) - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill={GROUP_COLORS[gi]}
                  >
                    {baseStats.ancova.rawMeans[gi].toFixed(1)}
                  </text>
                  <text
                    x={barXPositions[gi] + halfBar + 4 + halfBar / 2}
                    y={barYScale(adjusted.adjMeans[gi]) - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill={GROUP_COLORS[gi]}
                    fontWeight="700"
                  >
                    {adjusted.adjMeans[gi].toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Y axis */}
            <line x1={BAR_MARGIN.left} y1={BAR_MARGIN.top} x2={BAR_MARGIN.left} y2={BAR_MARGIN.top + BAR_PLOT_HEIGHT} stroke="var(--text-secondary)" />
            {barYTicks.map((t) => (
              <text key={t} x={BAR_MARGIN.left - 8} y={barYScale(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-secondary)">{t}</text>
            ))}

            {/* Legend */}
            <rect x={BAR_MARGIN.left + 10} y={BAR_MARGIN.top + 5} width={12} height={12} fill="var(--text-secondary)" opacity={0.2} stroke="var(--text-secondary)" strokeWidth={1.5} rx={1} />
            <text x={BAR_MARGIN.left + 26} y={BAR_MARGIN.top + 15} fontSize="10" fill="var(--text-secondary)">Raw</text>
            <rect x={BAR_MARGIN.left + 60} y={BAR_MARGIN.top + 5} width={12} height={12} fill="var(--text-secondary)" opacity={0.7} rx={1} />
            <text x={BAR_MARGIN.left + 76} y={BAR_MARGIN.top + 15} fontSize="10" fill="var(--text-secondary)">Adjusted</text>
          </svg>
        </div>
      </div>

      {/* Error reduction summary */}
      <div className="results-row">
        <div className="result-card">
          <h5>SS<sub>Error</sub> (ANOVA)</h5>
          <div className="result-value">{baseStats.anova.ssWithin.toFixed(1)}</div>
        </div>
        <div className="result-card">
          <h5>SS<sub>Residual</sub> (ANCOVA)</h5>
          <div className="result-value">{adjusted.ssResidual.toFixed(1)}</div>
        </div>
        <div className="result-card">
          <h5>Error Reduction</h5>
          <div className="result-value">{adjusted.reduction.toFixed(1)}%</div>
        </div>
      </div>

      <div className="key-insight">
        <h4>What Adjusted Means Tell You</h4>
        <p>
          Adjusted means answer the question: &ldquo;What would the group means
          look like if all groups had the same average prior knowledge?&rdquo;
          The stronger the covariate&ndash;DV relationship (steeper slope), the
          more the adjustment matters and the more error variance is removed.
        </p>
      </div>
    </div>
  );
}
