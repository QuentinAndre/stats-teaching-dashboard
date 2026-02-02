import { useState, useCallback, useRef, useEffect } from 'react';
import {
  generateNormalSample,
  welchTTest,
  mean,
  standardDeviation,
  getResiduals,
  generateRandomCovariate,
  logTransform,
  generateBinaryGrouping,
  generateCorrelatedVariable,
  oneWayANOVA,
} from '../../../utils/statistics';

type SimMode = 'manual' | 'auto';

interface SimulationResult {
  id: number;
  honestP: number;
  hackedP: number;
  honestSignificant: boolean;
  hackedSignificant: boolean;
}

interface AnimatingDot {
  id: number;
  pValue: number;
  type: 'honest' | 'hacked';
  startTime: number;
}

export default function PHackingSimulation() {
  const [mode, setMode] = useState<SimMode>('auto');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [animatingDots, setAnimatingDots] = useState<AnimatingDot[]>([]);

  // Degrees of freedom settings for p-hacking
  const [useOutlierRemoval, setUseOutlierRemoval] = useState(true);
  const [useCovariate, setUseCovariate] = useState(true);
  const [useGenderSplit, setUseGenderSplit] = useState(true);
  const [useLogTransform, setUseLogTransform] = useState(true);
  const [useDropCondition, setUseDropCondition] = useState(true);
  const [useSecondDV, setUseSecondDV] = useState(true);

  const animationRef = useRef<number | null>(null);
  const lastSimTimeRef = useRef<number>(0);
  const idCounterRef = useRef<number>(0);
  const targetSimulations = 200;
  const slowIntervalMs = 120;
  const fastIntervalMs = 25;
  const animationDurationMs = 500;

  // Run a single experiment with p-hacking
  const runSingleExperiment = useCallback((): { honestP: number; hackedP: number } => {
    const n = 25;
    // Generate THREE groups from the same population (null is TRUE for all comparisons)
    const group1 = generateNormalSample(n, 50, 15);
    const group2 = generateNormalSample(n, 50, 15);
    const group3 = generateNormalSample(n, 50, 15);

    // Generate a second DV correlated at r = 0.6 with the first for each group
    const dv2_group1 = generateCorrelatedVariable(group1, 0.6);
    const dv2_group2 = generateCorrelatedVariable(group2, 0.6);
    const dv2_group3 = generateCorrelatedVariable(group3, 0.6);

    // Honest analysis: one-way ANOVA across all three groups
    const honestANOVA = oneWayANOVA([group1, group2, group3]);
    const honestP = honestANOVA.pValue;

    // P-hacked analysis: try all enabled degrees of freedom, report minimum
    const pValues: number[] = [honestP];

    // Generate auxiliary data once
    const covariate1 = generateRandomCovariate(n);
    const covariate2 = generateRandomCovariate(n);
    const covariate3 = generateRandomCovariate(n);
    const gender1 = generateBinaryGrouping(n);
    const gender2 = generateBinaryGrouping(n);
    const gender3 = generateBinaryGrouping(n);

    let g1 = [...group1];
    let g2 = [...group2];
    let g3 = [...group3];

    // Drop condition: try all pairwise comparisons (dropping one condition each time)
    if (useDropCondition) {
      // Compare groups 1 vs 2 (drop group 3)
      const test12 = welchTTest(g1, g2);
      pValues.push(test12.p);

      // Compare groups 1 vs 3 (drop group 2)
      const test13 = welchTTest(g1, g3);
      pValues.push(test13.p);

      // Compare groups 2 vs 3 (drop group 1)
      const test23 = welchTTest(g2, g3);
      pValues.push(test23.p);
    }

    // Second DV: test the alternative outcome measure
    if (useSecondDV) {
      const anova2 = oneWayANOVA([dv2_group1, dv2_group2, dv2_group3]);
      pValues.push(anova2.pValue);

      // Also try pairwise on second DV if drop condition is enabled
      if (useDropCondition) {
        const test12_dv2 = welchTTest(dv2_group1, dv2_group2);
        pValues.push(test12_dv2.p);
        const test13_dv2 = welchTTest(dv2_group1, dv2_group3);
        pValues.push(test13_dv2.p);
        const test23_dv2 = welchTTest(dv2_group2, dv2_group3);
        pValues.push(test23_dv2.p);
      }
    }

    // Outlier removal
    if (useOutlierRemoval) {
      const combined = [...g1, ...g2, ...g3];
      const m = mean(combined);
      const sd = standardDeviation(combined, false);
      const lower = m - 2.5 * sd;
      const upper = m + 2.5 * sd;

      const filtered1 = g1.filter((v) => v >= lower && v <= upper);
      const filtered2 = g2.filter((v) => v >= lower && v <= upper);
      const filtered3 = g3.filter((v) => v >= lower && v <= upper);

      if (filtered1.length >= 3 && filtered2.length >= 3 && filtered3.length >= 3) {
        const anovaFiltered = oneWayANOVA([filtered1, filtered2, filtered3]);
        pValues.push(anovaFiltered.pValue);
        g1 = filtered1;
        g2 = filtered2;
        g3 = filtered3;
      }
    }

    // Covariate control
    if (useCovariate) {
      const residuals1 = getResiduals(g1, covariate1.slice(0, g1.length));
      const residuals2 = getResiduals(g2, covariate2.slice(0, g2.length));
      const residuals3 = getResiduals(g3, covariate3.slice(0, g3.length));
      const anovaCov = oneWayANOVA([residuals1, residuals2, residuals3]);
      pValues.push(anovaCov.pValue);
    }

    // Gender split
    if (useGenderSplit) {
      // Males only
      const males1 = g1.filter((_, i) => gender1[i]);
      const males2 = g2.filter((_, i) => gender2[i]);
      const males3 = g3.filter((_, i) => gender3[i]);
      if (males1.length >= 3 && males2.length >= 3 && males3.length >= 3) {
        const anovaMales = oneWayANOVA([males1, males2, males3]);
        pValues.push(anovaMales.pValue);
      }

      // Females only
      const females1 = g1.filter((_, i) => !gender1[i]);
      const females2 = g2.filter((_, i) => !gender2[i]);
      const females3 = g3.filter((_, i) => !gender3[i]);
      if (females1.length >= 3 && females2.length >= 3 && females3.length >= 3) {
        const anovaFemales = oneWayANOVA([females1, females2, females3]);
        pValues.push(anovaFemales.pValue);
      }
    }

    // Log transform
    if (useLogTransform) {
      const log1 = logTransform(g1);
      const log2 = logTransform(g2);
      const log3 = logTransform(g3);
      const anovaLog = oneWayANOVA([log1, log2, log3]);
      pValues.push(anovaLog.pValue);
    }

    const hackedP = Math.min(...pValues);
    return { honestP, hackedP };
  }, [useOutlierRemoval, useCovariate, useGenderSplit, useLogTransform, useDropCondition, useSecondDV]);

  // Animation loop
  const animationLoop = useCallback((timestamp: number) => {
    const intervalMs = results.length < 30 ? slowIntervalMs : fastIntervalMs;

    if (timestamp - lastSimTimeRef.current >= intervalMs) {
      if (results.length < targetSimulations) {
        const { honestP, hackedP } = runSingleExperiment();
        const id = idCounterRef.current++;

        const newResult: SimulationResult = {
          id,
          honestP,
          hackedP,
          honestSignificant: honestP < 0.05,
          hackedSignificant: hackedP < 0.05,
        };

        setResults((prev) => [...prev, newResult]);

        // Add animating dots
        setAnimatingDots((prev) => [
          ...prev,
          { id: id * 2, pValue: honestP, type: 'honest', startTime: timestamp },
          { id: id * 2 + 1, pValue: hackedP, type: 'hacked', startTime: timestamp },
        ]);

        lastSimTimeRef.current = timestamp;
      } else {
        setAnimatingDots([]);
        setIsRunning(false);
        return;
      }
    }

    // Clean up finished animations
    setAnimatingDots((prev) =>
      prev.filter((dot) => timestamp - dot.startTime < animationDurationMs)
    );

    animationRef.current = requestAnimationFrame(animationLoop);
  }, [results.length, runSingleExperiment]);

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
    setAnimatingDots([]);
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
    setResults([]);
    setAnimatingDots([]);
  };

  // Calculate statistics
  const honestFP = results.filter((r) => r.honestSignificant).length;
  const hackedFP = results.filter((r) => r.hackedSignificant).length;
  const honestFPR = results.length > 0 ? (honestFP / results.length) * 100 : 0;
  const hackedFPR = results.length > 0 ? (hackedFP / results.length) * 100 : 0;

  // Count active degrees of freedom
  const activeDFs = [useOutlierRemoval, useCovariate, useGenderSplit, useLogTransform, useDropCondition, useSecondDV].filter(Boolean).length;

  // Histogram dimensions
  const histWidth = 320;
  const histHeight = 200;
  const histMargin = { top: 20, right: 20, bottom: 40, left: 40 };
  const histPlotWidth = histWidth - histMargin.left - histMargin.right;
  const histPlotHeight = histHeight - histMargin.top - histMargin.bottom;

  // Create histogram bins
  const createBins = (values: number[], binCount: number = 20) => {
    const bins = Array(binCount).fill(0);
    values.forEach((p) => {
      const binIndex = Math.min(binCount - 1, Math.floor(p * binCount));
      bins[binIndex]++;
    });
    return bins;
  };

  const honestBins = createBins(results.map((r) => r.honestP));
  const hackedBins = createBins(results.map((r) => r.hackedP));
  const maxBinCount = Math.max(...honestBins, ...hackedBins, 1);

  const renderHistogram = (
    bins: number[],
    color: string,
    label: string,
    sigCount: number,
    fpr: number,
    animDots: AnimatingDot[],
    type: 'honest' | 'hacked'
  ) => {
    const binWidth = histPlotWidth / bins.length;
    const yScale = (count: number) => (count / maxBinCount) * histPlotHeight;

    return (
      <div className={`histogram-panel ${type}`}>
        <h4>{label}</h4>
        <svg width={histWidth} height={histHeight} viewBox={`0 0 ${histWidth} ${histHeight}`}>
          <g transform={`translate(${histMargin.left}, ${histMargin.top})`}>
            {/* Significance threshold at p = 0.05 */}
            <rect
              x={0}
              y={0}
              width={binWidth}
              height={histPlotHeight}
              fill={color}
              opacity={0.15}
            />
            <line
              x1={binWidth}
              y1={0}
              x2={binWidth}
              y2={histPlotHeight}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <text
              x={binWidth + 4}
              y={12}
              fontSize={9}
              fill={color}
            >
              α = .05
            </text>

            {/* Histogram bars */}
            {bins.map((count, i) => (
              <rect
                key={i}
                x={i * binWidth}
                y={histPlotHeight - yScale(count)}
                width={binWidth - 1}
                height={yScale(count)}
                fill={i === 0 ? color : 'var(--primary)'}
                opacity={i === 0 ? 0.8 : 0.4}
              />
            ))}

            {/* Animating dots */}
            {animDots.filter((d) => d.type === type).map((dot) => {
              const progress = Math.min(1, (performance.now() - dot.startTime) / animationDurationMs);
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const binIndex = Math.min(bins.length - 1, Math.floor(dot.pValue * bins.length));
              const targetX = binIndex * binWidth + binWidth / 2;
              const targetY = histPlotHeight - yScale(bins[binIndex]) - 5;
              const currentY = -15 + easeOut * (targetY + 15);

              return (
                <circle
                  key={dot.id}
                  cx={targetX}
                  cy={currentY}
                  r={4}
                  fill={binIndex === 0 ? color : 'var(--primary)'}
                  opacity={1 - progress * 0.5}
                />
              );
            })}

            {/* X-axis */}
            <line
              x1={0}
              y1={histPlotHeight}
              x2={histPlotWidth}
              y2={histPlotHeight}
              stroke="var(--border)"
            />
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <g key={p}>
                <line
                  x1={p * histPlotWidth}
                  y1={histPlotHeight}
                  x2={p * histPlotWidth}
                  y2={histPlotHeight + 5}
                  stroke="var(--text-secondary)"
                />
                <text
                  x={p * histPlotWidth}
                  y={histPlotHeight + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--text-secondary)"
                >
                  {p.toFixed(2)}
                </text>
              </g>
            ))}
            <text
              x={histPlotWidth / 2}
              y={histPlotHeight + 32}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-secondary)"
            >
              p-value
            </text>

            {/* Y-axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={histPlotHeight}
              stroke="var(--border)"
            />
          </g>
        </svg>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'var(--spacing-sm)',
          padding: '0 var(--spacing-sm)',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            False positives: <strong style={{ color }}>{sigCount}</strong> / {results.length}
          </span>
          <span style={{ fontSize: '0.8rem', color }}>
            FPR: <strong>{fpr.toFixed(1)}%</strong>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="section-intro">
      <h2>The P-Hacking Simulator</h2>

      <p className="intro-text">
        This simulation compares honest analysis (single pre-planned ANOVA across three groups)
        against p-hacked analysis (trying multiple approaches and reporting the minimum p-value).
        In all cases, the null hypothesis is true—all three groups come from identical populations.
      </p>

      {/* Mode toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-button ${mode === 'auto' ? 'active' : ''}`}
          onClick={() => setMode('auto')}
        >
          Automatic Mode
        </button>
        <button
          className={`mode-button ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
        >
          Configure Options
        </button>
      </div>

      {/* Options panel (shown in manual mode) */}
      {mode === 'manual' && (
        <div className="phacking-controls">
          <h4>P-Hacking Options</h4>
          <p style={{ margin: '0 0 var(--spacing-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Select which researcher degrees of freedom to exploit. More options = higher false-positive rate.
          </p>

          <div className="control-row" style={{ flexWrap: 'wrap' }}>
            <div
              className={`control-checkbox ${useOutlierRemoval ? 'active' : ''}`}
              onClick={() => setUseOutlierRemoval(!useOutlierRemoval)}
            >
              <input
                type="checkbox"
                checked={useOutlierRemoval}
                onChange={(e) => setUseOutlierRemoval(e.target.checked)}
              />
              <label>Remove outliers (±2.5 SD)</label>
            </div>

            <div
              className={`control-checkbox ${useCovariate ? 'active' : ''}`}
              onClick={() => setUseCovariate(!useCovariate)}
            >
              <input
                type="checkbox"
                checked={useCovariate}
                onChange={(e) => setUseCovariate(e.target.checked)}
              />
              <label>Control for covariate</label>
            </div>

            <div
              className={`control-checkbox ${useGenderSplit ? 'active' : ''}`}
              onClick={() => setUseGenderSplit(!useGenderSplit)}
            >
              <input
                type="checkbox"
                checked={useGenderSplit}
                onChange={(e) => setUseGenderSplit(e.target.checked)}
              />
              <label>Analyze by gender</label>
            </div>

            <div
              className={`control-checkbox ${useLogTransform ? 'active' : ''}`}
              onClick={() => setUseLogTransform(!useLogTransform)}
            >
              <input
                type="checkbox"
                checked={useLogTransform}
                onChange={(e) => setUseLogTransform(e.target.checked)}
              />
              <label>Log-transform DV</label>
            </div>

            <div
              className={`control-checkbox ${useDropCondition ? 'active' : ''}`}
              onClick={() => setUseDropCondition(!useDropCondition)}
            >
              <input
                type="checkbox"
                checked={useDropCondition}
                onChange={(e) => setUseDropCondition(e.target.checked)}
              />
              <label>Drop a condition (3 groups)</label>
            </div>

            <div
              className={`control-checkbox ${useSecondDV ? 'active' : ''}`}
              onClick={() => setUseSecondDV(!useSecondDV)}
            >
              <input
                type="checkbox"
                checked={useSecondDV}
                onChange={(e) => setUseSecondDV(e.target.checked)}
              />
              <label>Use second DV (r = .6)</label>
            </div>
          </div>

          <p style={{ margin: 'var(--spacing-sm) 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Active degrees of freedom: <strong>{activeDFs}</strong>
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="action-buttons">
        {!isRunning && results.length === 0 && (
          <button className="primary-button" onClick={handleStart}>
            Start Simulation
          </button>
        )}
        {isRunning && (
          <button className="secondary-button" onClick={handleStop}>
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

      {/* Dual histogram display */}
      <div className="dual-histogram">
        {renderHistogram(
          honestBins,
          'var(--primary)',
          'Honest Analysis',
          honestFP,
          honestFPR,
          animatingDots,
          'honest'
        )}
        {renderHistogram(
          hackedBins,
          'var(--accent)',
          'P-Hacked Analysis',
          hackedFP,
          hackedFPR,
          animatingDots,
          'hacked'
        )}
      </div>

      {/* FPR comparison cards */}
      {results.length > 0 && (
        <div className="fpr-comparison">
          <div className="fpr-card honest">
            <div className="fpr-label">Honest Analysis</div>
            <div className="fpr-value">{honestFPR.toFixed(1)}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              {honestFP} / {results.length} false positives
            </div>
          </div>
          <div className="fpr-card phacked">
            <div className="fpr-label">P-Hacked Analysis</div>
            <div className="fpr-value">{hackedFPR.toFixed(1)}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              {hackedFP} / {results.length} false positives
            </div>
          </div>
          <div className="fpr-card expected">
            <div className="fpr-label">Expected (α = .05)</div>
            <div className="fpr-value">5.0%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              {Math.round(results.length * 0.05)} / {results.length} expected
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {results.length > 0 && results.length < targetSimulations && (
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-md)',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
        }}>
          Experiments: {results.length} / {targetSimulations}
        </div>
      )}

      {/* Placeholder when no results */}
      {results.length === 0 && (
        <div style={{
          marginTop: 'var(--spacing-xl)',
          padding: 'var(--spacing-xl)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px dashed var(--border)',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Click "Start Simulation" to see how p-hacking inflates false-positive rates.
            Each experiment generates data from identical populations (null is true).
          </p>
        </div>
      )}

      {/* Interpretation after simulation */}
      {results.length >= targetSimulations && (
        <>
          <div style={{ marginTop: 'var(--spacing-xl)', lineHeight: 1.7 }}>
            <p>
              Notice the dramatic difference between the two distributions. With <strong>honest analysis</strong>,
              the p-values are uniformly distributed—as expected when the null hypothesis is true.
              About {honestFPR.toFixed(0)}% fall below 0.05, close to the nominal 5%.
            </p>
            <p style={{ marginTop: 'var(--spacing-md)' }}>
              With <strong>p-hacking</strong>, the distribution is heavily skewed toward small values.
              {' '}{hackedFPR.toFixed(0)}% of experiments yielded "significant" results—{(hackedFPR / 5).toFixed(1)}×
              the expected false-positive rate. This is the result of picking the minimum p-value from
              multiple analyses.
            </p>
          </div>

          <div className="key-insight warning-box" style={{ marginTop: 'var(--spacing-xl)' }}>
            <h4>The Lesson</h4>
            <p>
              With enough flexibility, a researcher can almost always find "significance" in noise.
              <strong> Pre-registration</strong> (specifying your analysis plan before seeing data)
              and <strong>transparent reporting</strong> (disclosing all analyses attempted) are
              essential safeguards against false discoveries.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
