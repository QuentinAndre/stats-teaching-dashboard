import { useState, useMemo } from 'react';
import { tDistributionPDF, tDistributionCDF } from '../../../utils/statistics';

export default function TwoSampleTest() {
  const [meanDifference, setMeanDifference] = useState(5);
  const [sampleSize, setSampleSize] = useState(25);
  const [sigma1, setSigma1] = useState(15);
  const [sigma2, setSigma2] = useState(15);

  // Deterministic calculation of statistics from slider values
  const stats = useMemo(() => {
    // Standard error of each group mean
    const se1 = sigma1 / Math.sqrt(sampleSize);
    const se2 = sigma2 / Math.sqrt(sampleSize);

    // Standard error of the difference
    const seDiff = Math.sqrt(se1 * se1 + se2 * se2);

    // t-statistic: observed difference divided by SE
    const t = meanDifference / seDiff;

    // Welch-Satterthwaite degrees of freedom approximation
    const v1 = sampleSize - 1;
    const v2 = sampleSize - 1;
    const s1Sq = sigma1 * sigma1;
    const s2Sq = sigma2 * sigma2;
    const numerator = Math.pow(s1Sq / sampleSize + s2Sq / sampleSize, 2);
    const denominator = Math.pow(s1Sq / sampleSize, 2) / v1 + Math.pow(s2Sq / sampleSize, 2) / v2;
    const df = numerator / denominator;

    // Two-tailed p-value
    const p = 2 * (1 - tDistributionCDF(Math.abs(t), df));

    return {
      meanDiff: meanDifference,
      seDiff,
      t,
      df,
      p,
    };
  }, [sampleSize, meanDifference, sigma1, sigma2]);

  // Visualization dimensions
  const width = 700;
  const height = 300;
  const margin = { top: 60, right: 30, bottom: 60, left: 50 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Critical t-value for alpha = 0.05, two-tailed
  const criticalT = 2.0;

  const isSignificant = stats.p < 0.05;

  // Mean difference visualization (similar to OneSampleTest Step 4)
  const MeanDifferenceViz = () => {
    // Critical value in mean difference units
    const criticalDiff = criticalT * stats.seDiff;

    // X-axis range: show ±4 SE worth of mean differences, but at least ±20
    const xRange = Math.max(4 * stats.seDiff, 20);
    const diffMin = -xRange;
    const diffMax = xRange;

    const diffScale = (diff: number) => ((diff - diffMin) / (diffMax - diffMin)) * plotWidth;

    // Generate the sampling distribution curve (scaled t-distribution)
    const dfInt = Math.max(1, Math.floor(stats.df));
    const diffCurve = useMemo(() => {
      const points: { diff: number; pdf: number }[] = [];
      const step = (diffMax - diffMin) / 200;
      for (let d = diffMin; d <= diffMax; d += step) {
        const tVal = d / stats.seDiff;
        const pdfVal = tDistributionPDF(tVal, dfInt) / stats.seDiff;
        points.push({ diff: d, pdf: pdfVal });
      }
      return points;
    }, [stats.seDiff, dfInt, diffMin, diffMax]);

    const maxPDF = Math.max(...diffCurve.map((p) => p.pdf));
    const yScaleDiff = (pdf: number) => plotHeight - (pdf / maxPDF) * plotHeight * 0.85;

    // Create curve path
    const curvePath = diffCurve
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${diffScale(p.diff)} ${yScaleDiff(p.pdf)}`)
      .join(' ');

    // Create rejection region paths
    const leftTailPoints = diffCurve.filter((p) => p.diff <= -criticalDiff);
    const rightTailPoints = diffCurve.filter((p) => p.diff >= criticalDiff);

    const leftTailPath = leftTailPoints.length > 0
      ? leftTailPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${diffScale(p.diff)} ${yScaleDiff(p.pdf)}`).join(' ')
      : '';
    const rightTailPath = rightTailPoints.length > 0
      ? rightTailPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${diffScale(p.diff)} ${yScaleDiff(p.pdf)}`).join(' ')
      : '';

    // Clamp the observed mean difference for display
    const clampedDiff = Math.max(diffMin, Math.min(diffMax, stats.meanDiff));
    const markerX = diffScale(clampedDiff);

    // Position the label above the marker
    const labelY = -15;

    // Generate nice x-axis ticks
    const tickStep = Math.ceil(xRange / 4 / 5) * 5;
    const ticks: number[] = [];
    for (let t = -Math.floor(xRange / tickStep) * tickStep; t <= xRange; t += tickStep) {
      if (t >= diffMin && t <= diffMax) {
        ticks.push(t);
      }
    }
    if (!ticks.includes(0)) {
      ticks.push(0);
      ticks.sort((a, b) => a - b);
    }

    return (
      <div className="viz-container">
        <h4>Sampling Distribution of Mean Differences Under H₀ (df = {stats.df.toFixed(1)})</h4>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Rejection regions (shaded) */}
            {leftTailPath && (
              <path
                d={`${leftTailPath} L ${diffScale(-criticalDiff)} ${plotHeight} L ${diffScale(diffMin)} ${plotHeight} Z`}
                fill="var(--accent)"
                opacity={0.3}
              />
            )}
            {rightTailPath && (
              <path
                d={`${rightTailPath} L ${diffScale(diffMax)} ${plotHeight} L ${diffScale(criticalDiff)} ${plotHeight} Z`}
                fill="var(--accent)"
                opacity={0.3}
              />
            )}

            {/* Distribution curve */}
            <path d={curvePath} fill="none" stroke="var(--primary)" strokeWidth={2} />

            {/* Critical value lines */}
            <line
              x1={diffScale(-criticalDiff)}
              y1={0}
              x2={diffScale(-criticalDiff)}
              y2={plotHeight}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <line
              x1={diffScale(criticalDiff)}
              y1={0}
              x2={diffScale(criticalDiff)}
              y2={plotHeight}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="4,4"
            />

            {/* Center line at 0 */}
            <line
              x1={diffScale(0)}
              y1={0}
              x2={diffScale(0)}
              y2={plotHeight}
              stroke="var(--text-secondary)"
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.5}
            />

            {/* Observed mean difference marker */}
            <line
              x1={markerX}
              y1={0}
              x2={markerX}
              y2={plotHeight}
              stroke={isSignificant ? 'var(--accent)' : 'var(--primary)'}
              strokeWidth={3}
            />
            <circle
              cx={markerX}
              cy={0}
              r={6}
              fill={isSignificant ? 'var(--accent)' : 'var(--primary)'}
            />

            {/* Label above the marker */}
            <text
              x={markerX}
              y={labelY}
              textAnchor="middle"
              fontSize={11}
              fill={isSignificant ? 'var(--accent)' : 'var(--primary)'}
              fontWeight={600}
            >
              t = {stats.t.toFixed(2)}, df = {stats.df.toFixed(1)}
            </text>

            {/* X-axis */}
            <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="var(--border)" />
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={diffScale(tick)}
                  y1={plotHeight}
                  x2={diffScale(tick)}
                  y2={plotHeight + 5}
                  stroke="var(--border)"
                />
                <text
                  x={diffScale(tick)}
                  y={plotHeight + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                >
                  {tick === 0 ? '0' : (tick > 0 ? `+${tick}` : tick)}
                </text>
              </g>
            ))}
            <text
              x={plotWidth / 2}
              y={plotHeight + 40}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Mean Difference (X̄₂ - X̄₁)
            </text>

            {/* Rejection region labels */}
            <text
              x={diffScale(diffMin + (-criticalDiff - diffMin) / 2)}
              y={plotHeight - 15}
              textAnchor="middle"
              fontSize={10}
              fill="var(--accent)"
            >
              Reject H₀
            </text>
            <text
              x={diffScale(criticalDiff + (diffMax - criticalDiff) / 2)}
              y={plotHeight - 15}
              textAnchor="middle"
              fontSize={10}
              fill="var(--accent)"
            >
              Reject H₀
            </text>
          </g>
        </svg>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)' }}>
          The dashed lines mark the critical values (±{criticalDiff.toFixed(1)}) for α = 0.05.
          Your observed difference of {stats.meanDiff > 0 ? '+' : ''}{stats.meanDiff.toFixed(1)} {isSignificant ? 'falls in the rejection region' : 'is within the acceptance region'}.
        </p>
      </div>
    );
  };

  return (
    <div className="section-intro">
      <h2>The Two-Sample t-Test</h2>

      <p className="intro-text">
        The <strong>two-sample t-test</strong> extends the logic of NHST to compare two groups.
        Instead of asking "Does this sample differ from a known value?", we ask:
        "Do these two samples come from populations with different means?"
      </p>

      <div className="key-insight">
        <h4>The Null Hypothesis for Two Samples</h4>
        <p>
          Under the null hypothesis, <strong>both groups come from populations with the same mean</strong>.
          Any observed difference between sample means is due to sampling variability alone.
          In other words, the null hypothesis is that the <em>difference between the two means</em> is centered at zero.
        </p>
      </div>

      <h3>The t-Statistic for Two Samples</h3>

      <p className="intro-text">
        The two-sample t-statistic measures how many standard errors the observed difference
        is from zero (the null hypothesis value):
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">t = (X̄₂ - X̄₁) / SE<sub>diff</sub></span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">X̄₂ - X̄₁</span>
            <span className="explanation">
              Observed difference between sample means = <strong>{stats.meanDiff.toFixed(2)}</strong>
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SE<sub>diff</sub></span>
            <span className="explanation">
              Standard Error of the difference = √(SE₁² + SE₂²) = <strong>{stats.seDiff.toFixed(2)}</strong>
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)', fontSize: '1.125rem' }}>
          t = {stats.meanDiff.toFixed(2)} / {stats.seDiff.toFixed(2)} = <strong style={{ color: 'var(--primary)' }}>{stats.t.toFixed(3)}</strong>
        </div>
      </div>

      <h3>The Sampling Distribution Under H₀</h3>

      <p className="intro-text">
        Under the null hypothesis (no true difference between groups), the difference between
        sample means follows a distribution centered at zero. The shape of this distribution
        depends on the sample sizes and variances of both groups.
      </p>

      <div className="controls-row">
        <div className="control-group">
          <label>Mean Diff (μ₂ - μ₁)</label>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={meanDifference}
            onChange={(e) => setMeanDifference(Number(e.target.value))}
          />
          <span className="control-value">{meanDifference}</span>
        </div>
        <div className="control-group">
          <label>Sample Size (n)</label>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
          />
          <span className="control-value">{sampleSize}</span>
        </div>
        <div className="control-group">
          <label>Group 1 SD (σ₁)</label>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={sigma1}
            onChange={(e) => setSigma1(Number(e.target.value))}
          />
          <span className="control-value">{sigma1}</span>
        </div>
        <div className="control-group">
          <label>Group 2 SD (σ₂)</label>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={sigma2}
            onChange={(e) => setSigma2(Number(e.target.value))}
          />
          <span className="control-value">{sigma2}</span>
        </div>
      </div>

      <MeanDifferenceViz />

      <div className="results-row">
        <div className="result-card">
          <div className="result-label">Observed Difference</div>
          <div className="result-value">{stats.meanDiff.toFixed(2)}</div>
        </div>
        <div className="result-card">
          <div className="result-label">t-statistic</div>
          <div className="result-value">{stats.t.toFixed(3)}</div>
        </div>
        <div className="result-card">
          <div className="result-label">df (Welch)</div>
          <div className="result-value">{stats.df.toFixed(1)}</div>
        </div>
        <div className="result-card">
          <div className="result-label">p-value</div>
          <div className={`result-value ${isSignificant ? 'significant' : 'not-significant'}`}>
            {stats.p < 0.001 ? '< .001' : stats.p.toFixed(3)}
          </div>
        </div>
      </div>

      <div className={`decision-indicator ${isSignificant ? 'reject' : 'fail-to-reject'}`}>
        {isSignificant
          ? `Reject H₀: The groups differ significantly (p < .05)`
          : `Fail to reject H₀: No significant difference detected (p ≥ .05)`}
      </div>

      <h3>Degrees of Freedom: The Welch-Satterthwaite Approximation</h3>

      <p className="intro-text">
        You might have noticed that the degrees of freedom change not only as a function of the
        number of observations (as in the one-sample t-test case), but also as a function of the
        difference in variance between the two samples. This is called the <strong>Welch-Satterthwaite
        Approximation</strong> for the degrees of freedom, and provides a more accurate null distribution
        when the variances are unequal.
      </p>
    </div>
  );
}
