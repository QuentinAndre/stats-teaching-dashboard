import { useState, useMemo, useCallback } from 'react';
import {
  generateNormalSample,
  welchTTest,
  mean,
  standardDeviation,
  removeAtIndices,
} from '../../../utils/statistics';

type ExclusionMethod = 'none' | 'within' | 'across';

export default function InteractiveDemo() {
  const [method, setMethod] = useState<ExclusionMethod>('none');
  const [seed, setSeed] = useState(0);

  // Generate two groups from the SAME distribution (null is true)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- seed triggers regeneration
  const { group1, group2 } = useMemo(() => {
    // Use seed to regenerate data (seed changes trigger re-computation)
    void seed; // Reference seed to make intent clear
    const g1 = generateNormalSample(25, 50, 10);
    const g2 = generateNormalSample(25, 50, 10); // Same mean - null is true
    return { group1: g1, group2: g2 };
  }, [seed]);

  // Compute thresholds and outliers for each method using ±1.5 SD
  const analysis = useMemo(() => {
    const threshold = 1.5; // ±1.5 SD from mean

    // Within-condition: each group gets its own thresholds based on its mean/SD
    const mean1 = mean(group1);
    const mean2 = mean(group2);
    const sd1 = standardDeviation(group1, false);
    const sd2 = standardDeviation(group2, false);

    const withinThresh = {
      group1: { lower: mean1 - threshold * sd1, upper: mean1 + threshold * sd1 },
      group2: { lower: mean2 - threshold * sd2, upper: mean2 + threshold * sd2 },
    };

    // Across-conditions: combine all data for single threshold
    const combined = [...group1, ...group2];
    const meanAll = mean(combined);
    const sdAll = standardDeviation(combined, false);
    const acrossThresh = {
      lower: meanAll - threshold * sdAll,
      upper: meanAll + threshold * sdAll,
    };

    // Identify outliers for within-condition
    const withinOut1 = group1
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v < withinThresh.group1.lower || v > withinThresh.group1.upper)
      .map(({ i }) => i);
    const withinOut2 = group2
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v < withinThresh.group2.lower || v > withinThresh.group2.upper)
      .map(({ i }) => i);

    // Identify outliers for across-conditions
    const acrossOut1 = group1
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v < acrossThresh.lower || v > acrossThresh.upper)
      .map(({ i }) => i);
    const acrossOut2 = group2
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v < acrossThresh.lower || v > acrossThresh.upper)
      .map(({ i }) => i);

    // Compute t-tests for each scenario
    const noExclusionTest = welchTTest(group1, group2);

    const withinFiltered1 = removeAtIndices(group1, withinOut1);
    const withinFiltered2 = removeAtIndices(group2, withinOut2);
    const withinTest = welchTTest(withinFiltered1, withinFiltered2);

    const acrossFiltered1 = removeAtIndices(group1, acrossOut1);
    const acrossFiltered2 = removeAtIndices(group2, acrossOut2);
    const acrossTest = welchTTest(acrossFiltered1, acrossFiltered2);

    return {
      withinThresholds: withinThresh,
      acrossThresholds: { group1: acrossThresh, group2: acrossThresh },
      withinOutliers: [withinOut1, withinOut2] as [number[], number[]],
      acrossOutliers: [acrossOut1, acrossOut2] as [number[], number[]],
      tests: {
        none: noExclusionTest,
        within: withinTest,
        across: acrossTest,
      },
      means: {
        none: { g1: mean(group1), g2: mean(group2) },
        within: { g1: mean(withinFiltered1), g2: mean(withinFiltered2) },
        across: { g1: mean(acrossFiltered1), g2: mean(acrossFiltered2) },
      },
      filtered: {
        within: { g1: withinFiltered1, g2: withinFiltered2 },
        across: { g1: acrossFiltered1, g2: acrossFiltered2 },
      },
    };
  }, [group1, group2]);

  const handleNewData = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  // Get current analysis based on selected method
  const currentOutliers =
    method === 'within'
      ? analysis.withinOutliers
      : method === 'across'
      ? analysis.acrossOutliers
      : [[], []] as [number[], number[]];

  const currentThresholds =
    method === 'within'
      ? analysis.withinThresholds
      : method === 'across'
      ? analysis.acrossThresholds
      : null;

  const currentTest = analysis.tests[method];
  const currentMeans = analysis.means[method];

  // Visualization dimensions
  const width = 700;
  const height = 280;
  const margin = { top: 40, right: 30, bottom: 50, left: 100 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const allData = [...group1, ...group2];
  const xMin = Math.min(...allData) - 10;
  const xMax = Math.max(...allData) + 10;
  const xScale = (v: number) => ((v - xMin) / (xMax - xMin)) * plotWidth;

  const yPositions = {
    control: plotHeight * 0.3,
    treatment: plotHeight * 0.7,
  };

  return (
    <div className="section-intro">
      <h2>Interactive Demonstration</h2>

      <p className="intro-text">
        Both groups below are drawn from <strong>the same population</strong> (mean = 50, SD = 10).
        There is no true difference between them. Toggle between exclusion methods
        to see how they affect the results. For the sake of illustration, we are going
        to exclude all observations further than 1.5 SD from the mean.
      </p>

      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
        <button className="primary-button" onClick={handleNewData}>
          Generate New Data
        </button>
      </div>

      <div className="method-toggle">
        <button
          className={`method-button ${method === 'none' ? 'active' : ''}`}
          onClick={() => setMethod('none')}
        >
          No Exclusion
        </button>
        <button
          className={`method-button within ${method === 'within' ? 'active' : ''}`}
          onClick={() => setMethod('within')}
        >
          Within-Condition
        </button>
        <button
          className={`method-button ${method === 'across' ? 'active' : ''}`}
          onClick={() => setMethod('across')}
        >
          Across-Conditions
        </button>
      </div>

      <div className="outlier-viz-container">
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
              fontWeight={500}
            >
              Group A
            </text>
            <text
              x={-10}
              y={yPositions.treatment}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--text-primary)"
              fontWeight={500}
            >
              Group B
            </text>

            {/* Threshold visualization */}
            {currentThresholds && (
              <>
                {/* Group 1 threshold */}
                <line
                  x1={xScale(currentThresholds.group1.lower)}
                  y1={method === 'across' ? yPositions.control - 25 : yPositions.control - 20}
                  x2={xScale(currentThresholds.group1.lower)}
                  y2={method === 'across' ? yPositions.treatment + 25 : yPositions.control + 20}
                  stroke={method === 'within' ? 'var(--accent)' : 'var(--primary)'}
                  strokeWidth={2}
                  strokeDasharray="4,4"
                />
                <line
                  x1={xScale(currentThresholds.group1.upper)}
                  y1={method === 'across' ? yPositions.control - 25 : yPositions.control - 20}
                  x2={xScale(currentThresholds.group1.upper)}
                  y2={method === 'across' ? yPositions.treatment + 25 : yPositions.control + 20}
                  stroke={method === 'within' ? 'var(--accent)' : 'var(--primary)'}
                  strokeWidth={2}
                  strokeDasharray="4,4"
                />

                {/* Group 2 threshold (only if within-condition) */}
                {method === 'within' && (
                  <>
                    <line
                      x1={xScale(currentThresholds.group2.lower)}
                      y1={yPositions.treatment - 20}
                      x2={xScale(currentThresholds.group2.lower)}
                      y2={yPositions.treatment + 20}
                      stroke="var(--accent)"
                      strokeWidth={2}
                      strokeDasharray="4,4"
                    />
                    <line
                      x1={xScale(currentThresholds.group2.upper)}
                      y1={yPositions.treatment - 20}
                      x2={xScale(currentThresholds.group2.upper)}
                      y2={yPositions.treatment + 20}
                      stroke="var(--accent)"
                      strokeWidth={2}
                      strokeDasharray="4,4"
                    />
                  </>
                )}
              </>
            )}

            {/* Mean lines */}
            <line
              x1={xScale(currentMeans.g1)}
              y1={yPositions.control - 25}
              x2={xScale(currentMeans.g1)}
              y2={yPositions.control + 25}
              stroke="var(--text-primary)"
              strokeWidth={3}
              opacity={0.8}
            />
            <line
              x1={xScale(currentMeans.g2)}
              y1={yPositions.treatment - 25}
              x2={xScale(currentMeans.g2)}
              y2={yPositions.treatment + 25}
              stroke="var(--text-primary)"
              strokeWidth={3}
              opacity={0.8}
            />

            {/* Data points - Group 1 */}
            {group1.map((value, i) => {
              const isOutlier = currentOutliers[0].includes(i);
              const isExcluded = method !== 'none' && isOutlier;
              return (
                <circle
                  key={`g1-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.control}
                  r={isOutlier ? 8 : 6}
                  fill={isOutlier ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isExcluded ? 0.2 : 0.7}
                  style={{ transition: 'opacity 0.3s ease, r 0.3s ease' }}
                />
              );
            })}

            {/* Data points - Group 2 */}
            {group2.map((value, i) => {
              const isOutlier = currentOutliers[1].includes(i);
              const isExcluded = method !== 'none' && isOutlier;
              return (
                <circle
                  key={`g2-${i}`}
                  cx={xScale(value)}
                  cy={yPositions.treatment}
                  r={isOutlier ? 8 : 6}
                  fill={isOutlier ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isExcluded ? 0.2 : 0.7}
                  style={{ transition: 'opacity 0.3s ease, r 0.3s ease' }}
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

            {/* Legend */}
            <g transform={`translate(${plotWidth - 150}, -25)`}>
              <line x1={0} y1={0} x2={20} y2={0} stroke="var(--text-primary)" strokeWidth={3} />
              <text x={25} y={4} fontSize={10} fill="var(--text-secondary)">
                Group mean
              </text>
            </g>
          </g>
        </svg>
      </div>

      <div className="simulation-results">
        <div className="result-card">
          <div className="result-label">Group A Mean</div>
          <div className="result-value">{currentMeans.g1.toFixed(2)}</div>
        </div>
        <div className="result-card">
          <div className="result-label">Group B Mean</div>
          <div className="result-value">{currentMeans.g2.toFixed(2)}</div>
        </div>
        <div className="result-card">
          <div className="result-label">Mean Difference</div>
          <div className="result-value">
            {Math.abs(currentMeans.g1 - currentMeans.g2).toFixed(2)}
          </div>
        </div>
        <div className="result-card">
          <div className="result-label">t-statistic</div>
          <div className="result-value">{currentTest.t.toFixed(2)}</div>
        </div>
        <div className="result-card">
          <div className="result-label">p-value</div>
          <div
            className={`result-value ${
              currentTest.p < 0.05 ? 'significant' : 'not-significant'
            }`}
          >
            {currentTest.p < 0.001 ? '< .001' : currentTest.p.toFixed(3)}
          </div>
        </div>
        <div className="result-card">
          <div className="result-label">Significant?</div>
          <div
            className={`result-value ${
              currentTest.p < 0.05 ? 'significant' : 'not-significant'
            }`}
          >
            {currentTest.p < 0.05 ? 'Yes (p < .05)' : 'No'}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-xl)', border: '1px solid var(--border)' }}>
        <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>What to Observe</h4>
        <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Generate several datasets and compare the results. Notice how:
        </p>
        <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <li>With <strong>no exclusion</strong>, most tests are non-significant (as expected when null is true)</li>
          <li>With <strong>within-condition</strong> exclusion, you may see more significant results—false positives</li>
          <li>With <strong>across-conditions</strong> exclusion, results are similar to no exclusion</li>
        </ul>
      </div>

      {method !== 'none' && (
        <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Outliers excluded: Group A = {currentOutliers[0].length}, Group B = {currentOutliers[1].length}
        </div>
      )}
    </div>
  );
}
