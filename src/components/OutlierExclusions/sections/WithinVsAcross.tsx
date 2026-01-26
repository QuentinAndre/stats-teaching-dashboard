import { useMemo } from 'react';
import { mean, standardDeviation } from '../../../utils/statistics';

export default function WithinVsAcross() {
  // Same dataset as "Why Does It Matter?" section
  // Both groups contain the SAME extreme values (35 and 65)
  // Group A has a slightly lower mean (~49), so 65 is farther from its mean
  // Group B has a slightly higher mean (~52), so 35 is farther from its mean
  const { group1, group2, withinThresholds, acrossThresholds, withinOutliers, acrossOutliers } = useMemo(() => {
    // Group A: Slightly lower mean cluster plus shared extreme values
    const groupA = [35, 43, 45, 47, 48, 49, 50, 51, 53, 65];
    // Group B: Slightly higher mean cluster plus shared extreme values
    const groupB = [35, 47, 49, 51, 52, 53, 54, 55, 57, 65];

    const threshold = 2; // ±2 SD

    // Within-condition: each group gets its own thresholds
    const mean1 = mean(groupA);
    const mean2 = mean(groupB);
    const sd1 = standardDeviation(groupA, false);
    const sd2 = standardDeviation(groupB, false);

    const withinThresh = {
      group1: { lower: mean1 - threshold * sd1, upper: mean1 + threshold * sd1 },
      group2: { lower: mean2 - threshold * sd2, upper: mean2 + threshold * sd2 },
    };

    // Across-conditions: combine all data for single threshold
    const combined = [...groupA, ...groupB];
    const meanAll = mean(combined);
    const sdAll = standardDeviation(combined, false);
    const acrossThresh = {
      lower: meanAll - threshold * sdAll,
      upper: meanAll + threshold * sdAll,
    };

    // Identify outliers for each method
    const identifyOutliers = (data: number[], lower: number, upper: number) => {
      return data
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => v < lower || v > upper)
        .map(({ i }) => i);
    };

    const withinOut1 = identifyOutliers(groupA, withinThresh.group1.lower, withinThresh.group1.upper);
    const withinOut2 = identifyOutliers(groupB, withinThresh.group2.lower, withinThresh.group2.upper);
    const acrossOut1 = identifyOutliers(groupA, acrossThresh.lower, acrossThresh.upper);
    const acrossOut2 = identifyOutliers(groupB, acrossThresh.lower, acrossThresh.upper);

    return {
      group1: groupA,
      group2: groupB,
      withinThresholds: withinThresh,
      acrossThresholds: acrossThresh,
      withinOutliers: [withinOut1, withinOut2] as [number[], number[]],
      acrossOutliers: [acrossOut1, acrossOut2] as [number[], number[]],
    };
  }, []);

  const width = 700;
  const height = 200;
  const margin = { top: 30, right: 30, bottom: 40, left: 100 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const allData = [...group1, ...group2];
  const xMin = Math.min(...allData) - 5;
  const xMax = Math.max(...allData) + 5;
  const xScale = (v: number) => ((v - xMin) / (xMax - xMin)) * plotWidth;

  const yPositions = {
    groupA: plotHeight * 0.3,
    groupB: plotHeight * 0.7,
  };

  return (
    <div className="section-intro">
      <h2>Two Approaches to Outlier Exclusion</h2>

      <p className="intro-text">
        When you have multiple experimental conditions, you face a choice:
        compute outlier thresholds <strong>within each condition separately</strong>,
        or <strong>across all conditions combined</strong>.
      </p>

      <div className="outlier-viz-container">
        <h4 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
          Within-Condition Thresholds
        </h4>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Group labels */}
            <text
              x={-10}
              y={yPositions.groupA}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Group A
            </text>
            <text
              x={-10}
              y={yPositions.groupB}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Group B
            </text>

            {/* Group A group threshold */}
            <rect
              x={xScale(withinThresholds.group1.lower)}
              y={yPositions.groupA - 15}
              width={xScale(withinThresholds.group1.upper) - xScale(withinThresholds.group1.lower)}
              height={30}
              fill="var(--accent)"
              opacity={0.1}
              rx={4}
            />
            <line
              x1={xScale(withinThresholds.group1.lower)}
              y1={yPositions.groupA - 20}
              x2={xScale(withinThresholds.group1.lower)}
              y2={yPositions.groupA + 20}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <line
              x1={xScale(withinThresholds.group1.upper)}
              y1={yPositions.groupA - 20}
              x2={xScale(withinThresholds.group1.upper)}
              y2={yPositions.groupA + 20}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />

            {/* Group B group threshold */}
            <rect
              x={xScale(withinThresholds.group2.lower)}
              y={yPositions.groupB - 15}
              width={xScale(withinThresholds.group2.upper) - xScale(withinThresholds.group2.lower)}
              height={30}
              fill="var(--accent)"
              opacity={0.1}
              rx={4}
            />
            <line
              x1={xScale(withinThresholds.group2.lower)}
              y1={yPositions.groupB - 20}
              x2={xScale(withinThresholds.group2.lower)}
              y2={yPositions.groupB + 20}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <line
              x1={xScale(withinThresholds.group2.upper)}
              y1={yPositions.groupB - 20}
              x2={xScale(withinThresholds.group2.upper)}
              y2={yPositions.groupB + 20}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />

            {/* Data points - Group A */}
            {group1.map((value, i) => {
              const isOutlier = withinOutliers[0].includes(i);
              return (
                <circle
                  key={`c-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.groupA}
                  r={isOutlier ? 8 : 6}
                  fill={isOutlier ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isOutlier ? 1 : 0.7}
                />
              );
            })}

            {/* Data points - Group B */}
            {group2.map((value, i) => {
              const isOutlier = withinOutliers[1].includes(i);
              return (
                <circle
                  key={`t-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.groupB}
                  r={isOutlier ? 8 : 6}
                  fill={isOutlier ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isOutlier ? 1 : 0.7}
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
          </g>
        </svg>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Each condition has its own threshold (dashed lines). Outliers: Group A = {withinOutliers[0].length}, Group B = {withinOutliers[1].length}
        </p>
      </div>

      <div className="outlier-viz-container">
        <h4 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
          Across-Conditions Thresholds
        </h4>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Group labels */}
            <text
              x={-10}
              y={yPositions.groupA}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Group A
            </text>
            <text
              x={-10}
              y={yPositions.groupB}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Group B
            </text>

            {/* Shared threshold - spans both groups */}
            <rect
              x={xScale(acrossThresholds.lower)}
              y={yPositions.groupA - 15}
              width={xScale(acrossThresholds.upper) - xScale(acrossThresholds.lower)}
              height={yPositions.groupB - yPositions.groupA + 30}
              fill="var(--primary)"
              opacity={0.1}
              rx={4}
            />
            <line
              x1={xScale(acrossThresholds.lower)}
              y1={yPositions.groupA - 25}
              x2={xScale(acrossThresholds.lower)}
              y2={yPositions.groupB + 25}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <line
              x1={xScale(acrossThresholds.upper)}
              y1={yPositions.groupA - 25}
              x2={xScale(acrossThresholds.upper)}
              y2={yPositions.groupB + 25}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />

            {/* Data points - Group A */}
            {group1.map((value, i) => {
              const isOutlier = acrossOutliers[0].includes(i);
              return (
                <circle
                  key={`c-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.groupA}
                  r={isOutlier ? 8 : 6}
                  fill={isOutlier ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isOutlier ? 1 : 0.7}
                />
              );
            })}

            {/* Data points - Group B */}
            {group2.map((value, i) => {
              const isOutlier = acrossOutliers[1].includes(i);
              return (
                <circle
                  key={`t-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.groupB}
                  r={isOutlier ? 8 : 6}
                  fill={isOutlier ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isOutlier ? 1 : 0.7}
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
          </g>
        </svg>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Same threshold for both conditions (dashed lines). Outliers: Group A = {acrossOutliers[0].length}, Group B = {acrossOutliers[1].length}
        </p>
      </div>
    </div>
  );
}
