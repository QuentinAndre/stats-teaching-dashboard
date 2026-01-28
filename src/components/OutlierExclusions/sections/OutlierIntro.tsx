import { useMemo } from 'react';
import { computeIQR, getIQRThresholds } from '../../../utils/statistics';

export default function OutlierIntro() {
  // Generate example data with outliers
  const { data, outlierIndices, stats } = useMemo(() => {
    // Seed a reproducible dataset
    const baseData = [
      23, 25, 26, 27, 27, 28, 28, 29, 29, 29,
      30, 30, 30, 31, 31, 31, 32, 32, 33, 34,
      // Outliers
      12, 48
    ];

    const iqrStats = computeIQR(baseData);
    const thresholds = getIQRThresholds(baseData, 1.5);

    const outliers = baseData
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v < thresholds.lower || v > thresholds.upper)
      .map(({ i }) => i);

    return {
      data: baseData,
      outlierIndices: outliers,
      stats: { ...iqrStats, thresholds }
    };
  }, []);

  const width = 600;
  const height = 120;
  const margin = { top: 20, right: 30, bottom: 30, left: 30 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const xMin = Math.min(...data) - 5;
  const xMax = Math.max(...data) + 5;
  const xScale = (v: number) => ((v - xMin) / (xMax - xMin)) * plotWidth;

  return (
    <div className="section-intro">
      <h2>What Are Outliers?</h2>

      <p className="intro-text">
        <strong>Outliers</strong> are data points that fall far from the rest of
        the observations. They might result from measurement errors, data entry
        mistakes, or genuinely unusual observations.
      </p>

      <div className="outlier-viz-container">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* X-axis */}
            <line
              x1={0}
              y1={plotHeight / 2}
              x2={plotWidth}
              y2={plotHeight / 2}
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* IQR box */}
            <rect
              x={xScale(stats.q1)}
              y={plotHeight / 2 - 15}
              width={xScale(stats.q3) - xScale(stats.q1)}
              height={30}
              fill="var(--primary)"
              opacity={0.15}
              rx={4}
            />

            {/* Threshold lines */}
            <line
              x1={xScale(stats.thresholds.lower)}
              y1={plotHeight / 2 - 25}
              x2={xScale(stats.thresholds.lower)}
              y2={plotHeight / 2 + 25}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <line
              x1={xScale(stats.thresholds.upper)}
              y1={plotHeight / 2 - 25}
              x2={xScale(stats.thresholds.upper)}
              y2={plotHeight / 2 + 25}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />

            {/* Data points */}
            {data.map((value, i) => {
              const isOutlier = outlierIndices.includes(i);
              return (
                <circle
                  key={i}
                  cx={xScale(value)}
                  cy={plotHeight / 2}
                  r={isOutlier ? 8 : 6}
                  fill={isOutlier ? 'var(--accent)' : 'var(--primary)'}
                  opacity={isOutlier ? 1 : 0.7}
                />
              );
            })}

            {/* Labels */}
            <text
              x={xScale(stats.thresholds.lower)}
              y={plotHeight / 2 + 40}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-secondary)"
            >
              Lower threshold
            </text>
            <text
              x={xScale(stats.thresholds.upper)}
              y={plotHeight / 2 + 40}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-secondary)"
            >
              Upper threshold
            </text>
          </g>
        </svg>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Data points outside the dashed lines (1.5 × IQR from quartiles) are flagged as outliers
        </p>
      </div>

      <h3>Why Remove Outliers?</h3>
      <p>
        Researchers often remove outliers because:
      </p>
      <ul>
        <li><strong>They can distort statistical results</strong> - A single extreme value can dramatically shift the mean and inflate variance</li>
        <li><strong>They may represent errors</strong> - Equipment malfunction, participant inattention, or data entry mistakes</li>
        <li><strong>They may not represent the population of interest</strong> - If studying typical behavior, extreme cases may not be relevant</li>
      </ul>

      <h3>Common Outlier Detection Methods</h3>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>How It Works</th>
            <th>Typical Threshold</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>IQR Method</strong></td>
            <td>Flag values outside Q1 − k×IQR and Q3 + k×IQR</td>
            <td>k = 1.5 (standard) or 3 (extreme)</td>
          </tr>
          <tr>
            <td><strong>Z-Score</strong></td>
            <td>Flag values where |z| exceeds threshold</td>
            <td>|z| {">"} 2.5 or 3</td>
          </tr>
          <tr>
            <td><strong>MAD</strong></td>
            <td>Flag values far from median, scaled by MAD</td>
            <td>2.5 or 3 scaled MAD units</td>
          </tr>
        </tbody>
      </table>

      <div className="key-insight">
        <h4>The Key Question</h4>
        <p>
          Removing outliers seems straightforward, but <strong>how</strong> you compute
          the thresholds matters enormously. Should you compute thresholds separately
          for each experimental condition, or across all data combined?
        </p>
      </div>
    </div>
  );
}
