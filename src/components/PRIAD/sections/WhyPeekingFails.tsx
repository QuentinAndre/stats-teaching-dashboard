import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  generateNormalSample,
  welchTTest,
  calculatePeekingTypeIError,
} from '../../../utils/statistics';

interface PValuePath {
  id: number;
  points: { stage: number; pValue: number }[];
  significant: boolean;
  significantAt?: number;
}

export default function WhyPeekingFails() {
  const [numPeeks, setNumPeeks] = useState(3);
  const [paths, setPaths] = useState<PValuePath[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastSimTimeRef = useRef<number>(0);
  const idCounterRef = useRef<number>(0);

  const targetSimulations = 100;
  const intervalMs = 80;
  const nPerStage = 20;

  // Calculate theoretical Type I error for current number of peeks
  const theoreticalError = useMemo(() => {
    return calculatePeekingTypeIError(numPeeks) * 100;
  }, [numPeeks]);

  // Run a single experiment with peeking
  const runSingleExperiment = useCallback((): PValuePath => {
    const points: { stage: number; pValue: number }[] = [];
    let allGroup1: number[] = [];
    let allGroup2: number[] = [];
    let significant = false;
    let significantAt: number | undefined;

    for (let stage = 1; stage <= numPeeks; stage++) {
      // Generate new data for this stage (both groups from same population - null is true)
      const stageGroup1 = generateNormalSample(nPerStage, 0, 1);
      const stageGroup2 = generateNormalSample(nPerStage, 0, 1);

      allGroup1 = [...allGroup1, ...stageGroup1];
      allGroup2 = [...allGroup2, ...stageGroup2];

      // Test at each peek
      const result = welchTTest(allGroup1, allGroup2);
      points.push({ stage, pValue: result.p });

      // Check for significance (naive peeking at α = 0.05)
      if (!significant && result.p < 0.05) {
        significant = true;
        significantAt = stage;
      }
    }

    return {
      id: idCounterRef.current++,
      points,
      significant,
      significantAt,
    };
  }, [numPeeks]);

  // Animation loop
  const animationLoop = useCallback((timestamp: number) => {
    if (timestamp - lastSimTimeRef.current >= intervalMs) {
      if (paths.length < targetSimulations) {
        const newPath = runSingleExperiment();
        setPaths((prev) => [...prev, newPath]);
        lastSimTimeRef.current = timestamp;
      } else {
        setIsRunning(false);
        return;
      }
    }
    animationRef.current = requestAnimationFrame(animationLoop);
  }, [paths.length, runSingleExperiment]);

  useEffect(() => {
    if (isRunning) {
      lastSimTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animationLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, animationLoop]);

  const handleStart = () => {
    setPaths([]);
    idCounterRef.current = 0;
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setPaths([]);
  };

  // Calculate observed FPR
  const falsePositives = paths.filter((p) => p.significant).length;
  const observedFPR = paths.length > 0 ? (falsePositives / paths.length) * 100 : 0;

  // SVG dimensions for trajectory plot
  const width = 600;
  const height = 300;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = (stage: number) => ((stage - 0.5) / numPeeks) * plotWidth;
  const yScale = (p: number) => (1 - p) * plotHeight; // Invert so 0 is at bottom, 1 at top

  return (
    <div className="section-intro">
      <h2>Why Peeking Fails</h2>

      <p className="intro-text">
        When you test your hypothesis multiple times as data accumulate, each test gives you
        another chance to obtain <em>p</em> &lt; .05 by chance. Even when the null hypothesis is
        true (no real effect), repeated testing inflates your false-positive rate.
      </p>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>The Math of Multiple Peeks</h3>

      <p style={{ lineHeight: 1.7 }}>
        Consider peking at your data twice. The probability of a false positive is no longer
        simply α = .05. Instead, it's:
      </p>

      <div style={{
        background: 'var(--bg-secondary)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--border-radius)',
        margin: 'var(--spacing-md) 0',
        fontFamily: "'SF Mono', Monaco, Consolas, monospace",
        textAlign: 'center',
      }}>
        P(false positive) = P(p₁ &lt; .05) + P(p₁ ≥ .05 ∩ p₂ &lt; .05) &gt; .05
      </div>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        The more you peek, the worse it gets. With 5 peeks at α = .05, your actual Type I error
        rate can exceed 13%—nearly three times the nominal level.
      </p>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>See It in Action</h3>

      <p style={{ lineHeight: 1.7 }}>
        The simulation below generates data under the null hypothesis (no true effect) and
        shows the p-value at each peek. When any peek yields <em>p</em> &lt; .05, that path
        turns red—a false positive.
      </p>

      <div className="simulation-controls">
        <div className="control-group">
          <label>Number of Peeks</label>
          <select
            value={numPeeks}
            onChange={(e) => {
              setNumPeeks(parseInt(e.target.value));
              handleReset();
            }}
          >
            <option value={1}>1 (no peeking)</option>
            <option value={2}>2 peeks</option>
            <option value={3}>3 peeks</option>
            <option value={4}>4 peeks</option>
            <option value={5}>5 peeks</option>
          </select>
        </div>

        <div className="control-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div className="action-buttons" style={{ margin: 0 }}>
            {!isRunning && paths.length === 0 && (
              <button className="primary-button" onClick={handleStart}>
                Run Simulation
              </button>
            )}
            {isRunning && (
              <button className="secondary-button" onClick={() => setIsRunning(false)}>
                Pause
              </button>
            )}
            {!isRunning && paths.length > 0 && paths.length < targetSimulations && (
              <button className="primary-button" onClick={() => setIsRunning(true)}>
                Continue
              </button>
            )}
            {paths.length > 0 && (
              <button className="reset-button" onClick={handleReset}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* P-value trajectory visualization */}
      <div className="priad-viz-container">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Significance threshold line */}
            <line
              x1={0}
              y1={yScale(0.05)}
              x2={plotWidth}
              y2={yScale(0.05)}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="6,4"
            />
            <text
              x={5}
              y={yScale(0.05) - 8}
              fontSize={11}
              fill="var(--accent)"
              fontWeight={500}
            >
              α = .05
            </text>

            {/* Shaded rejection region */}
            <rect
              x={0}
              y={yScale(0.05)}
              width={plotWidth}
              height={plotHeight - yScale(0.05)}
              fill="var(--accent)"
              opacity={0.1}
            />

            {/* P-value paths */}
            {paths.map((path) => (
              <g key={path.id}>
                <polyline
                  points={path.points.map((p) => `${xScale(p.stage)},${yScale(p.pValue)}`).join(' ')}
                  fill="none"
                  stroke={path.significant ? 'var(--accent)' : 'var(--primary)'}
                  strokeWidth={path.significant ? 2 : 1}
                  opacity={path.significant ? 0.8 : 0.2}
                />
                {path.significantAt && (
                  <circle
                    cx={xScale(path.significantAt)}
                    cy={yScale(path.points[path.significantAt - 1].pValue)}
                    r={4}
                    fill="var(--accent)"
                  />
                )}
              </g>
            ))}

            {/* X-axis */}
            <line
              x1={0}
              y1={plotHeight}
              x2={plotWidth}
              y2={plotHeight}
              stroke="var(--border)"
            />
            {Array.from({ length: numPeeks }, (_, i) => i + 1).map((stage) => (
              <g key={stage}>
                <line
                  x1={xScale(stage)}
                  y1={plotHeight}
                  x2={xScale(stage)}
                  y2={plotHeight + 5}
                  stroke="var(--text-secondary)"
                />
                <text
                  x={xScale(stage)}
                  y={plotHeight + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                >
                  Peek {stage}
                </text>
              </g>
            ))}
            <text
              x={plotWidth / 2}
              y={plotHeight + 40}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-secondary)"
            >
              Data Collection Stage
            </text>

            {/* Y-axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={plotHeight}
              stroke="var(--border)"
            />
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <g key={p}>
                <line
                  x1={-5}
                  y1={yScale(p)}
                  x2={0}
                  y2={yScale(p)}
                  stroke="var(--text-secondary)"
                />
                <text
                  x={-10}
                  y={yScale(p) + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--text-secondary)"
                >
                  {p.toFixed(2)}
                </text>
              </g>
            ))}
            <text
              x={-45}
              y={plotHeight / 2}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-secondary)"
              transform={`rotate(-90, -45, ${plotHeight / 2})`}
            >
              p-value
            </text>
          </g>
        </svg>
      </div>

      {/* Error rate comparison */}
      <div className="error-accumulation">
        <div className="error-card">
          <div className="error-value safe">5.0%</div>
          <div className="error-label">Expected (α = .05)</div>
        </div>
        <div className="error-card">
          <div className={`error-value ${theoreticalError > 5.5 ? 'warning' : 'safe'}`}>
            {theoreticalError.toFixed(1)}%
          </div>
          <div className="error-label">Theoretical ({numPeeks} peek{numPeeks > 1 ? 's' : ''})</div>
        </div>
        <div className="error-card">
          <div className={`error-value ${observedFPR > 5.5 ? 'warning' : 'safe'}`}>
            {paths.length > 0 ? `${observedFPR.toFixed(1)}%` : '—'}
          </div>
          <div className="error-label">Observed ({falsePositives}/{paths.length})</div>
        </div>
      </div>

      {/* Progress indicator */}
      {paths.length > 0 && paths.length < targetSimulations && (
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-md)',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
        }}>
          Studies: {paths.length} / {targetSimulations}
        </div>
      )}

      {/* Interpretation */}
      {paths.length >= targetSimulations && (
        <div className="key-insight warning-box" style={{ marginTop: 'var(--spacing-xl)' }}>
          <h4>The Problem is Clear</h4>
          <p>
            With {numPeeks} peek{numPeeks > 1 ? 's' : ''} at α = .05, the observed false-positive
            rate was <strong>{observedFPR.toFixed(1)}%</strong>—{(observedFPR / 5).toFixed(1)}×
            the nominal 5%. Every additional peek gives you another chance to "find" something
            that isn't there.
          </p>
        </div>
      )}

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Why This Happens</h3>

      <p style={{ lineHeight: 1.7 }}>
        The intuition is straightforward. Once you've conducted a single test at α = .05, you
        will already get a false-positive result 5% of the time. Any additional test you conduct
        elevates your false-positive rate further—because each test gives you another chance to
        cross the significance threshold by chance alone.
      </p>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        The more tests you conduct, the more your false-positive rate is elevated. This is
        true regardless of whether the tests are on independent data or on accumulating data
        (though the exact inflation differs). The fundamental problem is the same: multiple
        opportunities to declare significance means multiple opportunities for false positives.
      </p>

      <div className="key-insight" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>The Solution</h4>
        <p>
          The fix isn't to stop peeking—it's to <strong>adjust your significance thresholds</strong> to
          account for multiple looks. PRIADs provide pre-specified thresholds that maintain the
          overall Type I error rate at exactly α = .05, even with multiple interim analyses.
        </p>
      </div>
    </div>
  );
}
