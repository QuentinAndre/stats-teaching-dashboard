import { useState, useMemo, useCallback } from 'react';
import {
  oneWayANOVA,
  fDistributionPDF,
} from '../../../utils/statistics';

export default function TheFRatio() {
  const [groupSeparation, setGroupSeparation] = useState(12);
  const [withinVariability, setWithinVariability] = useState(15);
  const [dataSeed, setDataSeed] = useState(1);

  const sampleSize = 15;
  const grandMeanBase = 100;

  // Generate data with seeded random
  const data = useMemo(() => {
    const seedRandom = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    };

    const generateSeededNormal = (n: number, mean: number, sd: number, seed: number): number[] => {
      const rand = seedRandom(seed);
      const values: number[] = [];
      for (let i = 0; i < n; i++) {
        const u1 = rand();
        const u2 = rand();
        const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
        values.push(mean + sd * z);
      }
      return values;
    };

    const mean1 = grandMeanBase - groupSeparation / 2;
    const mean2 = grandMeanBase + groupSeparation / 2;

    return {
      group1: generateSeededNormal(sampleSize, mean1, withinVariability, dataSeed * 1000),
      group2: generateSeededNormal(sampleSize, mean2, withinVariability, dataSeed * 2000),
    };
  }, [groupSeparation, withinVariability, dataSeed]);

  // Calculate ANOVA statistics
  const anova = useMemo(() => {
    return oneWayANOVA([data.group1, data.group2]);
  }, [data]);

  // F-distribution critical value at alpha = 0.05
  const alpha = 0.05;
  const fCritical = useMemo(() => {
    // Approximate critical value (would need inverse CDF for exact)
    // For df1=1, df2~28, critical F ≈ 4.20
    // We'll use a simple approximation or show the concept
    return 4.20; // Approximate for df1=1, df2=28
  }, []);

  const isSignificant = anova.pValue < alpha;

  const regenerateData = useCallback(() => {
    setDataSeed((s) => s + 1);
  }, []);

  // SVG dimensions for MS bars
  const barWidth = 300;
  const barHeight = 200;
  const barMargin = { top: 30, right: 20, bottom: 40, left: 60 };
  const barPlotWidth = barWidth - barMargin.left - barMargin.right;
  const barPlotHeight = barHeight - barMargin.top - barMargin.bottom;

  // SVG dimensions for F-distribution
  const fWidth = 500;
  const fHeight = 180;
  const fMargin = { top: 20, right: 20, bottom: 40, left: 40 };
  const fPlotWidth = fWidth - fMargin.left - fMargin.right;
  const fPlotHeight = fHeight - fMargin.top - fMargin.bottom;

  // MS bar scales - use fixed maximum for consistent comparison
  const maxMS = 800;
  const msYScale = (v: number) => barPlotHeight - (v / maxMS) * barPlotHeight;

  // F-distribution curve
  const fCurve = useMemo(() => {
    const df1 = anova.dfBetween;
    const df2 = anova.dfWithin;
    const points: { x: number; y: number }[] = [];
    const fMin = 0;
    const fMax = 10;
    const steps = 150;

    for (let i = 0; i <= steps; i++) {
      const x = fMin + (i / steps) * (fMax - fMin);
      const y = fDistributionPDF(x, df1, df2);
      points.push({ x, y });
    }

    // Use fixed maxY for consistent F-distribution display
    const fixedMaxY = 0.8;
    const xScale = (x: number) => ((x - fMin) / (fMax - fMin)) * fPlotWidth;
    const yScale = (y: number) => fPlotHeight - (y / fixedMaxY) * fPlotHeight * 0.9;

    // Path for curve
    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`)
      .join(' ');

    // Path for shaded rejection region (right tail)
    const rejectionPoints = points.filter((p) => p.x >= fCritical);
    const rejectionPath = rejectionPoints.length > 0
      ? `M ${xScale(fCritical)} ${fPlotHeight} ` +
        rejectionPoints.map((p) => `L ${xScale(p.x)} ${yScale(p.y)}`).join(' ') +
        ` L ${xScale(fMax)} ${fPlotHeight} Z`
      : '';

    return { pathD, rejectionPath, xScale, yScale, fMin, fMax, df1, df2 };
  }, [anova.dfBetween, anova.dfWithin, fPlotWidth, fPlotHeight, fCritical]);

  return (
    <div className="section-intro">
      <h2>Signal vs. Noise: The F-Statistic</h2>

      <p className="intro-text">
        We've partitioned variance into SS<sub>Between</sub> and SS<sub>Within</sub>.
        But raw sums of squares can't be directly compared—they depend on sample size
        and number of groups. To make a fair comparison, we convert them to <strong>Mean Squares</strong>.
      </p>

      <div className="formula-box">
        <h3>From Sums of Squares to Mean Squares</h3>
        <div className="formula">
          <span className="formula-main">MS = SS / df</span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">MS<sub>B</sub></span>
            <span className="explanation">
              SS<sub>Between</sub> / (k − 1), where k = number of groups
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">MS<sub>W</sub></span>
            <span className="explanation">
              SS<sub>Within</sub> / (N − k), where N = total sample size
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">F</span>
            <span className="explanation">
              MS<sub>Between</sub> / MS<sub>Within</sub> — the ratio of between-group to within-group variance
            </span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        The F-ratio tells us: <strong>"How many times larger is the between-group variance
        than the within-group variance?"</strong>
      </p>

      <div className="key-insight">
        <h4>Understanding the F-Ratio</h4>
        <p>
          Under H₀ (no group differences), both MS<sub>Between</sub> and MS<sub>Within</sub>
          estimate the same thing: the population variance σ². So F should be around 1.
          When groups truly differ, MS<sub>Between</sub> is inflated by the group differences,
          making F larger than 1. The bigger F gets, the stronger the evidence against H₀.
        </p>
      </div>

      <div className="viz-container">
        <h4>Interactive F-Ratio Demonstration</h4>

        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="f-group-separation">Group Mean Difference</label>
            <input
              type="range"
              id="f-group-separation"
              min="0"
              max="30"
              value={groupSeparation}
              onChange={(e) => setGroupSeparation(parseInt(e.target.value))}
            />
            <span className="control-value">{groupSeparation}</span>
          </div>
          <div className="control-group">
            <label htmlFor="f-within-variability">Within-Group SD</label>
            <input
              type="range"
              id="f-within-variability"
              min="5"
              max="30"
              value={withinVariability}
              onChange={(e) => setWithinVariability(parseInt(e.target.value))}
            />
            <span className="control-value">{withinVariability}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="primary-button" onClick={regenerateData}>
              New Data
            </button>
          </div>
        </div>

        {/* Mean Squares Comparison */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-xl)', flexWrap: 'wrap', marginTop: 'var(--spacing-lg)' }}>
          {/* MS Bar Chart */}
          <div>
            <h4 style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)', fontSize: '0.9375rem' }}>
              Mean Squares Comparison
            </h4>
            <svg width={barWidth} height={barHeight} viewBox={`0 0 ${barWidth} ${barHeight}`}>
              <g transform={`translate(${barMargin.left}, ${barMargin.top})`}>
                {/* Y-axis */}
                <line x1={0} y1={0} x2={0} y2={barPlotHeight} stroke="var(--border)" strokeWidth={1} />

                {/* Y-axis ticks */}
                {[0, maxMS / 2, maxMS].map((tick, i) => (
                  <g key={i} transform={`translate(0, ${msYScale(tick)})`}>
                    <line x1={-5} y1={0} x2={0} y2={0} stroke="var(--border)" />
                    <text x={-10} y={4} textAnchor="end" fontSize={10} fill="var(--text-secondary)">
                      {tick.toFixed(0)}
                    </text>
                  </g>
                ))}

                {/* MS Between bar */}
                <rect
                  x={barPlotWidth * 0.15}
                  y={msYScale(Math.min(anova.msBetween, maxMS))}
                  width={barPlotWidth * 0.3}
                  height={barPlotHeight - msYScale(Math.min(anova.msBetween, maxMS))}
                  fill="#8b5cf6"
                  opacity={0.8}
                />
                {/* Show arrow if exceeds scale */}
                {anova.msBetween > maxMS && (
                  <text
                    x={barPlotWidth * 0.3}
                    y={8}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#8b5cf6"
                  >
                    ↑
                  </text>
                )}
                <text
                  x={barPlotWidth * 0.3}
                  y={anova.msBetween > maxMS ? 20 : msYScale(Math.min(anova.msBetween, maxMS)) - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#8b5cf6"
                  fontWeight={600}
                >
                  {anova.msBetween.toFixed(1)}
                </text>

                {/* MS Within bar */}
                <rect
                  x={barPlotWidth * 0.55}
                  y={msYScale(Math.min(anova.msWithin, maxMS))}
                  width={barPlotWidth * 0.3}
                  height={barPlotHeight - msYScale(Math.min(anova.msWithin, maxMS))}
                  fill="#10b981"
                  opacity={0.8}
                />
                {/* Show arrow if exceeds scale */}
                {anova.msWithin > maxMS && (
                  <text
                    x={barPlotWidth * 0.7}
                    y={8}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#10b981"
                  >
                    ↑
                  </text>
                )}
                <text
                  x={barPlotWidth * 0.7}
                  y={anova.msWithin > maxMS ? 20 : msYScale(Math.min(anova.msWithin, maxMS)) - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#10b981"
                  fontWeight={600}
                >
                  {anova.msWithin.toFixed(1)}
                </text>

                {/* X-axis labels */}
                <text
                  x={barPlotWidth * 0.3}
                  y={barPlotHeight + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                >
                  MS<tspan baselineShift="sub" fontSize={9}>Between</tspan>
                </text>
                <text
                  x={barPlotWidth * 0.7}
                  y={barPlotHeight + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                >
                  MS<tspan baselineShift="sub" fontSize={9}>Within</tspan>
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* F-ratio calculation display */}
        <div style={{
          textAlign: 'center',
          margin: 'var(--spacing-lg) 0',
          padding: 'var(--spacing-md)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--border-radius-md)',
          fontFamily: "'Times New Roman', serif"
        }}>
          <span style={{ fontSize: '1.25rem' }}>
            F = MS<sub>B</sub> / MS<sub>W</sub> = {anova.msBetween.toFixed(2)} / {anova.msWithin.toFixed(2)} ={' '}
            <strong style={{ color: isSignificant ? 'var(--accent)' : 'var(--primary)' }}>
              {anova.fStatistic.toFixed(2)}
            </strong>
          </span>
        </div>

        {/* F-distribution visualization */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-lg)' }}>
          <div>
            <h4 style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)', fontSize: '0.9375rem' }}>
              F-Distribution (df<sub>1</sub> = {fCurve.df1}, df<sub>2</sub> = {fCurve.df2})
            </h4>
            <svg width={fWidth} height={fHeight} viewBox={`0 0 ${fWidth} ${fHeight}`}>
              <g transform={`translate(${fMargin.left}, ${fMargin.top})`}>
                {/* Rejection region shading */}
                <path d={fCurve.rejectionPath} fill="var(--accent)" opacity={0.2} />

                {/* Curve */}
                <path d={fCurve.pathD} fill="none" stroke="var(--text-secondary)" strokeWidth={2} />

                {/* X-axis */}
                <line x1={0} y1={fPlotHeight} x2={fPlotWidth} y2={fPlotHeight} stroke="var(--border)" />

                {/* Critical value line */}
                <line
                  x1={fCurve.xScale(fCritical)}
                  y1={0}
                  x2={fCurve.xScale(fCritical)}
                  y2={fPlotHeight}
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  strokeDasharray="4,2"
                />
                <text
                  x={fCurve.xScale(fCritical)}
                  y={fPlotHeight + 30}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--accent)"
                >
                  F<sub>crit</sub> = {fCritical.toFixed(2)}
                </text>

                {/* Observed F value */}
                {anova.fStatistic <= 10 && (
                  <>
                    <line
                      x1={fCurve.xScale(anova.fStatistic)}
                      y1={0}
                      x2={fCurve.xScale(anova.fStatistic)}
                      y2={fPlotHeight}
                      stroke={isSignificant ? 'var(--accent)' : 'var(--primary)'}
                      strokeWidth={2}
                    />
                    <circle
                      cx={fCurve.xScale(anova.fStatistic)}
                      cy={15}
                      r={6}
                      fill={isSignificant ? 'var(--accent)' : 'var(--primary)'}
                    />
                    <text
                      x={fCurve.xScale(anova.fStatistic)}
                      y={-2}
                      textAnchor="middle"
                      fontSize={11}
                      fill={isSignificant ? 'var(--accent)' : 'var(--primary)'}
                      fontWeight={600}
                    >
                      F = {anova.fStatistic.toFixed(2)}
                    </text>
                  </>
                )}

                {/* X-axis labels */}
                {[0, 2, 4, 6, 8, 10].map((tick) => (
                  <text
                    key={tick}
                    x={fCurve.xScale(tick)}
                    y={fPlotHeight + 15}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--text-secondary)"
                  >
                    {tick}
                  </text>
                ))}

                {/* Alpha label */}
                <text
                  x={fCurve.xScale(7)}
                  y={30}
                  textAnchor="start"
                  fontSize={10}
                  fill="var(--accent)"
                >
                  α = .05
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Results display */}
        <div className="results-row" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="result-card">
            <div className="result-label">F-statistic</div>
            <div className="result-value" style={{ color: isSignificant ? 'var(--accent)' : 'var(--primary)' }}>
              {anova.fStatistic.toFixed(3)}
            </div>
          </div>
          <div className="result-card">
            <div className="result-label">p-value</div>
            <div className={`result-value ${isSignificant ? 'significant' : 'not-significant'}`}>
              {anova.pValue < 0.001 ? '< .001' : anova.pValue.toFixed(3)}
            </div>
          </div>
          <div className="result-card">
            <div className="result-label">df</div>
            <div className="result-value">{anova.dfBetween}, {anova.dfWithin}</div>
          </div>
        </div>

        <div className={`decision-indicator ${isSignificant ? 'reject' : 'fail-to-reject'}`}>
          {isSignificant
            ? `Reject H₀: Groups differ significantly (F = ${anova.fStatistic.toFixed(2)}, p < .05)`
            : `Fail to reject H₀: No significant difference (F = ${anova.fStatistic.toFixed(2)}, p ≥ .05)`}
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-lg)', border: '1px solid var(--border)' }}>
        <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>What to Explore</h4>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <li>
            <strong>Increase "Group Mean Difference"</strong>: Watch MS<sub>Between</sub> grow
            while MS<sub>Within</sub> stays relatively stable. F increases, and you're more likely to reject H₀.
          </li>
          <li>
            <strong>Increase "Within-Group SD"</strong>: Watch MS<sub>Within</sub> grow.
            The same group difference becomes harder to detect (F decreases).
          </li>
          <li>
            <strong>Key insight</strong>: Statistical significance depends on both the signal
            (group differences) AND the noise (within-group variation).
          </li>
        </ul>
      </div>
    </div>
  );
}
