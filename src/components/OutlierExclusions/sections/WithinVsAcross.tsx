import { useMemo } from 'react';
import {
  getWithinThresholds,
  getAcrossThresholds,
  computeIQR,
} from '../../../utils/statistics';

export default function WithinVsAcross() {
  // Pre-generated dataset designed to show clear difference between methods
  // Group A has a tighter distribution, Group B has more spread
  // Key insight: value 38 is an outlier in Group A with within-condition
  // but NOT an outlier when using across-condition thresholds
  const { group1, group2, withinThresholds, acrossThresholds, withinOutliers, acrossOutliers } = useMemo(() => {
    // Group A (Control): Tighter distribution with one "outlier" at 38
    // IQR will be small, making 38 look extreme
    const control = [20, 21, 22, 22, 23, 23, 24, 24, 24, 25, 25, 26, 27, 28, 38];

    // Group B (Treatment): Wider distribution - values spread more
    // IQR will be larger, 38 wouldn't be an outlier here
    const treatment = [15, 18, 20, 22, 24, 25, 26, 27, 28, 30, 32, 34, 36, 38, 42];

    const withinThresh = getWithinThresholds(control, treatment, 'iqr', 1.5);
    const acrossThresh = getAcrossThresholds(control, treatment, 'iqr', 1.5);

    // Manually identify outliers for each method to ensure correctness
    const identifyOutliers = (data: number[], lower: number, upper: number) => {
      return data
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => v < lower || v > upper)
        .map(({ i }) => i);
    };

    const withinOut1 = identifyOutliers(control, withinThresh.group1.lower, withinThresh.group1.upper);
    const withinOut2 = identifyOutliers(treatment, withinThresh.group2.lower, withinThresh.group2.upper);
    const acrossOut1 = identifyOutliers(control, acrossThresh.lower, acrossThresh.upper);
    const acrossOut2 = identifyOutliers(treatment, acrossThresh.lower, acrossThresh.upper);

    return {
      group1: control,
      group2: treatment,
      withinThresholds: withinThresh,
      acrossThresholds: acrossThresh,
      withinOutliers: [withinOut1, withinOut2] as [number[], number[]],
      acrossOutliers: [acrossOut1, acrossOut2] as [number[], number[]],
      group1IQR: computeIQR(control),
      group2IQR: computeIQR(treatment),
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
    control: plotHeight * 0.3,
    treatment: plotHeight * 0.7,
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
              y={yPositions.control}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Control
            </text>
            <text
              x={-10}
              y={yPositions.treatment}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Treatment
            </text>

            {/* Control group threshold */}
            <rect
              x={xScale(withinThresholds.group1.lower)}
              y={yPositions.control - 15}
              width={xScale(withinThresholds.group1.upper) - xScale(withinThresholds.group1.lower)}
              height={30}
              fill="var(--accent)"
              opacity={0.1}
              rx={4}
            />
            <line
              x1={xScale(withinThresholds.group1.lower)}
              y1={yPositions.control - 20}
              x2={xScale(withinThresholds.group1.lower)}
              y2={yPositions.control + 20}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <line
              x1={xScale(withinThresholds.group1.upper)}
              y1={yPositions.control - 20}
              x2={xScale(withinThresholds.group1.upper)}
              y2={yPositions.control + 20}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />

            {/* Treatment group threshold */}
            <rect
              x={xScale(withinThresholds.group2.lower)}
              y={yPositions.treatment - 15}
              width={xScale(withinThresholds.group2.upper) - xScale(withinThresholds.group2.lower)}
              height={30}
              fill="var(--accent)"
              opacity={0.1}
              rx={4}
            />
            <line
              x1={xScale(withinThresholds.group2.lower)}
              y1={yPositions.treatment - 20}
              x2={xScale(withinThresholds.group2.lower)}
              y2={yPositions.treatment + 20}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <line
              x1={xScale(withinThresholds.group2.upper)}
              y1={yPositions.treatment - 20}
              x2={xScale(withinThresholds.group2.upper)}
              y2={yPositions.treatment + 20}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />

            {/* Data points - Control */}
            {group1.map((value, i) => {
              const isOutlier = withinOutliers[0].includes(i);
              return (
                <circle
                  key={`c-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.control}
                  r={isOutlier ? 8 : 6}
                  fill={isOutlier ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isOutlier ? 1 : 0.7}
                />
              );
            })}

            {/* Data points - Treatment */}
            {group2.map((value, i) => {
              const isOutlier = withinOutliers[1].includes(i);
              return (
                <circle
                  key={`t-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.treatment}
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
          Each condition has its own threshold (dashed lines). Outliers: Control = {withinOutliers[0].length}, Treatment = {withinOutliers[1].length}
        </p>
      </div>

      <div className="outlier-viz-container">
        <h4 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
          Across-Condition Thresholds
        </h4>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Group labels */}
            <text
              x={-10}
              y={yPositions.control}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Control
            </text>
            <text
              x={-10}
              y={yPositions.treatment}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
            >
              Treatment
            </text>

            {/* Shared threshold - spans both groups */}
            <rect
              x={xScale(acrossThresholds.lower)}
              y={yPositions.control - 15}
              width={xScale(acrossThresholds.upper) - xScale(acrossThresholds.lower)}
              height={yPositions.treatment - yPositions.control + 30}
              fill="var(--primary)"
              opacity={0.1}
              rx={4}
            />
            <line
              x1={xScale(acrossThresholds.lower)}
              y1={yPositions.control - 25}
              x2={xScale(acrossThresholds.lower)}
              y2={yPositions.treatment + 25}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <line
              x1={xScale(acrossThresholds.upper)}
              y1={yPositions.control - 25}
              x2={xScale(acrossThresholds.upper)}
              y2={yPositions.treatment + 25}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />

            {/* Data points - Control */}
            {group1.map((value, i) => {
              const isOutlier = acrossOutliers[0].includes(i);
              return (
                <circle
                  key={`c-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.control}
                  r={isOutlier ? 8 : 6}
                  fill={isOutlier ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isOutlier ? 1 : 0.7}
                />
              );
            })}

            {/* Data points - Treatment */}
            {group2.map((value, i) => {
              const isOutlier = acrossOutliers[1].includes(i);
              return (
                <circle
                  key={`t-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.treatment}
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
          Same threshold for both conditions (dashed lines). Outliers: Control = {acrossOutliers[0].length}, Treatment = {acrossOutliers[1].length}
        </p>
      </div>
    </div>
  );
}
