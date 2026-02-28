import { useState, useMemo, useRef, useCallback } from 'react';
import {
  generateMediationData,
  fitSimpleRegression,
  fitMultipleRegression2,
  bootstrapIndirectEffectBatch,
  percentileCI,
  createHistogramBins,
} from '../../../utils/statistics';

// SVG dimensions
const SVG_WIDTH = 700;
const SVG_HEIGHT = 380;
const MARGIN = { top: 30, right: 30, bottom: 50, left: 60 };
const PLOT_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

const NUM_BINS = 60;
const BATCH_SIZE = 50;

// Fixed histogram range so the axes stay stable as samples accumulate
const HIST_MIN = -0.2;
const HIST_MAX = 1.2;

/** Map data x to pixel x. */
function xScale(val: number): number {
  return MARGIN.left + ((val - HIST_MIN) / (HIST_MAX - HIST_MIN)) * PLOT_WIDTH;
}

/** Map density y to pixel y. */
function yScale(val: number, yMax: number): number {
  return MARGIN.top + PLOT_HEIGHT - (val / yMax) * PLOT_HEIGHT;
}

export default function BootstrapIndirectEffect() {
  // Generate the original dataset (deterministic via seed)
  const data = useMemo(
    () => generateMediationData(77, 120, 0.80, 0.55, 0.25, 3.80, 1.41, 1.0, 0.9),
    []
  );

  // Compute the observed indirect effect from the sample
  const originalAB = useMemo(() => {
    const regM = fitSimpleRegression(data.m, data.x);
    const regY = fitMultipleRegression2(data.y, data.x, data.m);
    return regM.slope * regY.b2;
  }, [data]);

  // Bootstrap state
  const [bootstrapValues, setBootstrapValues] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [target, setTarget] = useState(0);

  // Refs for animation loop
  const animFrameRef = useRef<number>(0);
  const seedCounterRef = useRef(0);

  // Stop any running animation
  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    setIsRunning(false);
  }, []);

  // Run a single bootstrap sample
  const runOne = useCallback(() => {
    stopAnimation();
    const seed = 1000 + seedCounterRef.current * 1000;
    seedCounterRef.current += 1;
    const batch = bootstrapIndirectEffectBatch(data.x, data.m, data.y, 1, seed);
    setBootstrapValues((prev) => [...prev, ...batch]);
    setTarget((prev) => Math.max(prev, bootstrapValues.length + 1));
  }, [data, stopAnimation, bootstrapValues.length]);

  // Start an animated bootstrap run
  const startAnimatedRun = useCallback(
    (count: number) => {
      stopAnimation();
      const newTarget = bootstrapValues.length + count;
      setTarget(newTarget);
      setIsRunning(true);

      const animate = () => {
        setBootstrapValues((prev) => {
          if (prev.length >= newTarget) {
            setIsRunning(false);
            return prev;
          }
          const remaining = newTarget - prev.length;
          const batchCount = Math.min(BATCH_SIZE, remaining);
          const seed = 1000 + seedCounterRef.current * 1000;
          seedCounterRef.current += 1;
          const batch = bootstrapIndirectEffectBatch(
            data.x,
            data.m,
            data.y,
            batchCount,
            seed
          );
          return [...prev, ...batch];
        });

        // Schedule next frame — we check inside the state updater whether
        // we've reached the target, but we also need to keep the loop going
        // from outside. We use a ref check in the next frame.
        animFrameRef.current = requestAnimationFrame(() => {
          // Read current length via a transient state check
          setBootstrapValues((prev) => {
            if (prev.length >= newTarget) {
              setIsRunning(false);
              animFrameRef.current = 0;
            } else {
              animFrameRef.current = requestAnimationFrame(animate);
            }
            return prev; // no mutation
          });
        });
      };

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [data, bootstrapValues.length, stopAnimation]
  );

  // Reset
  const reset = useCallback(() => {
    stopAnimation();
    setBootstrapValues([]);
    setTarget(0);
    seedCounterRef.current = 0;
  }, [stopAnimation]);

  // Histogram bins (recomputed whenever bootstrapValues changes)
  const bins = useMemo(() => {
    if (bootstrapValues.length === 0) return [];
    return createHistogramBins(bootstrapValues, NUM_BINS, HIST_MIN, HIST_MAX);
  }, [bootstrapValues]);

  const binWidth = (HIST_MAX - HIST_MIN) / NUM_BINS;

  // Density scaling
  const maxDensity = useMemo(() => {
    if (bins.length === 0) return 1;
    let maxD = 0;
    for (const bin of bins) {
      const density = bin.count / (bootstrapValues.length * binWidth);
      if (density > maxD) maxD = density;
    }
    return maxD * 1.1;
  }, [bins, bootstrapValues.length, binWidth]);

  // Confidence interval (only when >= 100 samples)
  const ci = useMemo(() => {
    if (bootstrapValues.length < 100) return null;
    const [lower, upper] = percentileCI(bootstrapValues);
    return { lower, upper };
  }, [bootstrapValues]);

  // Bootstrap SE
  const bootstrapSE = useMemo(() => {
    if (bootstrapValues.length < 2) return 0;
    const mn =
      bootstrapValues.reduce((s, v) => s + v, 0) / bootstrapValues.length;
    const variance =
      bootstrapValues.reduce((s, v) => s + (v - mn) ** 2, 0) /
      (bootstrapValues.length - 1);
    return Math.sqrt(variance);
  }, [bootstrapValues]);

  // X-axis ticks
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = HIST_MIN; v <= HIST_MAX; v += 0.2) {
      ticks.push(Math.round(v * 10) / 10);
    }
    return ticks;
  }, []);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const step =
      maxDensity > 4 ? 1 : maxDensity > 2 ? 0.5 : maxDensity > 1 ? 0.25 : 0.5;
    const ticks: number[] = [];
    for (let v = 0; v <= maxDensity; v += step) {
      ticks.push(Math.round(v * 100) / 100);
    }
    return ticks;
  }, [maxDensity]);

  // Effective display target (for progress bar)
  const displayTarget = Math.max(target, bootstrapValues.length);

  return (
    <div className="section-intro">
      <h2>Using Bootstrapping in Mediation Models</h2>

      <p className="intro-text">
        Bootstrapping is a general-purpose resampling technique that can be used
        to estimate the sampling distribution of virtually any statistic — a mean,
        a correlation, a regression coefficient, or, as in this case, the indirect
        effect in a mediation model. The core idea is simple: treat the observed
        sample as a stand-in for the population, and repeatedly resample from it
        with replacement to build up a picture of how the statistic would vary
        across samples.
      </p>

      <p className="intro-text">
        In each bootstrap iteration, we draw <em>N</em> observations with
        replacement from the original data, refit both regressions (M on X, and Y
        on X and M), and compute a new indirect effect{' '}
        <em>a&#770;</em> &times; <em>b&#770;</em>. The distribution of these
        bootstrap estimates approximates the sampling distribution
        of <em>ab</em> without assuming any particular shape — which, as the previous
        section showed, matters because the product of two coefficients is not
        normally distributed in general.
      </p>

      <p className="intro-text">
        The 95% percentile confidence interval is read directly from the sorted
        bootstrap distribution: the values at the 2.5th and 97.5th percentiles. If
        this interval excludes zero, the indirect effect is significant at{' '}
        <em>&alpha;</em> = .05.
      </p>

      {/* Buttons */}
      <div className="controls-row">
        <button
          className="generate-button"
          onClick={runOne}
          disabled={isRunning}
        >
          Run 1 Bootstrap
        </button>
        <button
          className="generate-button"
          onClick={() => startAnimatedRun(1000)}
          disabled={isRunning}
        >
          Run 1,000 Bootstraps
        </button>
        <button
          className="generate-button"
          onClick={() => startAnimatedRun(5000)}
          disabled={isRunning}
        >
          Run 5,000 Bootstraps
        </button>
        <button
          className="generate-button secondary"
          onClick={reset}
          disabled={isRunning}
        >
          Reset
        </button>
      </div>

      {/* Progress */}
      {displayTarget > 0 && (
        <div className="bootstrap-progress">
          <span>
            Bootstrap samples: {bootstrapValues.length.toLocaleString()} /{' '}
            {displayTarget.toLocaleString()}
          </span>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(
                  100,
                  (bootstrapValues.length / displayTarget) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* SVG histogram */}
      <div className="viz-container">
        <h4>Bootstrap Distribution of the Indirect Effect</h4>

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

          {bootstrapValues.length > 0 ? (
            <>
              {/* Histogram bars */}
              {bins.map((bin, i) => {
                const density = bin.count / (bootstrapValues.length * binWidth);
                if (density === 0) return null;
                const barX = xScale(bin.x0);
                const barW = xScale(bin.x1) - barX;
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
                    opacity={0.6}
                  />
                );
              })}

              {/* 95% CI band and lines */}
              {ci && (
                <>
                  {/* Semi-transparent green band */}
                  <rect
                    x={xScale(ci.lower)}
                    y={MARGIN.top}
                    width={xScale(ci.upper) - xScale(ci.lower)}
                    height={PLOT_HEIGHT}
                    fill="#10b981"
                    opacity={0.1}
                  />
                  {/* Lower CI line */}
                  <line
                    x1={xScale(ci.lower)}
                    x2={xScale(ci.lower)}
                    y1={MARGIN.top}
                    y2={MARGIN.top + PLOT_HEIGHT}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="6,4"
                  />
                  {/* Upper CI line */}
                  <line
                    x1={xScale(ci.upper)}
                    x2={xScale(ci.upper)}
                    y1={MARGIN.top}
                    y2={MARGIN.top + PLOT_HEIGHT}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="6,4"
                  />
                  {/* CI labels */}
                  <text
                    x={xScale(ci.lower)}
                    y={MARGIN.top - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#059669"
                    fontWeight={600}
                  >
                    {ci.lower.toFixed(3)}
                  </text>
                  <text
                    x={xScale(ci.upper)}
                    y={MARGIN.top - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#059669"
                    fontWeight={600}
                  >
                    {ci.upper.toFixed(3)}
                  </text>
                </>
              )}
            </>
          ) : (
            /* Placeholder text when no bootstraps have been run */
            <text
              x={MARGIN.left + PLOT_WIDTH / 2}
              y={MARGIN.top + PLOT_HEIGHT / 2}
              textAnchor="middle"
              fontSize={15}
              fill="#9ca3af"
            >
              Click a button above to start bootstrapping
            </text>
          )}

          {/* Zero line (always visible) */}
          <line
            x1={xScale(0)}
            x2={xScale(0)}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="#e63946"
            strokeWidth={1.5}
            strokeDasharray="6,4"
            opacity={0.8}
          />
          <text
            x={xScale(0) + 4}
            y={MARGIN.top + 14}
            fontSize={10}
            fill="#e63946"
            fontWeight={600}
          >
            0
          </text>

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
                x1={xScale(tick)}
                x2={xScale(tick)}
                y1={MARGIN.top + PLOT_HEIGHT}
                y2={MARGIN.top + PLOT_HEIGHT + 6}
                stroke="#9ca3af"
                strokeWidth={1}
              />
              <text
                x={xScale(tick)}
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
            Bootstrap indirect effect (a &times; b)
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
        </svg>
      </div>

      {/* Result cards */}
      {bootstrapValues.length > 0 && (
        <div className="results-row">
          <div className="result-card">
            <h5>Original <em>a</em> &times; <em>b</em></h5>
            <div className="result-value">{originalAB.toFixed(3)}</div>
          </div>
          <div className="result-card">
            <h5>Bootstrap SE</h5>
            <div className="result-value">{bootstrapSE.toFixed(3)}</div>
          </div>
          {ci && (
            <>
              <div className="result-card">
                <h5>95% CI</h5>
                <div className="result-value">
                  [{ci.lower.toFixed(3)}, {ci.upper.toFixed(3)}]
                </div>
              </div>
              <div
                className={`result-card ${
                  ci.lower > 0 || ci.upper < 0 ? 'significant' : 'not-significant'
                }`}
              >
                <h5>Zero excluded?</h5>
                <div className="result-value">
                  {ci.lower > 0 || ci.upper < 0 ? 'Yes' : 'No'}
                </div>
                <div className="result-detail">
                  {ci.lower > 0 || ci.upper < 0
                    ? 'Indirect effect is significant'
                    : 'Indirect effect is not significant'}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Note about BCa */}
      <p className="intro-text" style={{ marginTop: 'var(--spacing-lg)' }}>
        PROCESS, and most modern implementations, perform a small adjustment on the
        bootstrapped confidence interval to generate the "bias-corrected and
        accelerated (BCa) confidence interval." The technical details are beyond the
        scope of this demonstration: Just know that this adjustment exists.
      </p>
    </div>
  );
}
