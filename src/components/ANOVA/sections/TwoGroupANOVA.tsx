import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  generateNormalSample,
  welchTTest,
  oneWayANOVA,
  mean,
  tDistributionPDF,
  fDistributionPDF,
} from '../../../utils/statistics';

interface TrialResult {
  id: number;
  t: number;
  tSquared: number;
  f: number;
}

// Separate component for the folding animation visualization
function FoldingTransformationViz({
  foldProgress,
  isAnimating,
  setFoldProgress,
  setIsAnimating,
}: {
  foldProgress: number;
  isAnimating: boolean;
  setFoldProgress: (p: number) => void;
  setIsAnimating: (a: boolean) => void;
}) {
  const df = 30; // degrees of freedom for demonstration
  const vizWidth = 550;
  const vizHeight = 300; // Increased height for F-distribution peak
  const margin = { top: 30, right: 30, bottom: 40, left: 50 };
  const plotWidth = vizWidth - margin.left - margin.right;
  const plotHeight = vizHeight - margin.top - margin.bottom;

  const tMax = 3;
  const fMax = 9; // 3² = 9

  // For F(1, df), the PDF goes to infinity as F→0
  // We need to cap the display at a reasonable F value to avoid infinity
  const fMinDisplay = 0.1; // Don't display below this F value

  // Find max PDF value for t-distribution (at t=0)
  const maxTPdf = tDistributionPDF(0, df);

  // Find max of actual F(1, df) PDF at our minimum display value
  // F(1,df) is monotonically decreasing, so max is at our display cutoff
  const maxFPdf = fDistributionPDF(fMinDisplay, 1, df);

  // X scale: maps values to pixel positions
  const xScaleT = (t: number) => ((t + tMax) / (2 * tMax)) * plotWidth;
  const xScaleF = (f: number) => (f / fMax) * plotWidth;

  // Use the larger of the two maxima for consistent scaling
  // Cap at a reasonable multiple of t-distribution peak to avoid extreme scaling
  const globalMaxPdf = Math.min(Math.max(maxTPdf, maxFPdf), maxTPdf * 3);

  // Y scale that accommodates both distributions with headroom
  const yScale = (pdf: number) => {
    const normalized = pdf / globalMaxPdf;
    // Clamp to avoid going off the chart
    const clamped = Math.min(normalized, 1.0);
    return plotHeight - clamped * plotHeight * 0.95;
  };

  const steps = 100;

  const rightHalfData = useMemo(() => {
    const points: { t: number; x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tMax; // 0 to tMax
      const tPdf = tDistributionPDF(t, df);
      const f = t * t;

      // X position: interpolate from t-scale to F-scale
      const xAtT0 = xScaleT(t);
      const xAtT1 = xScaleF(f);
      const x = xAtT0 + (xAtT1 - xAtT0) * foldProgress;

      // Y position:
      // At progress=0: t-distribution PDF
      // At progress=1: F(1,df) PDF (use the actual F distribution)
      const startPdf = tPdf;
      // Use actual F(1,df) distribution for the end state
      const endPdf = f > fMinDisplay ? fDistributionPDF(f, 1, df) : fDistributionPDF(fMinDisplay, 1, df);

      const currentPdf = startPdf + (endPdf - startPdf) * foldProgress;
      const y = yScale(currentPdf);

      points.push({ t, x, y });
    }
    return points;
  }, [foldProgress, df, plotWidth, plotHeight, globalMaxPdf, fMinDisplay]);

  const leftHalfData = useMemo(() => {
    const points: { t: number; x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = -(i / steps) * tMax; // 0 to -tMax
      const tPdf = tDistributionPDF(t, df);
      const f = t * t;

      // X position: interpolate from t-scale to F-scale
      const xAtT0 = xScaleT(t);
      const xAtT1 = xScaleF(f);
      const x = xAtT0 + (xAtT1 - xAtT0) * foldProgress;

      // Y position:
      // At progress=0: t-distribution PDF
      // At progress=1: F(1,df) PDF (use the actual F distribution)
      const startPdf = tPdf;
      const endPdf = f > fMinDisplay ? fDistributionPDF(f, 1, df) : fDistributionPDF(fMinDisplay, 1, df);

      const currentPdf = startPdf + (endPdf - startPdf) * foldProgress;
      const y = yScale(currentPdf);

      points.push({ t, x, y });
    }
    return points;
  }, [foldProgress, df, plotWidth, plotHeight, globalMaxPdf, fMinDisplay]);

  // Generate paths - right half goes from t=0 outward, left half goes from t=0 outward (in negative direction)
  const rightPath = rightHalfData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const leftPath = leftHalfData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Theoretical F(1, df) distribution path using the actual F-distribution PDF
  const fPath = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const f = fMinDisplay + (i / 200) * (fMax - fMinDisplay);
      // Use the actual F(1, df) PDF
      const fPdf = fDistributionPDF(f, 1, df);
      const x = xScaleF(f);
      const y = yScale(fPdf);
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return points.join(' ');
  }, [df, plotWidth, plotHeight, globalMaxPdf, fMinDisplay]);

  // Animation effect
  useEffect(() => {
    if (!isAnimating) return;

    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    const startProgress = foldProgress;
    const targetProgress = startProgress < 0.5 ? 1 : 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease in-out
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const newProgress = startProgress + (targetProgress - startProgress) * eased;

      setFoldProgress(newProgress);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimating, foldProgress, setFoldProgress, setIsAnimating]);

  const handleToggle = () => {
    if (!isAnimating) {
      setIsAnimating(true);
    }
  };

  // X-axis tick positions and labels
  const getAxisTicks = () => {
    if (foldProgress < 0.3) {
      // t-scale: -3, -1.5, 0, +1.5, +3
      return [
        { pos: xScaleT(-3), label: '-3' },
        { pos: xScaleT(-1.5), label: '-1.5' },
        { pos: xScaleT(0), label: '0' },
        { pos: xScaleT(1.5), label: '+1.5' },
        { pos: xScaleT(3), label: '+3' },
      ];
    } else if (foldProgress > 0.7) {
      // F-scale: 0, 3, 6, 9
      return [
        { pos: xScaleF(0), label: '0' },
        { pos: xScaleF(3), label: '3' },
        { pos: xScaleF(6), label: '6' },
        { pos: xScaleF(9), label: '9' },
      ];
    } else {
      // Transitioning - interpolate positions
      const tTicks = [-3, -1.5, 0, 1.5, 3];
      const fTicks = [0, 2.25, 4.5, 6.75, 9];
      return fTicks.map((f, i) => {
        const tPos = xScaleT(tTicks[i]);
        const fPos = xScaleF(f);
        const pos = tPos + (fPos - tPos) * foldProgress;
        return { pos, label: foldProgress > 0.5 ? f.toFixed(1) : tTicks[i].toString() };
      });
    }
  };

  const axisTicks = getAxisTicks();

  return (
    <div className="viz-container">
      <svg
        width={vizWidth}
        height={vizHeight}
        viewBox={`0 0 ${vizWidth} ${vizHeight}`}
        style={{ display: 'block', margin: '0 auto' }}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Reference F-distribution (faded) - only show when folding */}
          {foldProgress > 0.1 && (
            <path
              d={fPath}
              fill="none"
              stroke="#2a9d8f"
              strokeWidth={2}
              strokeDasharray="4,3"
              opacity={0.4 + foldProgress * 0.4}
            />
          )}

          {/* Right half of t-distribution (positive t) - blue */}
          <path
            d={rightPath}
            fill="none"
            stroke="#4361ee"
            strokeWidth={2.5}
          />

          {/* Left half of t-distribution (negative t) - orange, this folds */}
          <path
            d={leftPath}
            fill="none"
            stroke="#f4a261"
            strokeWidth={2.5}
          />

          {/* X-axis */}
          <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="#adb5bd" strokeWidth={1} />

          {/* X-axis ticks and labels */}
          {axisTicks.map((tick, i) => (
            <g key={i} transform={`translate(${tick.pos}, ${plotHeight})`}>
              <line y1={0} y2={5} stroke="#adb5bd" />
              <text y={18} textAnchor="middle" fontSize={11} fill="#6c757d">
                {tick.label}
              </text>
            </g>
          ))}

          {/* Axis label */}
          <text
            x={plotWidth / 2}
            y={plotHeight + 35}
            textAnchor="middle"
            fontSize={12}
            fill="#6c757d"
          >
            {foldProgress < 0.3 ? 't' : foldProgress > 0.7 ? 'F = t²' : 't → F = t²'}
          </text>

          {/* Legend */}
          <g transform={`translate(${plotWidth - 120}, 5)`}>
            <line x1={0} y1={0} x2={20} y2={0} stroke="#4361ee" strokeWidth={2.5} />
            <text x={25} y={4} fontSize={10} fill="#6c757d">
              {foldProgress < 0.5 ? 'Positive t' : 'Right tail'}
            </text>
            <line x1={0} y1={15} x2={20} y2={15} stroke="#f4a261" strokeWidth={2.5} />
            <text x={25} y={19} fontSize={10} fill="#6c757d">
              {foldProgress < 0.5 ? 'Negative t' : 'Left tail (folded)'}
            </text>
            {foldProgress > 0.1 && (
              <>
                <line x1={0} y1={30} x2={20} y2={30} stroke="#2a9d8f" strokeWidth={2} strokeDasharray="4,3" />
                <text x={25} y={34} fontSize={10} fill="#6c757d">F(1, {df})</text>
              </>
            )}
          </g>

          {/* Annotation for folding */}
          {foldProgress > 0.1 && foldProgress < 0.9 && (
            <text
              x={plotWidth * 0.15}
              y={plotHeight / 2}
              fontSize={11}
              fill="#e63946"
              fontWeight={600}
            >
              ← folding
            </text>
          )}
        </g>
      </svg>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)', alignItems: 'center' }}>
        <button
          className="primary-button"
          onClick={handleToggle}
          disabled={isAnimating}
        >
          {foldProgress < 0.5 ? 'Fold: t² → F' : 'Unfold: F → t'}
        </button>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {foldProgress < 0.3
            ? 'Symmetric t-distribution'
            : foldProgress > 0.7
              ? 'Folded = F-distribution!'
              : 'Watch the left tail fold over...'}
        </span>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-md)' }}>
        Both tails of the t-distribution (at ±t) map to the same F value (t²).
        The <span style={{ color: '#f4a261', fontWeight: 600 }}>orange left tail</span> folds
        onto the <span style={{ color: '#4361ee', fontWeight: 600 }}>blue right tail</span>,
        and when combined they form the F-distribution.
      </p>
    </div>
  );
}

export default function TwoGroupANOVA() {
  const [sampleSize, setSampleSize] = useState(20);
  const [trials, setTrials] = useState<TrialResult[]>([]);
  const [currentData, setCurrentData] = useState<{
    group1: number[];
    group2: number[];
  } | null>(null);

  // Animation state for the folding visualization
  const [foldProgress, setFoldProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Population parameters (null is true: both groups have same mean)
  const populationMean = 100;
  const populationSD = 15;

  // Generate new data
  const generateData = useCallback(() => {
    const group1 = generateNormalSample(sampleSize, populationMean, populationSD);
    const group2 = generateNormalSample(sampleSize, populationMean, populationSD);
    setCurrentData({ group1, group2 });

    // Run both tests
    const tResult = welchTTest(group1, group2);
    const anovaResult = oneWayANOVA([group1, group2]);

    // Add to trials
    const newTrial: TrialResult = {
      id: trials.length + 1,
      t: tResult.t,
      tSquared: tResult.t * tResult.t,
      f: anovaResult.fStatistic,
    };
    setTrials((prev) => [newTrial, ...prev].slice(0, 10)); // Keep last 10
  }, [sampleSize, trials.length]);

  // Current statistics
  const currentStats = useMemo(() => {
    if (!currentData) return null;
    const tResult = welchTTest(currentData.group1, currentData.group2);
    const anovaResult = oneWayANOVA([currentData.group1, currentData.group2]);
    return {
      mean1: mean(currentData.group1),
      mean2: mean(currentData.group2),
      t: tResult.t,
      tSquared: tResult.t * tResult.t,
      f: anovaResult.fStatistic,
      pT: tResult.p,
      pF: anovaResult.pValue,
      dfT: tResult.df,
      dfBetween: anovaResult.dfBetween,
      dfWithin: anovaResult.dfWithin,
    };
  }, [currentData]);

  // SVG dimensions for distributions
  const width = 320;
  const height = 160;
  const margin = { top: 20, right: 20, bottom: 30, left: 30 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Generate t-distribution curve
  const tCurve = useMemo(() => {
    const df = currentStats?.dfT || 38;
    const points: { x: number; y: number }[] = [];
    const tMin = -4;
    const tMax = 4;
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const x = tMin + (i / steps) * (tMax - tMin);
      const y = tDistributionPDF(x, df);
      points.push({ x, y });
    }

    const maxY = Math.max(...points.map((p) => p.y));
    const xScale = (x: number) => ((x - tMin) / (tMax - tMin)) * plotWidth;
    const yScale = (y: number) => plotHeight - (y / maxY) * plotHeight * 0.9;

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`)
      .join(' ');

    return { pathD, xScale, yScale, tMin, tMax, df };
  }, [currentStats?.dfT, plotWidth, plotHeight]);

  // Generate F-distribution curve
  const fCurve = useMemo(() => {
    const df1 = currentStats?.dfBetween || 1;
    const df2 = currentStats?.dfWithin || 38;
    const points: { x: number; y: number }[] = [];
    const fMin = 0;
    const fMax = 8;
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const x = fMin + (i / steps) * (fMax - fMin);
      const y = fDistributionPDF(x, df1, df2);
      points.push({ x, y });
    }

    const maxY = Math.max(...points.map((p) => p.y));
    const xScale = (x: number) => ((x - fMin) / (fMax - fMin)) * plotWidth;
    const yScale = (y: number) => plotHeight - (y / maxY) * plotHeight * 0.9;

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`)
      .join(' ');

    return { pathD, xScale, yScale, fMin, fMax, df1, df2 };
  }, [currentStats?.dfBetween, currentStats?.dfWithin, plotWidth, plotHeight]);

  // Dot plot dimensions
  const dotPlotWidth = 280;
  const dotPlotHeight = 180;
  const dotMargin = { top: 10, right: 20, bottom: 30, left: 40 };
  const dotPlotInnerWidth = dotPlotWidth - dotMargin.left - dotMargin.right;
  const dotPlotInnerHeight = dotPlotHeight - dotMargin.top - dotMargin.bottom;

  // Dot plot visualization
  const dotPlotData = useMemo(() => {
    if (!currentData) return null;

    const allData = [...currentData.group1, ...currentData.group2];
    const dataMin = Math.min(...allData);
    const dataMax = Math.max(...allData);
    const padding = (dataMax - dataMin) * 0.1;
    const yMin = dataMin - padding;
    const yMax = dataMax + padding;

    const yScale = (y: number) =>
      dotPlotInnerHeight - ((y - yMin) / (yMax - yMin)) * dotPlotInnerHeight;

    // Add jitter to x positions
    const jitter = () => (Math.random() - 0.5) * 30;

    return {
      group1Points: currentData.group1.map((v) => ({
        y: yScale(v),
        x: dotPlotInnerWidth / 4 + jitter(),
        value: v,
      })),
      group2Points: currentData.group2.map((v) => ({
        y: yScale(v),
        x: (3 * dotPlotInnerWidth) / 4 + jitter(),
        value: v,
      })),
      mean1Y: yScale(mean(currentData.group1)),
      mean2Y: yScale(mean(currentData.group2)),
      yMin,
      yMax,
      yScale,
    };
  }, [currentData, dotPlotInnerWidth, dotPlotInnerHeight]);

  return (
    <div className="section-intro">
      <h2>Two Groups: The t² = F Connection</h2>

      <p className="intro-text">
        Before exploring ANOVA with multiple groups, let's establish a crucial connection:
        when comparing exactly <strong>two groups</strong>, ANOVA and the t-test give
        equivalent results. In fact, the relationship is exact:
      </p>

      <div className="formula-box">
        <h3>The Fundamental Relationship</h3>
        <div className="formula">
          <span className="formula-main">F = t²</span>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 'var(--spacing-md)' }}>
          For two groups, the F-statistic is always exactly equal to the t-statistic squared
        </p>
      </div>

      <h3>The Squaring Transformation</h3>

      <p className="intro-text">
        Why does squaring a t-value produce an F-value? Because the F-distribution with df₁=1
        is literally what you get when you square values from a t-distribution.
        Squaring removes the sign, so both t = -2 and t = +2 become F = 4.
      </p>

      <FoldingTransformationViz
        foldProgress={foldProgress}
        isAnimating={isAnimating}
        setFoldProgress={setFoldProgress}
        setIsAnimating={setIsAnimating}
      />

      <div className="key-insight">
        <h4>Why This Matters</h4>
        <p>
          The F = t² relationship shows that ANOVA isn't a completely new test—it's a
          generalization. For two groups, it gives you the exact same result as a t-test.
          But unlike the t-test, ANOVA can extend to 3, 4, or any number of groups
          while maintaining proper error control.
        </p>
      </div>

      <p className="intro-text">
        Now that we've established this connection, let's dive into what ANOVA is actually
        doing under the hood: <strong>partitioning variance</strong>.
      </p>
    </div>
  );
}
