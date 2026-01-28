import { useState, useMemo } from 'react';
import {
  tDistributionPDF,
  tDistributionCDF,
} from '../../../utils/statistics';

export default function OneSampleTest() {
  // Fixed scenario values for initial walkthrough
  const nullMean = 100;
  const fixedSampleSize = 30;
  const fixedObservedMean = 105;
  const fixedSampleSD = 15;

  // Interactive controls for Step 4
  const [interactiveMean, setInteractiveMean] = useState(105);
  const [interactiveN, setInteractiveN] = useState(30);
  const [interactiveSD, setInteractiveSD] = useState(15);

  // Fixed statistics for Steps 1-3
  const fixedStats = useMemo(() => {
    const standardError = fixedSampleSD / Math.sqrt(fixedSampleSize);
    const tStatistic = (fixedObservedMean - nullMean) / standardError;
    const df = fixedSampleSize - 1;
    const pValue = 2 * (1 - tDistributionCDF(Math.abs(tStatistic), df));

    return {
      sampleMean: fixedObservedMean,
      sampleSD: fixedSampleSD,
      standardError,
      tStatistic,
      df,
      pValue: Math.min(1, Math.max(0, pValue)),
    };
  }, []);

  // Interactive statistics for Step 4
  const interactiveStats = useMemo(() => {
    const standardError = interactiveSD / Math.sqrt(interactiveN);
    const tStatistic = (interactiveMean - nullMean) / standardError;
    const df = interactiveN - 1;
    const pValue = 2 * (1 - tDistributionCDF(Math.abs(tStatistic), df));

    return {
      standardError,
      tStatistic,
      df,
      pValue: Math.min(1, Math.max(0, pValue)),
    };
  }, [interactiveMean, interactiveN, interactiveSD]);

  // Visualization dimensions
  const width = 700;
  const height = 280;
  const margin = { top: 40, right: 30, bottom: 60, left: 50 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // t-distribution visualization for Step 3 (fixed)
  const tMin = -5;
  const tMax = 5;
  const tScale = (t: number) => ((t - tMin) / (tMax - tMin)) * plotWidth;

  const fixedTCurve = useMemo(() => {
    const points: { t: number; pdf: number }[] = [];
    for (let t = tMin; t <= tMax; t += 0.05) {
      points.push({ t, pdf: tDistributionPDF(t, fixedStats.df) });
    }
    return points;
  }, [fixedStats.df]);

  const fixedMaxPDF = Math.max(...fixedTCurve.map((p) => p.pdf));
  const fixedYScale = (pdf: number) => plotHeight - (pdf / fixedMaxPDF) * plotHeight * 0.9;

  // Critical t-value for alpha = 0.05, two-tailed (approximate)
  const criticalT = 2.0;

  // Path helpers for Step 3 visualization
  const createCurvePath = (curve: { t: number; pdf: number }[], yScaleFn: (pdf: number) => number) =>
    curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${tScale(p.t)} ${yScaleFn(p.pdf)}`).join(' ');

  const createTailPath = (curve: { t: number; pdf: number }[], threshold: number, side: 'left' | 'right', yScaleFn: (pdf: number) => number) => {
    const filtered = curve.filter((p) => side === 'left' ? p.t <= threshold : p.t >= threshold);
    return filtered.map((p, i) => `${i === 0 ? 'M' : 'L'} ${tScale(p.t)} ${yScaleFn(p.pdf)}`).join(' ');
  };

  const fixedCurvePath = createCurvePath(fixedTCurve, fixedYScale);
  const fixedLeftTail = createTailPath(fixedTCurve, -criticalT, 'left', fixedYScale);
  const fixedRightTail = createTailPath(fixedTCurve, criticalT, 'right', fixedYScale);

  const isFixedSignificant = fixedStats.pValue < 0.05;
  const isInteractiveSignificant = interactiveStats.pValue < 0.05;

  // Helper component for mean difference visualization (Step 4)
  const MeanDifferenceViz = ({
    meanDiff,
    standardError,
    tStatistic,
    df,
    isSignificant,
  }: {
    meanDiff: number;
    standardError: number;
    tStatistic: number;
    df: number;
    isSignificant: boolean;
  }) => {
    // X-axis range: mean difference values
    // We want to show a range that makes sense for the current SE
    // Critical values in mean difference units: ±criticalT * SE
    const criticalDiff = criticalT * standardError;

    // Set x-axis range to show ±4 SE worth of mean differences, but at least ±20
    const xRange = Math.max(4 * standardError, 20);
    const diffMin = -xRange;
    const diffMax = xRange;

    const diffScale = (diff: number) => ((diff - diffMin) / (diffMax - diffMin)) * plotWidth;

    // Generate the sampling distribution curve (scaled t-distribution)
    // The PDF in terms of mean difference: f(d) = f_t(d/SE) / SE
    const diffCurve = useMemo(() => {
      const points: { diff: number; pdf: number }[] = [];
      const step = (diffMax - diffMin) / 200;
      for (let d = diffMin; d <= diffMax; d += step) {
        const tVal = d / standardError;
        // Scale the PDF by 1/SE to convert from t to mean difference scale
        const pdfVal = tDistributionPDF(tVal, df) / standardError;
        points.push({ diff: d, pdf: pdfVal });
      }
      return points;
    }, [standardError, df, diffMin, diffMax]);

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
    const clampedDiff = Math.max(diffMin, Math.min(diffMax, meanDiff));
    const markerX = diffScale(clampedDiff);

    // Position the label above the marker, offset to avoid overlap
    const labelY = -15;

    // Generate nice x-axis ticks
    const tickStep = Math.ceil(xRange / 4 / 5) * 5; // Round to nearest 5
    const ticks: number[] = [];
    for (let t = -Math.floor(xRange / tickStep) * tickStep; t <= xRange; t += tickStep) {
      if (t >= diffMin && t <= diffMax) {
        ticks.push(t);
      }
    }
    // Always include 0
    if (!ticks.includes(0)) {
      ticks.push(0);
      ticks.sort((a, b) => a - b);
    }

    return (
      <div className="viz-container">
        <h4>Sampling Distribution of Mean Differences (df = {df})</h4>
        <svg width={width} height={height + 20} viewBox={`0 0 ${width} ${height + 20}`}>
          <g transform={`translate(${margin.left}, ${margin.top + 20})`}>
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
              t = {tStatistic.toFixed(2)}, df = {df}
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
              Mean Difference (X̄ - μ₀)
            </text>

            {/* Rejection region labels */}
            <text
              x={diffScale(diffMin + (criticalDiff - diffMin) / 2 - criticalDiff)}
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
          Your observed difference of {meanDiff > 0 ? '+' : ''}{meanDiff.toFixed(1)} {isSignificant ? 'falls in the rejection region' : 'is within the acceptance region'}.
        </p>
      </div>
    );
  };

  // Helper component for t-distribution visualization
  const TDistributionViz = ({
    curvePath,
    leftTail,
    rightTail,
    tStatistic,
    df,
    isSignificant,
  }: {
    curvePath: string;
    leftTail: string;
    rightTail: string;
    tStatistic: number;
    df: number;
    isSignificant: boolean;
  }) => (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Rejection regions (shaded) */}
        {leftTail && (
          <path
            d={`${leftTail} L ${tScale(-criticalT)} ${plotHeight} L ${tScale(tMin)} ${plotHeight} Z`}
            fill="var(--accent)"
            opacity={0.3}
          />
        )}
        {rightTail && (
          <path
            d={`${rightTail} L ${tScale(tMax)} ${plotHeight} L ${tScale(criticalT)} ${plotHeight} Z`}
            fill="var(--accent)"
            opacity={0.3}
          />
        )}

        {/* t-distribution curve */}
        <path d={curvePath} fill="none" stroke="var(--primary)" strokeWidth={2} />

        {/* Critical value lines */}
        <line
          x1={tScale(-criticalT)}
          y1={0}
          x2={tScale(-criticalT)}
          y2={plotHeight}
          stroke="var(--accent)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <line
          x1={tScale(criticalT)}
          y1={0}
          x2={tScale(criticalT)}
          y2={plotHeight}
          stroke="var(--accent)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Observed t-statistic */}
        <line
          x1={tScale(Math.max(tMin, Math.min(tMax, tStatistic)))}
          y1={0}
          x2={tScale(Math.max(tMin, Math.min(tMax, tStatistic)))}
          y2={plotHeight}
          stroke={isSignificant ? 'var(--accent)' : 'var(--primary)'}
          strokeWidth={3}
        />
        <circle
          cx={tScale(Math.max(tMin, Math.min(tMax, tStatistic)))}
          cy={20}
          r={6}
          fill={isSignificant ? 'var(--accent)' : 'var(--primary)'}
        />
        <text
          x={tScale(Math.max(tMin, Math.min(tMax, tStatistic)))}
          y={-5}
          textAnchor="middle"
          fontSize={11}
          fill={isSignificant ? 'var(--accent)' : 'var(--primary)'}
          fontWeight={600}
        >
          t = {tStatistic.toFixed(2)}
        </text>

        {/* X-axis */}
        <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="var(--border)" />
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((t) => (
          <g key={t}>
            <line
              x1={tScale(t)}
              y1={plotHeight}
              x2={tScale(t)}
              y2={plotHeight + 5}
              stroke="var(--border)"
            />
            <text
              x={tScale(t)}
              y={plotHeight + 18}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-secondary)"
            >
              {t}
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
          t-statistic (df = {df})
        </text>

        {/* Labels */}
        <text
          x={tScale(-3.5)}
          y={plotHeight - 20}
          textAnchor="middle"
          fontSize={10}
          fill="var(--accent)"
        >
          Rejection region
        </text>
        <text
          x={tScale(3.5)}
          y={plotHeight - 20}
          textAnchor="middle"
          fontSize={10}
          fill="var(--accent)"
        >
          Rejection region
        </text>
      </g>
    </svg>
  );

  return (
    <div className="section-intro">
      <h2>The One-Sample t-Test</h2>

      <p className="intro-text">
        The <strong>one-sample t-test</strong> asks whether a sample mean differs significantly
        from a hypothesized population value. Let's work through a concrete example.
      </p>

      <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', margin: 'var(--spacing-lg) 0', border: '1px solid var(--border)' }}>
        <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>The Scenario</h4>
        <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          A company claims their standardized test has a mean score of <strong>μ = {nullMean}</strong>.
          You are skeptical and decide to administer this test to {fixedSampleSize} students. You observe
          a sample mean of <strong>X̄ = {fixedObservedMean}</strong> with a sample standard deviation
          of <strong>s = {fixedSampleSD}</strong>. Is this evidence against the company's claim?
        </p>
      </div>

      <h3>Step 1: State the Hypotheses</h3>
      <p className="intro-text">
        We begin by formalizing what we're testing. The <strong>null hypothesis</strong> (H₀)
        represents the claim we're testing against — in this case, the company's claim.
        The <strong>alternative hypothesis</strong> (H₁) represents what we suspect might be true.
      </p>
      <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-md)', margin: 'var(--spacing-md) 0' }}>
        <p style={{ margin: 0 }}>
          <strong>H₀ (Null):</strong> μ = {nullMean} (The population mean equals the claimed value)<br />
          <strong>H₁ (Alternative):</strong> μ ≠ {nullMean} (The population mean differs from the claimed value)
        </p>
      </div>

      <h3>Step 2: Establishing the Null Hypothesis Distribution</h3>
      <p className="intro-text">
        To test our hypothesis, we need to know what sample means we <em>should</em> observe
        if the null hypothesis is true. From the previous module, we know that sample means
        follow a <strong>sampling distribution</strong> centered on the population mean.
      </p>

      <p className="intro-text">
        If H₀ is true (μ = {nullMean}), then sample means from samples of n = {fixedSampleSize}
        should be distributed around {nullMean}. The <strong>standard error</strong> tells us
        how much these sample means typically vary:
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">SE = σ / √n</span>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)' }}>
          Standard Error = Population SD / √(sample size)
        </p>
      </div>

      <div className="key-insight">
        <h4>The Problem: We Don't Know σ</h4>
        <p>
          There's a catch: the formula requires the <strong>population standard deviation (σ)</strong>,
          but we rarely know this. In the real world, we only have our sample, so we must
          <strong> estimate</strong> the population SD using the sample standard deviation (s).
        </p>
        <p style={{ marginTop: 'var(--spacing-sm)' }}>
          In our example, we observed s = {fixedSampleSD}, so our estimated standard error is:
        </p>
        <p style={{ textAlign: 'center', fontWeight: 600, marginTop: 'var(--spacing-sm)' }}>
          SE = s / √n = {fixedSampleSD} / √{fixedSampleSize} = {fixedStats.standardError.toFixed(2)}
        </p>
      </div>

      <p className="intro-text">
        This estimation introduces <strong>additional uncertainty</strong>. Because we're using
        an estimate rather than the true value, our test statistic won't follow a normal
        distribution — it will follow a <strong>t-distribution</strong> instead.
      </p>

      <h3>Step 3: Compare the Observed Mean to the Null Distribution</h3>
      <p className="intro-text">
        Now we can ask: "How extreme is our observed mean of {fixedObservedMean} under the null?"
        We measure this using the <strong>t-statistic</strong>, which tells us how many standard
        errors our sample mean is from the hypothesized value:
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">t = (X̄ - μ₀) / SE</span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">X̄</span>
            <span className="explanation">
              Sample mean = <strong>{fixedStats.sampleMean}</strong>
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">μ₀</span>
            <span className="explanation">
              Hypothesized mean under H₀ = <strong>{nullMean}</strong>
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SE</span>
            <span className="explanation">
              Standard Error = s/√n = <strong>{fixedStats.standardError.toFixed(2)}</strong>
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)', fontSize: '1.125rem' }}>
          t = ({fixedStats.sampleMean} - {nullMean}) / {fixedStats.standardError.toFixed(2)} = <strong style={{ color: 'var(--primary)' }}>{fixedStats.tStatistic.toFixed(3)}</strong>
        </div>
      </div>

      <div className="key-insight">
        <h4>Why the t-Distribution?</h4>
        <p>
          Because we estimated σ from the sample, our t-statistic follows a <strong>t-distribution</strong> rather
          than a normal distribution. The t-distribution has <strong>heavier tails</strong>, reflecting the extra
          uncertainty from estimating σ. The shape depends on the <strong>degrees of freedom (df = n − 1 = {fixedStats.df})</strong>.
        </p>
        <p style={{ marginTop: 'var(--spacing-sm)' }}>
          With small samples, the t-distribution has very heavy tails, meaning we need more extreme
          t-values to achieve statistical significance. As sample size increases, df increases
          and the t-distribution approaches the normal distribution.
        </p>
      </div>

      <div className="viz-container">
        <h4>Where Does Our t-Statistic Fall?</h4>
        <TDistributionViz
          curvePath={fixedCurvePath}
          leftTail={fixedLeftTail}
          rightTail={fixedRightTail}
          tStatistic={fixedStats.tStatistic}
          df={fixedStats.df}
          isSignificant={isFixedSignificant}
        />
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)' }}>
          The shaded areas show the rejection regions for α = 0.05 (two-tailed).
          Our t-statistic of {fixedStats.tStatistic.toFixed(2)} {isFixedSignificant ? 'falls in the rejection region' : 'falls within the acceptance region'}.
        </p>
      </div>

      <div className="results-row">
        <div className="result-card">
          <div className="result-label">t-statistic</div>
          <div className="result-value">{fixedStats.tStatistic.toFixed(3)}</div>
        </div>
        <div className="result-card">
          <div className="result-label">Degrees of Freedom</div>
          <div className="result-value">{fixedStats.df}</div>
        </div>
        <div className="result-card">
          <div className="result-label">p-value</div>
          <div className={`result-value ${isFixedSignificant ? 'significant' : 'not-significant'}`}>
            {fixedStats.pValue < 0.001 ? '< .001' : fixedStats.pValue.toFixed(3)}
          </div>
        </div>
      </div>

      <div className={`decision-indicator ${isFixedSignificant ? 'reject' : 'fail-to-reject'}`}>
        {isFixedSignificant
          ? `Reject H₀: The sample mean (${fixedStats.sampleMean}) is significantly different from ${nullMean} (p < .05)`
          : `Fail to reject H₀: The sample mean (${fixedStats.sampleMean}) is not significantly different from ${nullMean} (p ≥ .05)`}
      </div>

      <h3>Step 4: Explore What Affects the t-Statistic</h3>
      <p className="intro-text">
        The t-statistic depends on three factors: how far the sample mean is from the null value,
        the sample size, and the variability in the data. Use the sliders below to explore how
        each factor affects the t-statistic and p-value.
      </p>

      <p className="intro-text">
        The visualization below shows the <strong>sampling distribution of mean differences</strong> under
        the null hypothesis. The x-axis shows the observed mean difference (X̄ - μ₀), and the shape of
        the distribution depends on your sample size and variability.
      </p>

      <div className="controls-row">
        <div className="control-group">
          <label>Sample Mean (X̄)</label>
          <input
            type="range"
            min={85}
            max={115}
            step={0.5}
            value={interactiveMean}
            onChange={(e) => setInteractiveMean(Number(e.target.value))}
          />
          <span className="control-value">{interactiveMean}</span>
        </div>
        <div className="control-group">
          <label>Sample Size (n)</label>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={interactiveN}
            onChange={(e) => setInteractiveN(Number(e.target.value))}
          />
          <span className="control-value">{interactiveN}</span>
        </div>
        <div className="control-group">
          <label>Sample SD (s)</label>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={interactiveSD}
            onChange={(e) => setInteractiveSD(Number(e.target.value))}
          />
          <span className="control-value">{interactiveSD}</span>
        </div>
      </div>

      <MeanDifferenceViz
        meanDiff={interactiveMean - nullMean}
        standardError={interactiveStats.standardError}
        tStatistic={interactiveStats.tStatistic}
        df={interactiveStats.df}
        isSignificant={isInteractiveSignificant}
      />

      <div className="results-row">
        <div className="result-card">
          <div className="result-label">Standard Error</div>
          <div className="result-value">{interactiveStats.standardError.toFixed(2)}</div>
        </div>
        <div className="result-card">
          <div className="result-label">t-statistic</div>
          <div className="result-value">{interactiveStats.tStatistic.toFixed(3)}</div>
        </div>
        <div className="result-card">
          <div className="result-label">p-value</div>
          <div className={`result-value ${isInteractiveSignificant ? 'significant' : 'not-significant'}`}>
            {interactiveStats.pValue < 0.001 ? '< .001' : interactiveStats.pValue.toFixed(3)}
          </div>
        </div>
      </div>

      <div className={`decision-indicator ${isInteractiveSignificant ? 'reject' : 'fail-to-reject'}`}>
        {isInteractiveSignificant
          ? `Reject H₀: p = ${interactiveStats.pValue < 0.001 ? '< .001' : interactiveStats.pValue.toFixed(3)} < .05`
          : `Fail to reject H₀: p = ${interactiveStats.pValue.toFixed(3)} ≥ .05`}
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-lg)', border: '1px solid var(--border)' }}>
        <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>What to Notice</h4>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <li><strong>Sample mean further from {nullMean}:</strong> The marker moves further from center → larger |t|</li>
          <li><strong>Larger sample size:</strong> The distribution becomes narrower (smaller SE) → same difference yields larger |t|</li>
          <li><strong>Higher variability (SD):</strong> The distribution becomes wider (larger SE) → same difference yields smaller |t|</li>
        </ul>
      </div>
    </div>
  );
}
