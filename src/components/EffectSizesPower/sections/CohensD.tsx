import { useState, useMemo } from 'react';
import { cohensDFromStats, normalPDF, distributionOverlap } from '../../../utils/statistics';

export default function CohensD() {
  const [mean1, setMean1] = useState(50);
  const [mean2, setMean2] = useState(58);
  const [pooledSD, setPooledSD] = useState(15);

  // Calculate Cohen's d
  const d = useMemo(() => {
    return cohensDFromStats(mean2 - mean1, pooledSD);
  }, [mean1, mean2, pooledSD]);

  // Calculate overlap percentage
  const overlap = useMemo(() => {
    return distributionOverlap(d) * 100;
  }, [d]);

  // Fixed x-axis range (doesn't change with SD)
  const xAxisMin = 0;
  const xAxisMax = 100;

  // Generate distribution curves
  const distributionData = useMemo(() => {
    const points: { x: number; y1: number; y2: number }[] = [];
    const step = (xAxisMax - xAxisMin) / 200;

    for (let x = xAxisMin; x <= xAxisMax; x += step) {
      points.push({
        x,
        y1: normalPDF(x, mean1, pooledSD),
        y2: normalPDF(x, mean2, pooledSD),
      });
    }
    return points;
  }, [mean1, mean2, pooledSD]);

  // SVG dimensions
  const width = 600;
  const height = 250;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Fixed scale (x-axis doesn't change)
  const yMax = Math.max(...distributionData.map((p) => Math.max(p.y1, p.y2)));

  const xScale = (x: number) => ((x - xAxisMin) / (xAxisMax - xAxisMin)) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  // Generate closed area paths (start at baseline, trace curve, return to baseline)
  const areaPath1 = `
    M ${xScale(xAxisMin)} ${yScale(0)}
    ${distributionData.map((p) => `L ${xScale(p.x)} ${yScale(p.y1)}`).join(' ')}
    L ${xScale(xAxisMax)} ${yScale(0)}
    Z
  `;

  const areaPath2 = `
    M ${xScale(xAxisMin)} ${yScale(0)}
    ${distributionData.map((p) => `L ${xScale(p.x)} ${yScale(p.y2)}`).join(' ')}
    L ${xScale(xAxisMax)} ${yScale(0)}
    Z
  `;

  // Separate stroke paths (just the curve, no baseline)
  const strokePath1 = distributionData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y1)}`)
    .join(' ');

  const strokePath2 = distributionData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y2)}`)
    .join(' ');

  return (
    <div className="section-intro">
      <h2>Standardized Mean Differences</h2>

      <p className="intro-text">
        When comparing two groups, the raw difference between means (Ȳ₁ − Ȳ₂) depends on the
        measurement scale. A "10-point difference" means very different things for a 100-point
        test versus a 1000-point test. <strong>Standardized mean differences</strong> solve this
        by expressing the difference in standard deviation units, making effect sizes comparable
        across studies and measures.
      </p>

      <div className="formula-box">
        <h3>The General Form</h3>
        <div className="formula">
          <span className="formula-main">Standardized Difference = (Ȳ₁ − Ȳ₂) / s</span>
        </div>
        <p className="intro-text" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.9rem' }}>
          Different versions of this formula use different estimates of the standard deviation
          (<span className="math">s</span>). The choice depends on the research context and
          desired properties.
        </p>
      </div>

      <h3>Variants of Standardized Mean Differences</h3>

      <table className="effect-size-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Denominator</th>
            <th>When to Use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Cohen's <span className="math">d</span></strong></td>
            <td>Pooled SD: √[((n₁−1)s₁² + (n₂−1)s₂²) / (n₁+n₂−2)]</td>
            <td>Most common; assumes equal population variances</td>
          </tr>
          <tr>
            <td><strong>Hedges' <span className="math">g</span></strong></td>
            <td>Same as Cohen's d, with bias correction</td>
            <td>Preferred for meta-analysis; less biased in small samples</td>
          </tr>
          <tr>
            <td><strong>Glass's <span className="math">Δ</span></strong></td>
            <td>Control group SD only</td>
            <td>When treatment may affect variability, or control SD is better known</td>
          </tr>
        </tbody>
      </table>

      <div className="formula-box">
        <h3>Hedges' g Correction</h3>
        <div className="formula">
          <span className="formula-main">g = d × (1 − 3 / (4(n₁+n₂) − 9))</span>
        </div>
        <p className="intro-text" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.9rem' }}>
          Cohen's <span className="math">d</span> overestimates the population effect size,
          especially with small samples. Hedges' <span className="math">g</span> applies a
          correction factor that shrinks the estimate slightly. For large samples (n {'>'}  20
          per group), the difference is negligible. For meta-analyses, Hedges' <span className="math">g</span> is
          preferred because it combines more accurately across studies with different sample sizes.
        </p>
      </div>

      <h3>Visualizing the Standardized Difference</h3>

      <p className="intro-text">
        The interactive visualization below shows two normal distributions. Adjust the means and
        standard deviation to see how the standardized difference changes. Notice how the same
        raw difference produces different <span className="math">d</span> values depending on
        variability—the same 8-point difference is a larger standardized effect when variability
        is low.
      </p>

      <div className="viz-container">
        <h4>Two-Group Distribution Overlap</h4>

        <div className="controls-row">
          <div className="control-group">
            <label>Group 1 Mean (Control)</label>
            <input
              type="range"
              min="20"
              max="80"
              value={mean1}
              onChange={(e) => setMean1(Number(e.target.value))}
            />
            <span className="control-value">{mean1}</span>
          </div>
          <div className="control-group">
            <label>Group 2 Mean (Treatment)</label>
            <input
              type="range"
              min="20"
              max="80"
              value={mean2}
              onChange={(e) => setMean2(Number(e.target.value))}
            />
            <span className="control-value">{mean2}</span>
          </div>
          <div className="control-group">
            <label>Pooled SD</label>
            <input
              type="range"
              min="5"
              max="30"
              value={pooledSD}
              onChange={(e) => setPooledSD(Number(e.target.value))}
            />
            <span className="control-value">{pooledSD}</span>
          </div>
        </div>

        <div className="distribution-viz">
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Group 1 distribution fill (blue) */}
              <path
                d={areaPath1}
                fill="rgba(67, 97, 238, 0.3)"
                stroke="none"
              />
              {/* Group 1 distribution stroke */}
              <path
                d={strokePath1}
                fill="none"
                stroke="#4361ee"
                strokeWidth="2"
              />
              {/* Group 2 distribution fill (orange) */}
              <path
                d={areaPath2}
                fill="rgba(244, 162, 97, 0.3)"
                stroke="none"
              />
              {/* Group 2 distribution stroke */}
              <path
                d={strokePath2}
                fill="none"
                stroke="#f4a261"
                strokeWidth="2"
              />

              {/* Mean lines */}
              <line
                x1={xScale(mean1)}
                y1={0}
                x2={xScale(mean1)}
                y2={innerHeight}
                stroke="#4361ee"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              <line
                x1={xScale(mean2)}
                y1={0}
                x2={xScale(mean2)}
                y2={innerHeight}
                stroke="#f4a261"
                strokeWidth="2"
                strokeDasharray="4,4"
              />

              {/* X-axis */}
              <line
                x1={0}
                y1={innerHeight}
                x2={innerWidth}
                y2={innerHeight}
                stroke="var(--border)"
                strokeWidth="1"
              />

              {/* X-axis ticks */}
              {[0, 20, 40, 60, 80, 100].map((tick) => (
                <g key={tick}>
                  <line
                    x1={xScale(tick)}
                    y1={innerHeight}
                    x2={xScale(tick)}
                    y2={innerHeight + 5}
                    stroke="var(--border)"
                  />
                  <text
                    x={xScale(tick)}
                    y={innerHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-secondary)"
                  >
                    {tick}
                  </text>
                </g>
              ))}

              {/* Labels */}
              <text
                x={xScale(mean1)}
                y={-5}
                textAnchor="middle"
                fill="#4361ee"
                fontSize="12"
                fontWeight="600"
              >
                Ȳ₁ = {mean1}
              </text>
              <text
                x={xScale(mean2)}
                y={-5}
                textAnchor="middle"
                fill="#f4a261"
                fontSize="12"
                fontWeight="600"
              >
                Ȳ₂ = {mean2}
              </text>

              {/* Arrow markers */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="6"
                  markerHeight="6"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6" fill="var(--text-secondary)" />
                </marker>
                <marker
                  id="arrowhead-reverse"
                  markerWidth="6"
                  markerHeight="6"
                  refX="0"
                  refY="3"
                  orient="auto"
                >
                  <path d="M6,0 L0,3 L6,6" fill="var(--text-secondary)" />
                </marker>
              </defs>
            </g>
          </svg>
        </div>

        <div className="variance-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#4361ee' }} />
            <span>Group 1 (Control)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#f4a261' }} />
            <span>Group 2 (Treatment)</span>
          </div>
        </div>

        <div className="results-row">
          <div className="result-card">
            <div className="result-label">Raw Difference</div>
            <div className="result-value">{Math.abs(mean2 - mean1)}</div>
          </div>
          <div className="result-card">
            <div className="result-label">Pooled SD</div>
            <div className="result-value">{pooledSD}</div>
          </div>
          <div className="result-card">
            <div className="result-label">Cohen's d</div>
            <div className="result-value highlight">{d.toFixed(2)}</div>
          </div>
          <div className="result-card">
            <div className="result-label">Distribution Overlap</div>
            <div className="result-value">{overlap.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      <div className="key-insight">
        <h4>Interpreting the Overlap</h4>
        <p>
          The overlap percentage shows what proportion of the two distributions share common
          space. Even when <span className="math">d</span> = 1.0 (a one-SD difference), about 45%
          of the distributions overlap—many individuals in the control group score higher than
          many in the treatment group. Effect sizes describe <em>average</em> differences, not
          individual outcomes. Whether an effect size is "meaningful" depends entirely on the
          research context, not arbitrary benchmarks.
        </p>
      </div>

      <h3>When to Use Which Measure</h3>

      <p className="intro-text">
        In practice, Cohen's <span className="math">d</span> and Hedges' <span className="math">g</span> are
        nearly interchangeable for most purposes. The choice matters most in these situations:
      </p>

      <div className="formula-box">
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">Meta-analysis</span>
            <span className="explanation">
              Use Hedges' <span className="math">g</span>. Its bias correction ensures accurate
              pooling across studies, especially when some studies have small samples.
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">Unequal variances</span>
            <span className="explanation">
              Consider Glass's <span className="math">Δ</span> using only the control group SD,
              especially if the treatment is expected to change variability.
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">General reporting</span>
            <span className="explanation">
              Cohen's <span className="math">d</span> is most widely recognized. For samples
              larger than 20 per group, the difference from Hedges' <span className="math">g</span> is trivial.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
