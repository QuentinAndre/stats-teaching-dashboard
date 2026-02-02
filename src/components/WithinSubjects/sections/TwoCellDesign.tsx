import { useState, useMemo } from 'react';
import { pairedTTest, mean, standardDeviation } from '../../../utils/statistics';

// Fixed Stroop data: 8 subjects × 2 conditions (RT in ms)
const STROOP_DATA = [
  { id: 'S1', congruent: 420, incongruent: 480 },
  { id: 'S2', congruent: 380, incongruent: 430 },
  { id: 'S3', congruent: 510, incongruent: 580 },
  { id: 'S4', congruent: 450, incongruent: 500 },
  { id: 'S5', congruent: 390, incongruent: 460 },
  { id: 'S6', congruent: 480, incongruent: 530 },
  { id: 'S7', congruent: 360, incongruent: 420 },
  { id: 'S8', congruent: 440, incongruent: 500 },
];

type ViewMode = 'raw' | 'differences';

export default function TwoCellDesign() {
  const [viewMode, setViewMode] = useState<ViewMode>('raw');

  // Calculate all statistics
  const stats = useMemo(() => {
    const congruent = STROOP_DATA.map((d) => d.congruent);
    const incongruent = STROOP_DATA.map((d) => d.incongruent);
    const allRaw = [...congruent, ...incongruent];
    const differences = STROOP_DATA.map((d) => d.incongruent - d.congruent);

    const meanCongruent = mean(congruent);
    const meanIncongruent = mean(incongruent);
    const meanAllRaw = mean(allRaw);
    const sdCongruent = standardDeviation(congruent, true);
    const sdIncongruent = standardDeviation(incongruent, true);
    const sdAllRaw = standardDeviation(allRaw, true);

    const meanDiff = mean(differences);
    const sdDiff = standardDeviation(differences, true);

    // Run paired t-test
    const tTest = pairedTTest(congruent, incongruent);

    return {
      congruent,
      incongruent,
      allRaw,
      differences,
      meanCongruent,
      meanIncongruent,
      meanAllRaw,
      sdCongruent,
      sdIncongruent,
      sdAllRaw,
      meanDiff,
      sdDiff,
      tTest,
    };
  }, []);

  // SVG dimensions for histogram - shared between both views
  const width = 550;
  const height = 220;
  const margin = { top: 30, right: 30, bottom: 50, left: 50 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // SHARED X-AXIS: Use the same scale for both views to show variability reduction
  // Range from 0 to 250ms (enough to show both raw deviation and differences)
  const xMin = 0;
  const xMax = 250;
  const xScale = (value: number) =>
    margin.left + ((value - xMin) / (xMax - xMin)) * plotWidth;

  // For raw scores: show deviation from the grand mean of all raw scores
  const rawDeviations = useMemo(() => {
    return stats.allRaw.map((val) => Math.abs(val - stats.meanAllRaw));
  }, [stats.allRaw, stats.meanAllRaw]);

  // Create histogram bins for raw score deviations
  const rawBins = useMemo(() => {
    const binWidth = 20;
    const result: { x0: number; x1: number; count: number }[] = [];
    for (let x = 0; x < xMax; x += binWidth) {
      const count = rawDeviations.filter((d) => d >= x && d < x + binWidth).length;
      result.push({ x0: x, x1: x + binWidth, count });
    }
    return result;
  }, [rawDeviations]);

  // Create histogram bins for difference scores (absolute values for comparison)
  const diffBins = useMemo(() => {
    const binWidth = 20;
    const result: { x0: number; x1: number; count: number }[] = [];
    for (let x = 0; x < xMax; x += binWidth) {
      const count = stats.differences.filter((d) => d >= x && d < x + binWidth).length;
      result.push({ x0: x, x1: x + binWidth, count });
    }
    return result;
  }, [stats.differences]);

  const maxRawCount = Math.max(...rawBins.map((b) => b.count), 1);
  const maxDiffCount = Math.max(...diffBins.map((b) => b.count), 1);
  const maxCount = Math.max(maxRawCount, maxDiffCount);

  const yScale = (count: number) =>
    margin.top + plotHeight - (count / (maxCount + 1)) * plotHeight;

  // X-axis ticks
  const xTicks = [0, 50, 100, 150, 200];

  return (
    <div className="section-intro">
      <h2>The Paired Comparison</h2>

      <p className="intro-text">
        With only two conditions, there's a simple yet powerful analysis: the
        <strong> paired t-test</strong>. The key insight is that we can convert our
        two-condition data into a single set of <em>difference scores</em>.
      </p>

      <h3>Each Subject Is Their Own Control</h3>

      <p className="intro-text">
        Consider two subjects with very different baseline speeds:
      </p>

      <div className="subject-comparison">
        <div className="subject-card fast">
          <h5>Fast Person (S7)</h5>
          <div className="scores">
            <span>360ms</span>
            <span className="arrow">→</span>
            <span>420ms</span>
          </div>
          <div className="difference">Difference: +60ms</div>
        </div>
        <div className="subject-card slow">
          <h5>Slow Person (S3)</h5>
          <div className="scores">
            <span>510ms</span>
            <span className="arrow">→</span>
            <span>580ms</span>
          </div>
          <div className="difference">Difference: +70ms</div>
        </div>
      </div>

      <p className="intro-text">
        Even though S7 is 150ms faster overall than S3, they show similar Stroop effects
        (60ms vs 70ms). When we compute D = Incongruent − Congruent for each person,
        the baseline differences <em>vanish</em>. What remains is just the effect of
        the manipulation.
      </p>

      <h3>The Data Transformation</h3>

      <div className="viz-container">
        <h4>From Raw Scores to Difference Scores</h4>

        <div className="view-toggle">
          <button
            className={`toggle-button ${viewMode === 'raw' ? 'active' : ''}`}
            onClick={() => setViewMode('raw')}
          >
            Raw Scores
          </button>
          <button
            className={`toggle-button ${viewMode === 'differences' ? 'active' : ''}`}
            onClick={() => setViewMode('differences')}
          >
            Difference Scores
          </button>
        </div>

        {viewMode === 'raw' ? (
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Congruent</th>
                <th>Incongruent</th>
              </tr>
            </thead>
            <tbody>
              {STROOP_DATA.map((subject) => (
                <tr key={subject.id}>
                  <td>{subject.id}</td>
                  <td>{subject.congruent}</td>
                  <td>{subject.incongruent}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Mean</td>
                <td>{stats.meanCongruent.toFixed(1)}</td>
                <td>{stats.meanIncongruent.toFixed(1)}</td>
              </tr>
              <tr>
                <td>SD</td>
                <td>{stats.sdCongruent.toFixed(1)}</td>
                <td>{stats.sdIncongruent.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Difference (D = Inc − Con)</th>
              </tr>
            </thead>
            <tbody>
              {STROOP_DATA.map((subject, i) => (
                <tr key={subject.id}>
                  <td>{subject.id}</td>
                  <td className="col-difference">{stats.differences[i]}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Mean (D̄)</td>
                <td className="col-difference">{stats.meanDiff.toFixed(2)}</td>
              </tr>
              <tr>
                <td>SD (s<sub>D</sub>)</td>
                <td className="col-difference">{stats.sdDiff.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Histogram with shared x-axis for both views */}
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <h4 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
            {viewMode === 'raw'
              ? 'Distribution of Raw Scores (Deviation from Grand Mean)'
              : 'Distribution of Difference Scores'}
          </h4>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ display: 'block', margin: '0 auto' }}
          >
            {/* Y-axis */}
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={height - margin.bottom}
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* X-axis */}
            <line
              x1={margin.left}
              y1={height - margin.bottom}
              x2={width - margin.right}
              y2={height - margin.bottom}
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* X-axis ticks and grid lines */}
            {xTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={xScale(tick)}
                  y1={height - margin.bottom}
                  x2={xScale(tick)}
                  y2={height - margin.bottom + 5}
                  stroke="var(--border)"
                />
                <text
                  x={xScale(tick)}
                  y={height - margin.bottom + 18}
                  textAnchor="middle"
                  fontSize={12}
                  fill="var(--text-secondary)"
                >
                  {tick}
                </text>
                <line
                  x1={xScale(tick)}
                  y1={margin.top}
                  x2={xScale(tick)}
                  y2={height - margin.bottom}
                  stroke="var(--border)"
                  strokeDasharray="3,3"
                  opacity={0.2}
                />
              </g>
            ))}

            {/* X-axis label */}
            <text
              x={width / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize={12}
              fill="var(--text-secondary)"
            >
              {viewMode === 'raw' ? 'Deviation from Grand Mean (ms)' : 'Difference Score (ms)'}
            </text>

            {/* Y-axis label */}
            <text
              x={15}
              y={margin.top + plotHeight / 2}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-secondary)"
              transform={`rotate(-90, 15, ${margin.top + plotHeight / 2})`}
            >
              Count
            </text>

            {/* Histogram bars */}
            {viewMode === 'raw'
              ? rawBins.map((bin, i) => (
                  <rect
                    key={i}
                    x={xScale(bin.x0) + 2}
                    y={yScale(bin.count)}
                    width={(xScale(bin.x1) - xScale(bin.x0)) - 4}
                    height={height - margin.bottom - yScale(bin.count)}
                    fill="#6b7280"
                    opacity={0.7}
                    rx={2}
                  />
                ))
              : diffBins.map((bin, i) => (
                  <rect
                    key={i}
                    x={xScale(bin.x0) + 2}
                    y={yScale(bin.count)}
                    width={(xScale(bin.x1) - xScale(bin.x0)) - 4}
                    height={height - margin.bottom - yScale(bin.count)}
                    fill="#4361ee"
                    opacity={0.7}
                    rx={2}
                  />
                ))}

            {/* Mean/SD indicator */}
            {viewMode === 'raw' ? (
              <>
                {/* SD range indicator for raw scores */}
                <line
                  x1={xScale(0)}
                  y1={margin.top + 15}
                  x2={xScale(stats.sdAllRaw)}
                  y2={margin.top + 15}
                  stroke="#ef4444"
                  strokeWidth={3}
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={xScale(stats.sdAllRaw / 2)}
                  y={margin.top + 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#ef4444"
                  fontWeight={600}
                >
                  SD = {stats.sdAllRaw.toFixed(0)}ms
                </text>
              </>
            ) : (
              <>
                {/* Mean line for differences */}
                <line
                  x1={xScale(stats.meanDiff)}
                  y1={margin.top}
                  x2={xScale(stats.meanDiff)}
                  y2={height - margin.bottom}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5,3"
                />
                <text
                  x={xScale(stats.meanDiff) + 5}
                  y={margin.top + 12}
                  textAnchor="start"
                  fontSize={11}
                  fill="#ef4444"
                  fontWeight={600}
                >
                  D̄ = {stats.meanDiff.toFixed(1)}ms
                </text>
                {/* SD indicator */}
                <text
                  x={xScale(stats.meanDiff) + 5}
                  y={margin.top + 26}
                  textAnchor="start"
                  fontSize={10}
                  fill="#ef4444"
                >
                  SD = {stats.sdDiff.toFixed(1)}ms
                </text>
              </>
            )}
          </svg>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-md)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            padding: 'var(--spacing-sm)',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--border-radius-sm)',
          }}
        >
          {viewMode === 'raw' ? (
            <span>
              Raw scores spread over a wide range (SD ≈ <strong>{stats.sdAllRaw.toFixed(0)}ms</strong>)
              because people differ in overall speed.
            </span>
          ) : (
            <span>
              Difference scores cluster tightly around the mean (SD = <strong>{stats.sdDiff.toFixed(1)}ms</strong>)
              — an <strong>{((1 - stats.sdDiff / stats.sdAllRaw) * 100).toFixed(0)}% reduction</strong> in variability!
            </span>
          )}
        </div>
      </div>

      <h3>The Paired t-Test</h3>

      <p className="intro-text">
        The paired t-test is simply a one-sample t-test on the difference scores. We're
        asking: "Is the mean difference significantly different from zero?"
      </p>

      <div className="formula-box">
        <h3>Paired t-Test Formula</h3>
        <div className="formula">
          <span className="formula-main">
            t = D̄ / (s<sub>D</sub> / √n)
          </span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol condition">D̄ = {stats.meanDiff.toFixed(2)}</span>
            <span className="explanation">Mean difference</span>
          </div>
          <div className="formula-part">
            <span className="symbol subject">
              s<sub>D</sub> = {stats.sdDiff.toFixed(2)}
            </span>
            <span className="explanation">SD of differences</span>
          </div>
          <div className="formula-part">
            <span className="symbol residual">n = 8</span>
            <span className="explanation">Number of pairs</span>
          </div>
        </div>
      </div>

      <div className="viz-container">
        <h4>Test Results</h4>
        <table className="anova-table">
          <thead>
            <tr>
              <th>Statistic</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>Mean Difference (D̄)</td>
              <td>{stats.meanDiff.toFixed(2)} ms</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>Standard Error (SE<sub>D̄</sub>)</td>
              <td>{stats.tTest.seDiff.toFixed(2)} ms</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>t-statistic</td>
              <td>{stats.tTest.t.toFixed(3)}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>Degrees of Freedom</td>
              <td>{stats.tTest.df}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>p-value</td>
              <td className={stats.tTest.p < 0.05 ? 'significant' : ''}>
                {stats.tTest.p < 0.001 ? '< .001' : stats.tTest.p.toFixed(4)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="key-insight">
        <h4>Why the Paired Test Is More Powerful</h4>
        <p>
          Compare the SD of raw scores (~{stats.sdAllRaw.toFixed(0)}ms) with the
          SD of difference scores ({stats.sdDiff.toFixed(1)}ms). By removing
          between-subject variance, the standard error shrinks dramatically. A smaller
          denominator means a larger t-value, which means more power to detect the
          Stroop effect. The effect (D̄ = {stats.meanDiff.toFixed(1)}ms) is highly
          significant (p {'<'} .001) despite our small sample size.
        </p>
      </div>
    </div>
  );
}
