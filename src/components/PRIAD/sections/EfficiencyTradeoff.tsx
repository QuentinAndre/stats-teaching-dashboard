import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  getPocockThresholds,
  getOBFThresholds,
  simulateSequentialTest,
} from '../../../utils/statistics';

type ThresholdType = 'pocock' | 'obf';

interface SimulationResult {
  id: number;
  stoppedAt: number;
  totalN: number;
  rejected: boolean;
  thresholdType: ThresholdType;
}

export default function EfficiencyTradeoff() {
  const [numStages, setNumStages] = useState(3);
  const [effectSize, setEffectSize] = useState(0.5);
  const [nPerStage, setNPerStage] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const animationRef = useRef<number | null>(null);
  const lastSimTimeRef = useRef<number>(0);
  const idCounterRef = useRef<number>(0);

  const targetSimulations = 200; // 100 per method
  const intervalMs = 40;

  const pocockThresholds = useMemo(() => getPocockThresholds(numStages), [numStages]);
  const obfThresholds = useMemo(() => getOBFThresholds(numStages), [numStages]);

  const maxN = nPerStage * numStages * 2; // Maximum sample size (both groups)

  // Run paired simulations (one Pocock, one OBF)
  const runSimulationPair = useCallback((): SimulationResult[] => {
    const pocockResult = simulateSequentialTest(effectSize, nPerStage, numStages, pocockThresholds);
    const obfResult = simulateSequentialTest(effectSize, nPerStage, numStages, obfThresholds);

    const id = idCounterRef.current;
    idCounterRef.current += 2;

    return [
      {
        id,
        stoppedAt: pocockResult.stoppedAt,
        totalN: pocockResult.totalN,
        rejected: pocockResult.rejected,
        thresholdType: 'pocock',
      },
      {
        id: id + 1,
        stoppedAt: obfResult.stoppedAt,
        totalN: obfResult.totalN,
        rejected: obfResult.rejected,
        thresholdType: 'obf',
      },
    ];
  }, [effectSize, nPerStage, numStages, pocockThresholds, obfThresholds]);

  // Animation loop
  const animationLoop = useCallback((timestamp: number) => {
    if (timestamp - lastSimTimeRef.current >= intervalMs) {
      if (results.length < targetSimulations) {
        const newResults = runSimulationPair();
        setResults((prev) => [...prev, ...newResults]);
        lastSimTimeRef.current = timestamp;
      } else {
        setIsRunning(false);
        return;
      }
    }
    animationRef.current = requestAnimationFrame(animationLoop);
  }, [results.length, runSimulationPair]);

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
    setResults([]);
    idCounterRef.current = 0;
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setResults([]);
  };

  // Calculate statistics
  const pocockResults = results.filter((r) => r.thresholdType === 'pocock');
  const obfResults = results.filter((r) => r.thresholdType === 'obf');

  const pocockPower = pocockResults.length > 0
    ? (pocockResults.filter((r) => r.rejected).length / pocockResults.length) * 100
    : 0;
  const obfPower = obfResults.length > 0
    ? (obfResults.filter((r) => r.rejected).length / obfResults.length) * 100
    : 0;

  const pocockAvgN = pocockResults.length > 0
    ? pocockResults.reduce((sum, r) => sum + r.totalN, 0) / pocockResults.length
    : maxN;
  const obfAvgN = obfResults.length > 0
    ? obfResults.reduce((sum, r) => sum + r.totalN, 0) / obfResults.length
    : maxN;

  const pocockSavings = ((maxN - pocockAvgN) / maxN) * 100;
  const obfSavings = ((maxN - obfAvgN) / maxN) * 100;

  // Stopping distribution
  const pocockStopDist = Array(numStages).fill(0);
  const obfStopDist = Array(numStages).fill(0);

  pocockResults.forEach((r) => {
    if (r.rejected) {
      pocockStopDist[r.stoppedAt - 1]++;
    } else {
      pocockStopDist[numStages - 1]++; // Non-rejections counted at final stage
    }
  });

  obfResults.forEach((r) => {
    if (r.rejected) {
      obfStopDist[r.stoppedAt - 1]++;
    } else {
      obfStopDist[numStages - 1]++;
    }
  });

  // SVG dimensions for stopping distribution
  const width = 500;
  const height = 180;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const barWidth = plotWidth / (numStages * 3);

  return (
    <div className="section-intro">
      <h2>The Efficiency Trade-off</h2>

      <p className="intro-text">
        PRIADs don't just maintain statistical validity—they can save substantial resources.
        When effects are real, studies often stop early, reducing average sample size while
        maintaining the planned power.
      </p>

      <p style={{ marginTop: 'var(--spacing-md)', lineHeight: 1.7 }}>
        André & Reinholtz re-analyzed 212 studies from the <em>Journal of Consumer Research</em> and
        found that PRIADs could have reduced data collection costs by <strong>20-29%</strong> on
        average, depending on the PRIAD configuration.
      </p>

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Simulate the Savings</h3>

      <p style={{ lineHeight: 1.7 }}>
        Adjust the parameters below to see how PRIADs perform under different conditions.
        The simulation runs experiments with both Pocock and O'Brien-Fleming thresholds.
      </p>

      <div className="simulation-controls">
        <div className="control-group">
          <label>True Effect Size (d)</label>
          <select
            value={effectSize}
            onChange={(e) => {
              setEffectSize(parseFloat(e.target.value));
              handleReset();
            }}
          >
            <option value={0}>0 (null true)</option>
            <option value={0.2}>0.2 (small)</option>
            <option value={0.5}>0.5 (medium)</option>
            <option value={0.8}>0.8 (large)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Stages</label>
          <select
            value={numStages}
            onChange={(e) => {
              setNumStages(parseInt(e.target.value));
              handleReset();
            }}
          >
            <option value={2}>2 stages</option>
            <option value={3}>3 stages</option>
            <option value={4}>4 stages</option>
          </select>
        </div>

        <div className="control-group">
          <label>n per Stage (per group)</label>
          <select
            value={nPerStage}
            onChange={(e) => {
              setNPerStage(parseInt(e.target.value));
              handleReset();
            }}
          >
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="action-buttons">
        {!isRunning && results.length === 0 && (
          <button className="primary-button" onClick={handleStart}>
            Run Simulation
          </button>
        )}
        {isRunning && (
          <button className="secondary-button" onClick={() => setIsRunning(false)}>
            Pause
          </button>
        )}
        {!isRunning && results.length > 0 && results.length < targetSimulations && (
          <button className="primary-button" onClick={() => setIsRunning(true)}>
            Continue
          </button>
        )}
        {results.length > 0 && (
          <button className="reset-button" onClick={handleReset}>
            Reset
          </button>
        )}
      </div>

      {/* Results comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-lg)' }}>
        {/* Pocock results */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--border-radius-lg)', padding: 'var(--spacing-lg)' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
            Pocock
          </h4>
          <div className="efficiency-stats" style={{ gridTemplateColumns: '1fr', margin: 0 }}>
            <div className="stat-card savings" style={{ padding: 'var(--spacing-md)' }}>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                {pocockResults.length > 0 ? `${pocockSavings.toFixed(0)}%` : '—'}
              </div>
              <div className="stat-label">Sample Size Saved</div>
            </div>
            <div className="stat-card power" style={{ padding: 'var(--spacing-md)' }}>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                {pocockResults.length > 0 ? `${pocockPower.toFixed(0)}%` : '—'}
              </div>
              <div className="stat-label">{effectSize === 0 ? 'Type I Error' : 'Power'}</div>
            </div>
            <div className="stat-card" style={{ padding: 'var(--spacing-md)', borderLeft: '4px solid var(--primary)' }}>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                {pocockResults.length > 0 ? Math.round(pocockAvgN) : '—'}
              </div>
              <div className="stat-label">Avg N (max {maxN})</div>
            </div>
          </div>
        </div>

        {/* O'Brien-Fleming results */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--border-radius-lg)', padding: 'var(--spacing-lg)' }}>
          <h4 style={{ color: 'var(--accent)', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
            O'Brien-Fleming
          </h4>
          <div className="efficiency-stats" style={{ gridTemplateColumns: '1fr', margin: 0 }}>
            <div className="stat-card savings" style={{ padding: 'var(--spacing-md)' }}>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                {obfResults.length > 0 ? `${obfSavings.toFixed(0)}%` : '—'}
              </div>
              <div className="stat-label">Sample Size Saved</div>
            </div>
            <div className="stat-card" style={{ padding: 'var(--spacing-md)', borderLeft: '4px solid var(--accent)' }}>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>
                {obfResults.length > 0 ? `${obfPower.toFixed(0)}%` : '—'}
              </div>
              <div className="stat-label">{effectSize === 0 ? 'Type I Error' : 'Power'}</div>
            </div>
            <div className="stat-card" style={{ padding: 'var(--spacing-md)', borderLeft: '4px solid var(--text-secondary)' }}>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                {obfResults.length > 0 ? Math.round(obfAvgN) : '—'}
              </div>
              <div className="stat-label">Avg N (max {maxN})</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stopping distribution chart */}
      {results.length > 0 && (
        <>
          <h4 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
            When Do Studies Stop?
          </h4>
          <div className="priad-viz-container">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              <g transform={`translate(${margin.left}, ${margin.top})`}>
                {/* Bars */}
                {Array.from({ length: numStages }, (_, i) => {
                  const x = (i / numStages) * plotWidth + plotWidth / numStages / 4;
                  const pocockHeight = (pocockStopDist[i] / Math.max(pocockResults.length, 1)) * plotHeight;
                  const obfHeight = (obfStopDist[i] / Math.max(obfResults.length, 1)) * plotHeight;

                  return (
                    <g key={i}>
                      {/* Pocock bar */}
                      <rect
                        x={x}
                        y={plotHeight - pocockHeight}
                        width={barWidth}
                        height={pocockHeight}
                        fill="var(--primary)"
                        opacity={0.8}
                      />
                      {/* OBF bar */}
                      <rect
                        x={x + barWidth + 4}
                        y={plotHeight - obfHeight}
                        width={barWidth}
                        height={obfHeight}
                        fill="var(--accent)"
                        opacity={0.8}
                      />
                    </g>
                  );
                })}

                {/* X-axis */}
                <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="var(--border)" />
                {Array.from({ length: numStages }, (_, i) => (
                  <text
                    key={i}
                    x={(i / numStages) * plotWidth + plotWidth / numStages / 2}
                    y={plotHeight + 20}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--text-secondary)"
                  >
                    Stage {i + 1}
                  </text>
                ))}

                {/* Y-axis */}
                <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--border)" />
                <text
                  x={-35}
                  y={plotHeight / 2}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                  transform={`rotate(-90, -35, ${plotHeight / 2})`}
                >
                  Studies Stopped
                </text>

                {/* Legend */}
                <g transform={`translate(${plotWidth - 100}, -10)`}>
                  <rect x={0} y={0} width={12} height={12} fill="var(--primary)" opacity={0.8} />
                  <text x={16} y={10} fontSize={10} fill="var(--text-secondary)">Pocock</text>
                  <rect x={60} y={0} width={12} height={12} fill="var(--accent)" opacity={0.8} />
                  <text x={76} y={10} fontSize={10} fill="var(--text-secondary)">OBF</text>
                </g>
              </g>
            </svg>
          </div>
        </>
      )}

      {/* Progress indicator */}
      {results.length > 0 && results.length < targetSimulations && (
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-md)',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
        }}>
          Studies: {results.length} / {targetSimulations}
        </div>
      )}

      {/* Interpretation */}
      {results.length >= targetSimulations && (
        <div className="key-insight success-box" style={{ marginTop: 'var(--spacing-xl)' }}>
          <h4>Understanding the Results</h4>
          <p>
            {effectSize === 0 ? (
              <>
                With no true effect (d = 0), both methods maintain approximately 5% Type I error,
                confirming the thresholds work correctly. Pocock shows slightly more early stopping
                due to its equal thresholds.
              </>
            ) : (
              <>
                With effect size d = {effectSize}, Pocock saved <strong>{pocockSavings.toFixed(0)}%</strong> of
                sample size while O'Brien-Fleming saved <strong>{obfSavings.toFixed(0)}%</strong>.
                {pocockSavings > obfSavings
                  ? ' Pocock\'s equal thresholds allow more early stopping, but OBF preserves more final-stage power.'
                  : ' O\'Brien-Fleming\'s conservative early thresholds mean less early stopping.'}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
