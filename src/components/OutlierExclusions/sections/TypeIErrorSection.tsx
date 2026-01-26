import { useState, useCallback, useRef, useEffect } from 'react';
import {
  generateNormalSample,
  getOutlierIndicesWithinMedianIQR,
  getOutlierIndicesAcrossMedianIQR,
  welchTTest,
  removeAtIndices,
} from '../../../utils/statistics';

interface TStatTriple {
  original: number;
  within: number;
  across: number;
  id: number;
}

interface AnimatingT {
  value: number;
  type: 'within' | 'across';
  id: number;
  startTime: number;
}

export default function TypeIErrorSection() {
  const [isRunning, setIsRunning] = useState(false);
  const [tStatistics, setTStatistics] = useState<TStatTriple[]>([]);
  const [animatingTs, setAnimatingTs] = useState<AnimatingT[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastSimTimeRef = useRef<number>(0);
  const idCounterRef = useRef<number>(0);
  const slowIntervalMs = 150; // Time between experiments for first 30
  const fastIntervalMs = 30; // Time between experiments after 30
  const animationDurationMs = 600; // How long each t-stat takes to drop
  const targetSimulations = 200;

  const runSingleSimulation = useCallback((): { original: number; within: number; across: number } => {
    const group1 = generateNormalSample(30, 50, 10);
    const group2 = generateNormalSample(30, 50, 10);

    // Original t-test (no exclusion)
    const originalTest = welchTTest(group1, group2);

    // Within-condition exclusion (Median ± 1.5*IQR)
    const [withinOut1, withinOut2] = getOutlierIndicesWithinMedianIQR(group1, group2, 1.5);
    const withinFiltered1 = removeAtIndices(group1, withinOut1);
    const withinFiltered2 = removeAtIndices(group2, withinOut2);
    const withinTest = welchTTest(withinFiltered1, withinFiltered2);

    // Across-condition exclusion (Median ± 1.5*IQR)
    const [acrossOut1, acrossOut2] = getOutlierIndicesAcrossMedianIQR(group1, group2, 1.5);
    const acrossFiltered1 = removeAtIndices(group1, acrossOut1);
    const acrossFiltered2 = removeAtIndices(group2, acrossOut2);
    const acrossTest = welchTTest(acrossFiltered1, acrossFiltered2);

    return {
      original: originalTest.t,
      within: withinTest.t,
      across: acrossTest.t,
    };
  }, []);

  const animationLoop = useCallback((timestamp: number) => {
    // Speed up after first 30 experiments
    const intervalMs = tStatistics.length < 30 ? slowIntervalMs : fastIntervalMs;

    // Check if we should run a new simulation
    if (timestamp - lastSimTimeRef.current >= intervalMs) {
      if (tStatistics.length < targetSimulations) {
        const result = runSingleSimulation();
        const id = idCounterRef.current++;

        // Add to permanent list
        setTStatistics((prev) => [...prev, { ...result, id }]);

        // Add to animating list
        setAnimatingTs((prev) => [
          ...prev,
          { value: result.within, type: 'within', id: id * 2, startTime: timestamp },
          { value: result.across, type: 'across', id: id * 2 + 1, startTime: timestamp },
        ]);

        lastSimTimeRef.current = timestamp;
      } else {
        // Clear any remaining animating dots and stop
        setAnimatingTs([]);
        setIsRunning(false);
        return;
      }
    }

    // Clean up finished animations
    setAnimatingTs((prev) =>
      prev.filter((t) => timestamp - t.startTime < animationDurationMs)
    );

    animationRef.current = requestAnimationFrame(animationLoop);
  }, [tStatistics.length, runSingleSimulation]);

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
    setTStatistics([]);
    setAnimatingTs([]);
    idCounterRef.current = 0;
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleReset = () => {
    handleStop();
    setTStatistics([]);
    setAnimatingTs([]);
  };

  // Calculate false positive rates
  const criticalT = 2.0;
  const withinFP = tStatistics.filter((r) => Math.abs(r.within) > criticalT).length;
  const acrossFP = tStatistics.filter((r) => Math.abs(r.across) > criticalT).length;
  const fprWithin = tStatistics.length > 0 ? (withinFP / tStatistics.length) * 100 : 0;
  const fprAcross = tStatistics.length > 0 ? (acrossFP / tStatistics.length) * 100 : 0;

  // Chart dimensions
  const chartWidth = 700;
  const chartHeight = 380;
  const margin = { top: 60, right: 30, bottom: 60, left: 30 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  const tMin = -5;
  const tMax = 5;
  const xScale = (t: number) => ((t - tMin) / (tMax - tMin)) * plotWidth;

  // Compute y positions based on how many t-stats have landed at similar x positions
  const computeYPosition = (value: number, type: 'within' | 'across', allStats: TStatTriple[]) => {
    // Count how many of this type are in a similar bin
    const binWidth = 0.3;
    const bin = Math.floor(value / binWidth);
    const sameTypeSameBin = allStats.filter((s) => {
      const v = type === 'within' ? s.within : s.across;
      return Math.floor(v / binWidth) === bin;
    });
    const index = sameTypeSameBin.length;
    const baseY = type === 'within' ? plotHeight * 0.4 : plotHeight * 0.6;
    const offset = type === 'within' ? -index * 3 : index * 3;
    return Math.max(10, Math.min(plotHeight - 10, baseY + offset));
  };

  return (
    <div className="section-intro">
      <h2>The Impact on False-Positive Rates</h2>

      <p className="intro-text">
        The simulation below will generate datasets, and plot the t-statistic obtained
        from each of the two exclusion methods (<span style={{ color: 'var(--accent)', fontWeight: 600 }}>Red</span>: within conditions;{' '}
        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Blue</span>: across the data).
        For comparison, we will also plot the theoretical t-distribution (the one that
        is expected under the null).
      </p>

      <div className="action-buttons" style={{ justifyContent: 'center', marginTop: 'var(--spacing-lg)' }}>
        {!isRunning && tStatistics.length === 0 && (
          <button className="primary-button" onClick={handleStart}>
            Start Simulation
          </button>
        )}
        {isRunning && (
          <button className="secondary-button" onClick={handleStop}>
            Pause
          </button>
        )}
        {!isRunning && tStatistics.length > 0 && tStatistics.length < targetSimulations && (
          <button className="primary-button" onClick={() => setIsRunning(true)}>
            Continue
          </button>
        )}
        {tStatistics.length > 0 && (
          <button className="reset-button" onClick={handleReset}>
            Reset
          </button>
        )}
      </div>

      <div className="outlier-viz-container">
        <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Critical value shading */}
            <rect
              x={0}
              y={0}
              width={xScale(-criticalT)}
              height={plotHeight}
              fill="var(--accent)"
              opacity={0.08}
            />
            <rect
              x={xScale(criticalT)}
              y={0}
              width={plotWidth - xScale(criticalT)}
              height={plotHeight}
              fill="var(--accent)"
              opacity={0.08}
            />

            {/* Critical value lines */}
            <line
              x1={xScale(-criticalT)}
              y1={0}
              x2={xScale(-criticalT)}
              y2={plotHeight}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <line
              x1={xScale(criticalT)}
              y1={0}
              x2={xScale(criticalT)}
              y2={plotHeight}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <text
              x={xScale(-criticalT)}
              y={-8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--accent)"
            >
              t = -2
            </text>
            <text
              x={xScale(criticalT)}
              y={-8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--accent)"
            >
              t = 2
            </text>

            {/* Rejection region labels */}
            <text
              x={xScale(-3.5)}
              y={-25}
              textAnchor="middle"
              fontSize={11}
              fill="var(--accent)"
              fontWeight={500}
            >
              Reject H₀
            </text>
            <text
              x={xScale(3.5)}
              y={-25}
              textAnchor="middle"
              fontSize={11}
              fill="var(--accent)"
              fontWeight={500}
            >
              Reject H₀
            </text>

            {/* Center line */}
            <line
              x1={xScale(0)}
              y1={0}
              x2={xScale(0)}
              y2={plotHeight}
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* X-axis */}
            <line
              x1={0}
              y1={plotHeight / 2}
              x2={plotWidth}
              y2={plotHeight / 2}
              stroke="var(--text-secondary)"
              strokeWidth={1}
            />

            {/* X-axis labels */}
            {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((t) => (
              <g key={t}>
                <line
                  x1={xScale(t)}
                  y1={plotHeight / 2 - 4}
                  x2={xScale(t)}
                  y2={plotHeight / 2 + 4}
                  stroke="var(--text-secondary)"
                  strokeWidth={1}
                />
                <text
                  x={xScale(t)}
                  y={plotHeight / 2 + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                >
                  {t}
                </text>
              </g>
            ))}

            {/* Landed t-statistics */}
            {tStatistics.map((stat) => {
              // Within-condition (above the line)
              const withinY = computeYPosition(stat.within, 'within', tStatistics.slice(0, tStatistics.indexOf(stat) + 1));
              const acrossY = computeYPosition(stat.across, 'across', tStatistics.slice(0, tStatistics.indexOf(stat) + 1));

              return (
                <g key={stat.id}>
                  {/* Within-condition t-stat */}
                  <circle
                    cx={xScale(Math.max(tMin, Math.min(tMax, stat.within)))}
                    cy={withinY}
                    r={3}
                    fill="var(--accent)"
                    opacity={0.7}
                  />
                  {/* Across-condition t-stat */}
                  <circle
                    cx={xScale(Math.max(tMin, Math.min(tMax, stat.across)))}
                    cy={acrossY}
                    r={3}
                    fill="var(--primary)"
                    opacity={0.7}
                  />
                </g>
              );
            })}

            {/* Animating t-statistics (dropping) */}
            {animatingTs.map((t) => {
              const progress = Math.min(1, (performance.now() - t.startTime) / animationDurationMs);
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const targetY = t.type === 'within' ? plotHeight * 0.4 : plotHeight * 0.6;
              const currentY = -20 + easeOut * (targetY + 20);

              return (
                <circle
                  key={t.id}
                  cx={xScale(Math.max(tMin, Math.min(tMax, t.value)))}
                  cy={currentY}
                  r={4}
                  fill={t.type === 'within' ? 'var(--accent)' : 'var(--primary)'}
                  opacity={1 - progress * 0.3}
                />
              );
            })}

            {/* Legend */}
            <g transform={`translate(${plotWidth / 2 - 100}, ${plotHeight + 35})`}>
              <circle cx={0} cy={0} r={4} fill="var(--accent)" />
              <text x={10} y={4} fontSize={11} fill="var(--text-secondary)">
                Within-condition
              </text>
              <circle cx={120} cy={0} r={4} fill="var(--primary)" />
              <text x={130} y={4} fontSize={11} fill="var(--text-secondary)">
                Across-condition
              </text>
            </g>
          </g>
        </svg>
      </div>

      {tStatistics.length > 0 && (
        <div className="simulation-results" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="result-card">
            <div className="result-label">Within-Condition</div>
            <div className="result-value significant">
              {withinFP} / {tStatistics.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>
              False positive rate: {fprWithin.toFixed(1)}%
            </div>
          </div>
          <div className="result-card">
            <div className="result-label">Across-Condition</div>
            <div className="result-value">
              {acrossFP} / {tStatistics.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              False positive rate: {fprAcross.toFixed(1)}%
            </div>
          </div>
          <div className="result-card">
            <div className="result-label">Expected Rate</div>
            <div className="result-value not-significant">5%</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              (at α = 0.05)
            </div>
          </div>
        </div>
      )}

      {tStatistics.length >= targetSimulations && (
        <>
          <p style={{ marginTop: 'var(--spacing-xl)', lineHeight: 1.7 }}>
            Notice how the <strong style={{ color: 'var(--accent)' }}>red dots</strong> (within-condition)
            plot a wider distribution than the{' '}
            <strong style={{ color: 'var(--primary)' }}>blue dots</strong> (across-condition).
            This visual pattern shows why within-condition exclusion inflates
            false positive rates: it produces more extreme t-statistics when
            the null hypothesis is actually true. The graph below directly compares
            the t-stats (and resulting significance patterns) when excluding outliers
            within conditions vs. across the data.
          </p>

          {/* Scatter plot: Original vs Within-condition t-statistics */}
          <div className="outlier-viz-container" style={{ marginTop: 'var(--spacing-xl)' }}>
            <h4 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
              Within-Condition vs. Across-Condition Exclusion
            </h4>
            {(() => {
              const scatterMargin = { top: 40, right: 40, bottom: 60, left: 70 };
              const scatterWidth = chartWidth - scatterMargin.left - scatterMargin.right;
              const scatterHeight = chartWidth * 0.8 - scatterMargin.top - scatterMargin.bottom;
              const maxT = 5;
              const tCrit = 2; // Critical t-value for significance
              const scatterScale = (t: number) => (t / maxT) * scatterWidth;
              const scatterScaleY = (t: number) => scatterHeight - (t / maxT) * scatterHeight;

              // Calculate percentages (comparing within vs across)
              const amplified = tStatistics.filter(s => Math.abs(s.within) > Math.abs(s.across)).length;
              const shrunk = tStatistics.filter(s => Math.abs(s.within) < Math.abs(s.across)).length;
              const amplifiedPct = tStatistics.length > 0 ? ((amplified / tStatistics.length) * 100).toFixed(0) : 0;
              const shrunkPct = tStatistics.length > 0 ? ((shrunk / tStatistics.length) * 100).toFixed(0) : 0;

              // Calculate quadrant counts (across on x-axis, within on y-axis)
              const neverSig = tStatistics.filter(s => Math.abs(s.across) < tCrit && Math.abs(s.within) < tCrit).length;
              const sigAcrossOnly = tStatistics.filter(s => Math.abs(s.across) >= tCrit && Math.abs(s.within) < tCrit).length;
              const sigWithinOnly = tStatistics.filter(s => Math.abs(s.across) < tCrit && Math.abs(s.within) >= tCrit).length;
              const alwaysSig = tStatistics.filter(s => Math.abs(s.across) >= tCrit && Math.abs(s.within) >= tCrit).length;

              return (
                <>
                  <svg width={chartWidth} height={chartWidth * 0.8} viewBox={`0 0 ${chartWidth} ${chartWidth * 0.8}`}>
                    <defs>
                      {/* Hatching patterns */}
                      <pattern id="hatch-never-sig" patternUnits="userSpaceOnUse" width="8" height="8">
                        <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="var(--success)" strokeWidth="1" opacity="0.3" />
                      </pattern>
                      <pattern id="hatch-sig-before" patternUnits="userSpaceOnUse" width="8" height="8">
                        <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="var(--primary)" strokeWidth="1" opacity="0.3" />
                      </pattern>
                      <pattern id="hatch-sig-after" patternUnits="userSpaceOnUse" width="8" height="8">
                        <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />
                      </pattern>
                      <pattern id="hatch-always-sig" patternUnits="userSpaceOnUse" width="8" height="8">
                        <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="var(--text-secondary)" strokeWidth="1" opacity="0.3" />
                      </pattern>
                    </defs>
                    <g transform={`translate(${scatterMargin.left}, ${scatterMargin.top})`}>
                      {/* Four quadrant regions */}
                      {/* Never significant (bottom-left) */}
                      <rect
                        x={0}
                        y={scatterScaleY(tCrit)}
                        width={scatterScale(tCrit)}
                        height={scatterHeight - scatterScaleY(tCrit)}
                        fill="url(#hatch-never-sig)"
                      />
                      {/* Sig Before, N.S. After (bottom-right) */}
                      <rect
                        x={scatterScale(tCrit)}
                        y={scatterScaleY(tCrit)}
                        width={scatterWidth - scatterScale(tCrit)}
                        height={scatterHeight - scatterScaleY(tCrit)}
                        fill="url(#hatch-sig-before)"
                      />
                      {/* N.S. Before, Sig After (top-left) */}
                      <rect
                        x={0}
                        y={0}
                        width={scatterScale(tCrit)}
                        height={scatterScaleY(tCrit)}
                        fill="url(#hatch-sig-after)"
                      />
                      {/* Always Significant (top-right) */}
                      <rect
                        x={scatterScale(tCrit)}
                        y={0}
                        width={scatterWidth - scatterScale(tCrit)}
                        height={scatterScaleY(tCrit)}
                        fill="url(#hatch-always-sig)"
                      />

                      {/* Quadrant labels */}
                      <text x={scatterScale(1)} y={scatterScaleY(1)} textAnchor="middle" fontSize={10} fill="var(--success)" fontWeight={500}>
                        Never Sig.
                      </text>
                      <text x={scatterScale(1)} y={scatterScaleY(1) + 12} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
                        ({neverSig})
                      </text>

                      <text x={scatterScale(3.5)} y={scatterScaleY(1)} textAnchor="middle" fontSize={10} fill="var(--primary)" fontWeight={500}>
                        Sig. Across
                      </text>
                      <text x={scatterScale(3.5)} y={scatterScaleY(1) + 12} textAnchor="middle" fontSize={10} fill="var(--primary)" fontWeight={500}>
                        Only
                      </text>
                      <text x={scatterScale(3.5)} y={scatterScaleY(1) + 24} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
                        ({sigAcrossOnly})
                      </text>

                      <text x={scatterScale(1)} y={scatterScaleY(3.5)} textAnchor="middle" fontSize={10} fill="var(--accent)" fontWeight={500}>
                        Sig. Within
                      </text>
                      <text x={scatterScale(1)} y={scatterScaleY(3.5) + 12} textAnchor="middle" fontSize={10} fill="var(--accent)" fontWeight={500}>
                        Only
                      </text>
                      <text x={scatterScale(1)} y={scatterScaleY(3.5) + 24} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
                        ({sigWithinOnly})
                      </text>

                      <text x={scatterScale(3.5)} y={scatterScaleY(3.5)} textAnchor="middle" fontSize={10} fill="var(--text-secondary)" fontWeight={500}>
                        Always Sig.
                      </text>
                      <text x={scatterScale(3.5)} y={scatterScaleY(3.5) + 12} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
                        ({alwaysSig})
                      </text>

                      {/* Critical value lines */}
                      <line
                        x1={scatterScale(tCrit)}
                        y1={0}
                        x2={scatterScale(tCrit)}
                        y2={scatterHeight}
                        stroke="var(--text-secondary)"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        opacity={0.5}
                      />
                      <line
                        x1={0}
                        y1={scatterScaleY(tCrit)}
                        x2={scatterWidth}
                        y2={scatterScaleY(tCrit)}
                        stroke="var(--text-secondary)"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        opacity={0.5}
                      />

                      {/* Diagonal line (y = x) */}
                      <line
                        x1={0}
                        y1={scatterHeight}
                        x2={scatterWidth}
                        y2={0}
                        stroke="var(--text-primary)"
                        strokeWidth={2}
                        strokeDasharray="6,4"
                      />

                      {/* Axes */}
                      <line
                        x1={0}
                        y1={scatterHeight}
                        x2={scatterWidth}
                        y2={scatterHeight}
                        stroke="var(--text-secondary)"
                        strokeWidth={1}
                      />
                      <line
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={scatterHeight}
                        stroke="var(--text-secondary)"
                        strokeWidth={1}
                      />

                      {/* X-axis labels */}
                      {[0, 1, 2, 3, 4, 5].map((t) => (
                        <g key={`x-${t}`}>
                          <line
                            x1={scatterScale(t)}
                            y1={scatterHeight}
                            x2={scatterScale(t)}
                            y2={scatterHeight + 5}
                            stroke="var(--text-secondary)"
                          />
                          <text
                            x={scatterScale(t)}
                            y={scatterHeight + 18}
                            textAnchor="middle"
                            fontSize={11}
                            fill="var(--text-secondary)"
                          >
                            {t}
                          </text>
                        </g>
                      ))}
                      <text
                        x={scatterWidth / 2}
                        y={scatterHeight + 45}
                        textAnchor="middle"
                        fontSize={12}
                        fill="var(--text-primary)"
                      >
                        |t| with across-condition exclusion
                      </text>

                      {/* Y-axis labels */}
                      {[0, 1, 2, 3, 4, 5].map((t) => (
                        <g key={`y-${t}`}>
                          <line
                            x1={-5}
                            y1={scatterScaleY(t)}
                            x2={0}
                            y2={scatterScaleY(t)}
                            stroke="var(--text-secondary)"
                          />
                          <text
                            x={-10}
                            y={scatterScaleY(t) + 4}
                            textAnchor="end"
                            fontSize={11}
                            fill="var(--text-secondary)"
                          >
                            {t}
                          </text>
                        </g>
                      ))}
                      <text
                        x={-50}
                        y={scatterHeight / 2}
                        textAnchor="middle"
                        fontSize={12}
                        fill="var(--text-primary)"
                        transform={`rotate(-90, -50, ${scatterHeight / 2})`}
                      >
                        |t| with within-condition exclusion
                      </text>

                      {/* Data points */}
                      {tStatistics.map((stat) => {
                        const acrossAbs = Math.min(maxT, Math.abs(stat.across));
                        const withinAbs = Math.min(maxT, Math.abs(stat.within));
                        return (
                          <circle
                            key={stat.id}
                            cx={scatterScale(acrossAbs)}
                            cy={scatterScaleY(withinAbs)}
                            r={3}
                            fill="var(--accent)"
                            opacity={0.6}
                          />
                        );
                      })}
                    </g>
                  </svg>
                  <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)' }}>
                    In <strong style={{ color: 'var(--accent)' }}>{amplifiedPct}%</strong> of experiments, within-condition exclusion amplified the effect.
                    {' '}In <strong>{shrunkPct}%</strong>, it shrunk the effect.
                  </p>
                </>
              );
            })()}
          </div>
        </>
      )}

    </div>
  );
}
