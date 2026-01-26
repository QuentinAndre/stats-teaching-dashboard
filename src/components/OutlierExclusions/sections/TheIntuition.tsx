import { useState, useMemo } from 'react';
import { mean, standardDeviation, welchTTest } from '../../../utils/statistics';

export default function TheIntuition() {
  const [threshold, setThreshold] = useState(2.5);

  // Dataset designed to show the core problem:
  // - Both groups contain the SAME extreme values (35 and 65)
  // - Group A has a slightly lower mean (~49), so 65 is farther from its mean
  // - Group B has a slightly higher mean (~52), so 35 is farther from its mean
  // The same values are treated differently based on group membership!
  // Groups are similar enough that p > .05 at baseline
  const { group1, group2 } = useMemo(() => {
    // Group A: Slightly lower mean cluster plus shared extreme values
    const g1 = [35, 43, 45, 47, 48, 49, 50, 51, 53, 65];
    // Group B: Slightly higher mean cluster plus shared extreme values
    const g2 = [35, 47, 49, 51, 52, 53, 54, 55, 57, 65];
    return { group1: g1, group2: g2 };
  }, []);

  // Compute which points are excluded at current threshold
  const analysis = useMemo(() => {
    const mean1 = mean(group1);
    const mean2 = mean(group2);
    const sd1 = standardDeviation(group1, false);
    const sd2 = standardDeviation(group2, false);

    // Find excluded points (within-condition)
    const excluded1 = group1.map((v) => Math.abs(v - mean1) / sd1 > threshold);
    const excluded2 = group2.map((v) => Math.abs(v - mean2) / sd2 > threshold);

    // Compute means after exclusion
    const kept1 = group1.filter((_, i) => !excluded1[i]);
    const kept2 = group2.filter((_, i) => !excluded2[i]);

    const meanAfter1 = kept1.length > 0 ? mean(kept1) : mean1;
    const meanAfter2 = kept2.length > 0 ? mean(kept2) : mean2;

    // T-tests
    const originalTest = welchTTest(group1, group2);
    const afterTest = kept1.length > 1 && kept2.length > 1
      ? welchTTest(kept1, kept2)
      : { t: 0, p: 1 };

    // Thresholds for visualization
    const lower1 = mean1 - threshold * sd1;
    const upper1 = mean1 + threshold * sd1;
    const lower2 = mean2 - threshold * sd2;
    const upper2 = mean2 + threshold * sd2;

    return {
      mean1,
      mean2,
      sd1,
      sd2,
      excluded1,
      excluded2,
      meanAfter1,
      meanAfter2,
      lower1,
      upper1,
      lower2,
      upper2,
      excludedCount1: excluded1.filter(Boolean).length,
      excludedCount2: excluded2.filter(Boolean).length,
      keptCount1: kept1.length,
      keptCount2: kept2.length,
      originalTest,
      afterTest,
      originalDiff: Math.abs(mean1 - mean2),
      afterDiff: Math.abs(meanAfter1 - meanAfter2),
    };
  }, [group1, group2, threshold]);

  // Chart dimensions
  const width = 700;
  const height = 280;
  const margin = { top: 40, right: 30, bottom: 50, left: 100 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const allData = [...group1, ...group2];
  const xMin = Math.min(...allData) - 5;
  const xMax = Math.max(...allData) + 5;
  const xScale = (v: number) => ((v - xMin) / (xMax - xMin)) * plotWidth;

  const yPositions = {
    group1: plotHeight * 0.3,
    group2: plotHeight * 0.7,
  };

  return (
    <div className="section-intro">
      <h2>Why Does It Matter?</h2>

      <p className="intro-text">
        Both groups are sampled from the same distribution. By chance, Group A
        has a slightly lower mean, and Group B has a slightly higher mean.
      </p>

      <p style={{ marginTop: 'var(--spacing-md)' }}>
        When we apply within-condition exclusion, each group's exclusion threshold
        is based on the sample mean. As a consequence, the high values in Group A
        become outliers, while the high values in Group B do not. Conversely, the
        low values in Group B become outliers, but the low values in Group A do not.
        After exclusion, the groups diverge further.
      </p>

      <div className="outlier-viz-container">
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
            Exclusion Threshold: {threshold.toFixed(1)} SD from mean
          </label>
          <input
            type="range"
            min="0.3"
            max="3"
            step="0.1"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div className="speed-labels">
            <span>0.3 SD</span>
            <span>3.0 SD</span>
          </div>
        </div>

        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Group labels */}
            <text
              x={-10}
              y={yPositions.group1}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
              fontWeight={500}
            >
              Group A
            </text>
            <text
              x={-10}
              y={yPositions.group2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
              fontWeight={500}
            >
              Group B
            </text>

            {/* Threshold bands */}
            <rect
              x={xScale(analysis.lower1)}
              y={yPositions.group1 - 18}
              width={Math.max(0, xScale(analysis.upper1) - xScale(analysis.lower1))}
              height={36}
              fill="var(--accent)"
              opacity={0.1}
              rx={4}
            />
            <rect
              x={xScale(analysis.lower2)}
              y={yPositions.group2 - 18}
              width={Math.max(0, xScale(analysis.upper2) - xScale(analysis.lower2))}
              height={36}
              fill="var(--accent)"
              opacity={0.1}
              rx={4}
            />

            {/* Original means (thin lines) */}
            <line
              x1={xScale(analysis.mean1)}
              y1={yPositions.group1 - 25}
              x2={xScale(analysis.mean1)}
              y2={yPositions.group1 + 25}
              stroke="var(--text-secondary)"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <line
              x1={xScale(analysis.mean2)}
              y1={yPositions.group2 - 25}
              x2={xScale(analysis.mean2)}
              y2={yPositions.group2 + 25}
              stroke="var(--text-secondary)"
              strokeWidth={1}
              strokeDasharray="3,3"
            />

            {/* Means after exclusion (thick lines) */}
            <line
              x1={xScale(analysis.meanAfter1)}
              y1={yPositions.group1 - 25}
              x2={xScale(analysis.meanAfter1)}
              y2={yPositions.group1 + 25}
              stroke="var(--primary)"
              strokeWidth={3}
            />
            <line
              x1={xScale(analysis.meanAfter2)}
              y1={yPositions.group2 - 25}
              x2={xScale(analysis.meanAfter2)}
              y2={yPositions.group2 + 25}
              stroke="var(--primary)"
              strokeWidth={3}
            />

            {/* Data points - Group 1 */}
            {group1.map((value, i) => {
              const isExcluded = analysis.excluded1[i];
              return (
                <circle
                  key={`g1-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.group1}
                  r={6}
                  fill={isExcluded ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isExcluded ? 0.25 : 0.8}
                  style={{ transition: 'opacity 0.2s ease, fill 0.2s ease' }}
                />
              );
            })}

            {/* Data points - Group 2 */}
            {group2.map((value, i) => {
              const isExcluded = analysis.excluded2[i];
              return (
                <circle
                  key={`g2-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.group2}
                  r={6}
                  fill={isExcluded ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isExcluded ? 0.25 : 0.8}
                  style={{ transition: 'opacity 0.2s ease, fill 0.2s ease' }}
                />
              );
            })}

            {/* X-axis */}
            <line
              x1={0}
              y1={plotHeight}
              x2={plotWidth}
              y2={plotHeight}
              stroke="var(--border)"
            />
            <text
              x={plotWidth / 2}
              y={plotHeight + 30}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-secondary)"
            >
              Value
            </text>

            {/* Legend - spaced out */}
            <g transform={`translate(${plotWidth / 2 - 180}, -25)`}>
              <line x1={0} y1={0} x2={15} y2={0} stroke="var(--text-secondary)" strokeWidth={1} strokeDasharray="3,3" />
              <text x={20} y={4} fontSize={10} fill="var(--text-secondary)">Original mean</text>
              <line x1={160} y1={0} x2={175} y2={0} stroke="var(--primary)" strokeWidth={3} />
              <text x={180} y={4} fontSize={10} fill="var(--text-secondary)">Mean after exclusion</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="simulation-results">
        <div className="result-card">
          <div className="result-label">Mean Difference</div>
          <div
            className="result-value"
            style={{
              color: analysis.afterDiff > analysis.originalDiff + 1
                ? 'var(--accent)'
                : 'var(--text-primary)'
            }}
          >
            {analysis.afterDiff.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Original: {analysis.originalDiff.toFixed(2)}
          </div>
        </div>
        <div className="result-card">
          <div className="result-label">t-statistic</div>
          <div
            className="result-value"
            style={{
              color: Math.abs(analysis.afterTest.t) > Math.abs(analysis.originalTest.t) + 0.5
                ? 'var(--accent)'
                : 'var(--text-primary)'
            }}
          >
            {analysis.afterTest.t.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Original: {analysis.originalTest.t.toFixed(2)}
          </div>
        </div>
        <div className="result-card">
          <div className="result-label">p-value</div>
          <div
            className={`result-value ${analysis.afterTest.p < 0.05 ? 'significant' : 'not-significant'}`}
          >
            {analysis.afterTest.p < 0.001 ? '< .001' : analysis.afterTest.p.toFixed(3)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Original: {analysis.originalTest.p < 0.001 ? '< .001' : analysis.originalTest.p.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
}
