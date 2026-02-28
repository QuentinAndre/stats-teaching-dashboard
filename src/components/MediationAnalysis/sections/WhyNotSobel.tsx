import { useState, useMemo } from 'react';
import {
  simulateProductDistribution,
  sobelTest,
  createHistogramBins,
  normalPDF,
} from '../../../utils/statistics';

// SVG dimensions
const SVG_WIDTH = 700;
const SVG_HEIGHT = 350;
const MARGIN = { top: 30, right: 30, bottom: 50, left: 60 };
const PLOT_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

// Fixed standard errors (reasonable for n ≈ 120)
const SE_A = 0.20;
const SE_B = 0.15;

const NUM_BINS = 60;
const NUM_SIM = 5000;
const SEED = 42;

/** Map a data-space x value to pixel x. */
function xScale(val: number, xMin: number, xMax: number): number {
  return MARGIN.left + ((val - xMin) / (xMax - xMin)) * PLOT_WIDTH;
}

/** Map a data-space y value (density) to pixel y. */
function yScale(val: number, yMax: number): number {
  return MARGIN.top + PLOT_HEIGHT - (val / yMax) * PLOT_HEIGHT;
}

function formatP(p: number): string {
  if (p < 0.001) return '< .001';
  return p.toFixed(3);
}

export default function WhyNotSobel() {
  const [aPop, setAPop] = useState(0.80);
  const [bPop, setBPop] = useState(0.55);

  // Simulate the product distribution: draw â ~ N(a, SE_a), b̂ ~ N(b, SE_b), record â × b̂
  const simValues = useMemo(
    () => simulateProductDistribution(aPop, bPop, SE_A, SE_B, NUM_SIM, SEED),
    [aPop, bPop]
  );

  // Sobel test result using population values as the "estimates"
  const sobel = useMemo(
    () => sobelTest(aPop, bPop, SE_A, SE_B),
    [aPop, bPop]
  );

  // Statistics of the simulated distribution
  const simStats = useMemo(() => {
    const n = simValues.length;
    const sum = simValues.reduce((s, v) => s + v, 0);
    const mn = sum / n;
    const variance = simValues.reduce((s, v) => s + (v - mn) ** 2, 0) / n;
    const sd = Math.sqrt(variance);
    const skewness =
      sd > 0
        ? simValues.reduce((s, v) => s + ((v - mn) / sd) ** 3, 0) / n
        : 0;
    const pctBelow0 = (simValues.filter((v) => v < 0).length / n) * 100;
    return { mean: mn, sd, skewness, pctBelow0 };
  }, [simValues]);

  // Histogram bins
  const bins = useMemo(() => {
    const minVal = Math.min(...simValues);
    const maxVal = Math.max(...simValues);
    const pad = (maxVal - minVal) * 0.05;
    return createHistogramBins(simValues, NUM_BINS, minVal - pad, maxVal + pad);
  }, [simValues]);

  // Data ranges for scaling
  const xMin = bins.length > 0 ? bins[0].x0 : -0.5;
  const xMax = bins.length > 0 ? bins[bins.length - 1].x1 : 1.5;
  const binWidth = bins.length > 0 ? bins[0].x1 - bins[0].x0 : 1;

  // Convert counts to density for proper overlay with the normal curve
  const maxDensity = useMemo(() => {
    let maxD = 0;
    for (const bin of bins) {
      const density = bin.count / (NUM_SIM * binWidth);
      if (density > maxD) maxD = density;
    }
    // Also check the peak of the normal curve
    const normalPeak = normalPDF(sobel.ab, sobel.ab, sobel.se);
    if (normalPeak > maxD) maxD = normalPeak;
    return maxD * 1.1; // 10% headroom
  }, [bins, binWidth, sobel]);

  // Normal curve path (Sobel assumption)
  const normalPath = useMemo(() => {
    if (sobel.se <= 0) return '';
    const steps = 200;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const xVal = xMin + (i / steps) * (xMax - xMin);
      const density = normalPDF(xVal, sobel.ab, sobel.se);
      const px = xScale(xVal, xMin, xMax);
      const py = yScale(density, maxDensity);
      points.push(`${px},${py}`);
    }
    return `M${points.join(' L')}`;
  }, [xMin, xMax, sobel, maxDensity]);

  // X-axis ticks
  const xTicks = useMemo(() => {
    const range = xMax - xMin;
    const step = range > 2 ? 0.5 : range > 1 ? 0.2 : 0.1;
    const ticks: number[] = [];
    const start = Math.ceil(xMin / step) * step;
    for (let v = start; v <= xMax; v += step) {
      ticks.push(Math.round(v * 100) / 100);
    }
    return ticks;
  }, [xMin, xMax]);

  // Y-axis ticks (density)
  const yTicks = useMemo(() => {
    const step = maxDensity > 4 ? 1 : maxDensity > 2 ? 0.5 : maxDensity > 1 ? 0.25 : 0.5;
    const ticks: number[] = [];
    for (let v = 0; v <= maxDensity; v += step) {
      ticks.push(Math.round(v * 100) / 100);
    }
    return ticks;
  }, [maxDensity]);

  return (
    <div className="section-intro">
      <h2>Null-Hypothesis Testing in Mediation Models</h2>

      <p className="intro-text">
        In the early days of mediation analysis, the standard approach to testing
        whether the indirect effect <em>ab</em> differed from zero was
        the <strong>Sobel test</strong>. The Sobel test computes a standard error for
        the product <em>ab</em> using the first-order delta method:
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">
            SE<sub><em>ab</em></sub> = &radic;(<em>a</em>&sup2; &middot; SE<sub><em>b</em></sub>&sup2; + <em>b</em>&sup2; &middot; SE<sub><em>a</em></sub>&sup2;)
          </span>
        </div>
      </div>

      <p className="intro-text">
        The indirect effect is then divided by this standard error to produce
        a <em>Z</em>-statistic, which is compared against the standard normal
        distribution. The critical assumption is that the product of two regression
        coefficients follows a normal distribution — but this assumption fails
        when either <em>a</em> or <em>b</em> is small relative to its standard error,
        because the product distribution becomes skewed.
      </p>

      <p className="intro-text">
        The simulation below demonstrates this problem. It draws 5,000 samples
        of <em>a&#770;</em> and <em>b&#770;</em> from their sampling distributions
        (both normal), multiplies them to get 5,000 values
        of <em>a&#770;</em> &times; <em>b&#770;</em>, and plots the resulting
        histogram. The dashed red curve is the normal distribution the Sobel test
        assumes. Use the sliders to see how the fit changes.
      </p>

      {/* Sliders */}
      <div className="controls-row">
        <div className="control-group">
          <label>Population <em>a</em> path</label>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={aPop}
            onChange={(e) => setAPop(parseFloat(e.target.value))}
          />
          <span className="control-value">{aPop.toFixed(2)}</span>
        </div>
        <div className="control-group">
          <label>Population <em>b</em> path</label>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={bPop}
            onChange={(e) => setBPop(parseFloat(e.target.value))}
          />
          <span className="control-value">{bPop.toFixed(2)}</span>
        </div>
      </div>

      <p className="intro-text" style={{ textAlign: 'center', fontSize: '0.8125rem', marginTop: 0 }}>
        SE<sub><em>a</em></sub> = {SE_A.toFixed(2)}, SE<sub><em>b</em></sub> = {SE_B.toFixed(2)} (fixed, as if <em>n</em> &asymp; 120)
      </p>

      {/* SVG visualization */}
      <div className="viz-container">
        <h4>Sampling Distribution of the Indirect Effect (<em>a</em> &times; <em>b</em>)</h4>

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: '100%', maxWidth: SVG_WIDTH }}
        >
          {/* Gridlines */}
          {yTicks.map((tick) => (
            <line
              key={`grid-y-${tick}`}
              x1={MARGIN.left}
              x2={SVG_WIDTH - MARGIN.right}
              y1={yScale(tick, maxDensity)}
              y2={yScale(tick, maxDensity)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          ))}

          {/* Histogram bars */}
          {bins.map((bin, i) => {
            const density = bin.count / (NUM_SIM * binWidth);
            if (density === 0) return null;
            const barX = xScale(bin.x0, xMin, xMax);
            const barW = xScale(bin.x1, xMin, xMax) - barX;
            const barY = yScale(density, maxDensity);
            const barH = yScale(0, maxDensity) - barY;
            return (
              <rect
                key={`bar-${i}`}
                x={barX}
                y={barY}
                width={Math.max(0, barW - 0.5)}
                height={Math.max(0, barH)}
                fill="var(--primary)"
                opacity={0.5}
              />
            );
          })}

          {/* Normal curve overlay (Sobel assumption) */}
          {normalPath && (
            <path
              d={normalPath}
              fill="none"
              stroke="#e63946"
              strokeWidth={2}
              strokeDasharray="6,4"
              opacity={0.9}
            />
          )}

          {/* Zero line */}
          {xMin < 0 && xMax > 0 && (
            <line
              x1={xScale(0, xMin, xMax)}
              x2={xScale(0, xMin, xMax)}
              y1={MARGIN.top}
              y2={MARGIN.top + PLOT_HEIGHT}
              stroke="#9ca3af"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
          )}

          {/* X axis */}
          <line
            x1={MARGIN.left}
            x2={SVG_WIDTH - MARGIN.right}
            y1={MARGIN.top + PLOT_HEIGHT}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="#9ca3af"
            strokeWidth={1}
          />
          {xTicks.map((tick) => (
            <g key={`xtick-${tick}`}>
              <line
                x1={xScale(tick, xMin, xMax)}
                x2={xScale(tick, xMin, xMax)}
                y1={MARGIN.top + PLOT_HEIGHT}
                y2={MARGIN.top + PLOT_HEIGHT + 6}
                stroke="#9ca3af"
                strokeWidth={1}
              />
              <text
                x={xScale(tick, xMin, xMax)}
                y={MARGIN.top + PLOT_HEIGHT + 20}
                textAnchor="middle"
                fontSize={12}
                fill="#6b7280"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          ))}
          <text
            x={MARGIN.left + PLOT_WIDTH / 2}
            y={SVG_HEIGHT - 6}
            textAnchor="middle"
            fontSize={13}
            fill="#374151"
            fontWeight={500}
          >
            Indirect effect (a &times; b)
          </text>

          {/* Y axis */}
          <line
            x1={MARGIN.left}
            x2={MARGIN.left}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="#9ca3af"
            strokeWidth={1}
          />
          {yTicks.map((tick) => (
            <g key={`ytick-${tick}`}>
              <line
                x1={MARGIN.left - 6}
                x2={MARGIN.left}
                y1={yScale(tick, maxDensity)}
                y2={yScale(tick, maxDensity)}
                stroke="#9ca3af"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 10}
                y={yScale(tick, maxDensity)}
                dy="0.35em"
                textAnchor="end"
                fontSize={12}
                fill="#6b7280"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          ))}
          <text
            x={14}
            y={MARGIN.top + PLOT_HEIGHT / 2}
            textAnchor="middle"
            fontSize={13}
            fill="#374151"
            fontWeight={500}
            transform={`rotate(-90, 14, ${MARGIN.top + PLOT_HEIGHT / 2})`}
          >
            Density
          </text>

          {/* Legend */}
          <g transform={`translate(${SVG_WIDTH - MARGIN.right - 195}, ${MARGIN.top + 8})`}>
            <rect x={0} y={-6} width={12} height={12} fill="var(--primary)" opacity={0.5} />
            <text x={18} y={0} dy="0.35em" fontSize={11} fill="#374151">
              Simulated product
            </text>
            <line x1={0} x2={18} y1={18} y2={18} stroke="#e63946" strokeWidth={2} strokeDasharray="6,4" />
            <text x={24} y={18} dy="0.35em" fontSize={11} fill="#374151">
              Normal (Sobel)
            </text>
          </g>
        </svg>
      </div>

      {/* Result cards */}
      <div className="results-row">
        <div className="result-card">
          <h5>Sobel <em>Z</em></h5>
          <div className="result-value">{sobel.z.toFixed(2)}</div>
        </div>
        <div className="result-card">
          <h5>Sobel <em>p</em></h5>
          <div className="result-value">{formatP(sobel.p)}</div>
        </div>
        <div className="result-card">
          <h5>Skewness</h5>
          <div className="result-value">{simStats.skewness.toFixed(2)}</div>
        </div>
        <div className="result-card">
          <h5>% Below 0</h5>
          <div className="result-value">{simStats.pctBelow0.toFixed(1)}%</div>
        </div>
      </div>

      {/* Key insight */}
      <div className="key-insight">
        <h4>When Does the Normal Approximation Fail?</h4>
        <p>
          When both <em>a</em> and <em>b</em> are large relative to their standard
          errors, the normal approximation is acceptable — the histogram and the dashed
          curve overlap well. But these are precisely the cases where significance is
          already obvious. When the indirect effect is modest (try setting <em>a</em> or{' '}
          <em>b</em> near zero), the distribution becomes noticeably skewed, and the
          Sobel test can be misleading: it may overestimate or underestimate the{' '}
          <em>p</em>-value depending on the direction of the skew. The bootstrap
          approach avoids distributional assumptions entirely.
        </p>
      </div>
    </div>
  );
}
