import { useState, useMemo } from 'react';
import { calculatePower, normalPDF, normalCDF, normalInv } from '../../../utils/statistics';

export default function PublicationBias() {
  const [trueD, setTrueD] = useState(0.3);
  const [sampleSize, setSampleSize] = useState(30);

  // Sampling distribution of Cohen's d
  // Variance of d ≈ 2/n + d²/(4n) for equal group sizes
  const samplingSD = useMemo(() => {
    const n = sampleSize;
    return Math.sqrt(2 / n + (trueD * trueD) / (4 * n));
  }, [trueD, sampleSize]);

  // Critical value for significance (one-tailed, α = 0.05)
  // Only effects in the expected (positive) direction get published
  const dCrit = useMemo(() => {
    // d_crit = z_crit * sqrt(2/n)
    // Using z approximation for simplicity (accurate for n > 20)
    const zCrit = normalInv(0.95); // ≈ 1.645 for one-tailed
    return zCrit * Math.sqrt(2 / sampleSize);
  }, [sampleSize]);

  // Calculate power (one-tailed test)
  const power = useMemo(() => {
    return calculatePower(trueD, sampleSize, 0.05, 1);
  }, [trueD, sampleSize]);

  // Expected value of published (significant) effect sizes
  // Only considers positive direction (one-tailed test)
  // Uses truncated normal distribution formula (inverse Mills ratio)
  const publishedMeanD = useMemo(() => {
    const d = trueD;
    const sigma = samplingSD;
    const c = dCrit;

    // Standardized cutoff for right tail
    const alpha = (c - d) / sigma;

    // Probability of significance (d_obs > c)
    const pSignificant = 1 - normalCDF(alpha);

    if (pSignificant < 0.0001) return d; // Avoid division by zero

    // PDF value at cutoff
    const phi = normalPDF(alpha, 0, 1);

    // E[X | X > c] = μ + σ * φ(α) / (1 - Φ(α))
    // This is the inverse Mills ratio formula for right-truncated normal
    return d + sigma * phi / pSignificant;
  }, [trueD, samplingSD, dCrit]);

  // Calculate inflation
  const inflation = trueD > 0 ? ((publishedMeanD - trueD) / trueD) * 100 : 0;

  // Generate distribution curves for visualization
  const distributionData = useMemo(() => {
    const points: { x: number; full: number; published: number }[] = [];
    const minX = -0.5;
    const maxX = 1.5;
    const step = 0.01;

    for (let x = minX; x <= maxX; x += step) {
      const fullDensity = normalPDF(x, trueD, samplingSD);
      // Published density is the full density but only in the significant region (right tail only)
      const isSignificant = x > dCrit;
      const publishedDensity = isSignificant ? fullDensity : 0;

      points.push({
        x,
        full: fullDensity,
        published: publishedDensity,
      });
    }

    return points;
  }, [trueD, samplingSD, dCrit]);

  // SVG dimensions
  const width = 600;
  const height = 290;
  const margin = { top: 40, right: 30, bottom: 50, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const xMin = -0.5;
  const xMax = 1.5;
  const yMax = Math.max(...distributionData.map((p) => p.full)) * 1.1;

  const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  // Generate paths
  const fullPath = distributionData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.full)}`)
    .join(' ');

  // Published area path (filled)
  const publishedAreaPath = useMemo(() => {
    let path = '';
    let inRegion = false;

    distributionData.forEach((p, i) => {
      if (p.published > 0 && !inRegion) {
        // Start new region
        inRegion = true;
        path += `M ${xScale(p.x)} ${yScale(0)} `;
      }

      if (p.published > 0) {
        path += `L ${xScale(p.x)} ${yScale(p.published)} `;
      }

      if ((p.published === 0 || i === distributionData.length - 1) && inRegion) {
        // End region
        inRegion = false;
        path += `L ${xScale(distributionData[i - 1]?.x || p.x)} ${yScale(0)} Z `;
      }
    });

    return path;
  }, [distributionData]);

  return (
    <div className="section-intro">
      <h2>Why Published Effect Sizes Are Inflated</h2>

      <p className="intro-text">
        When only statistically significant results in the expected direction get published, the
        reported effect sizes systematically <strong>overestimate</strong> the true effect. This
        happens because studies that happen to overestimate the effect are more likely to achieve
        significance, while those that underestimate it are more likely to fail and remain unpublished.
        This phenomenon is sometimes called the <em>winner's curse</em> or <em>publication bias</em>.
      </p>

      <div className="key-insight">
        <h4>The Core Problem</h4>
        <p>
          Statistical significance is partly determined by sampling error. When power is low,
          only studies with unusually large observed effects will cross the significance threshold.
          These "lucky" studies systematically overestimate the true effect—and they're the only
          ones that get published.
        </p>
      </div>

      <h3>The Sampling Distribution of Effect Sizes</h3>

      <p className="intro-text">
        The gray curve shows the distribution of effect sizes we'd observe across many replications
        of a study. The purple shaded region shows only the results that are significant in the
        expected direction—those that would be published. Notice how selecting on significance
        shifts the average upward from the true value.
      </p>

      <div className="viz-container">
        <h4>Full Distribution vs. Published Results</h4>

        <div className="controls-row">
          <div className="control-group">
            <label>True Effect Size (d)</label>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={trueD}
              onChange={(e) => setTrueD(Number(e.target.value))}
            />
            <span className="control-value">{trueD.toFixed(2)}</span>
          </div>
          <div className="control-group">
            <label>Sample Size (per group)</label>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
            />
            <span className="control-value">n = {sampleSize}</span>
          </div>
        </div>

        <div className="distribution-viz">
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Non-significant region (light gray fill) - left of critical value */}
              <rect
                x={0}
                y={0}
                width={xScale(dCrit)}
                height={innerHeight}
                fill="rgba(148, 163, 184, 0.1)"
              />

              {/* Published (significant) areas */}
              <path
                d={publishedAreaPath}
                fill="rgba(139, 92, 246, 0.4)"
              />

              {/* Full distribution curve */}
              <path
                d={fullPath}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              />

              {/* Critical value line (one-tailed) */}
              <line
                x1={xScale(dCrit)}
                y1={0}
                x2={xScale(dCrit)}
                y2={innerHeight}
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x={xScale(dCrit) + 3}
                y={15}
                fontSize="10"
                fill="var(--accent)"
              >
                p = .05 (one-tailed)
              </text>

              {/* True effect line */}
              <line
                x1={xScale(trueD)}
                y1={0}
                x2={xScale(trueD)}
                y2={innerHeight}
                stroke="#10b981"
                strokeWidth="3"
              />
              <text
                x={xScale(trueD)}
                y={-12}
                textAnchor="middle"
                fontSize="11"
                fill="#10b981"
                fontWeight="600"
              >
                True d = {trueD.toFixed(2)}
              </text>

              {/* Published mean line */}
              <line
                x1={xScale(publishedMeanD)}
                y1={0}
                x2={xScale(publishedMeanD)}
                y2={innerHeight}
                stroke="#8b5cf6"
                strokeWidth="3"
              />
              <text
                x={xScale(publishedMeanD)}
                y={-25}
                textAnchor="middle"
                fontSize="11"
                fill="#8b5cf6"
                fontWeight="600"
              >
                Published = {publishedMeanD.toFixed(2)}
              </text>

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
              {[-0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4].map((d) => (
                <g key={d}>
                  <line
                    x1={xScale(d)}
                    y1={innerHeight}
                    x2={xScale(d)}
                    y2={innerHeight + 5}
                    stroke="var(--border)"
                  />
                  <text
                    x={xScale(d)}
                    y={innerHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-secondary)"
                  >
                    {d.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* Axis label */}
              <text
                x={innerWidth / 2}
                y={innerHeight + 38}
                textAnchor="middle"
                fontSize="12"
                fill="var(--text-secondary)"
              >
                Observed Effect Size (d)
              </text>

              {/* Zero line */}
              <line
                x1={xScale(0)}
                y1={innerHeight - 5}
                x2={xScale(0)}
                y2={innerHeight + 5}
                stroke="var(--text-secondary)"
                strokeWidth="2"
              />
            </g>
          </svg>
        </div>

        <div className="variance-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgba(148, 163, 184, 0.6)' }} />
            <span>All studies (sampling distribution)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#8b5cf6' }} />
            <span>Published (significant in expected direction)</span>
          </div>
        </div>

        <div className="results-row" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="result-card">
            <div className="result-label">Statistical Power</div>
            <div className={`result-value ${power >= 0.8 ? 'highlight' : ''}`} style={{ color: power < 0.5 ? 'var(--accent)' : power < 0.8 ? 'var(--text-primary)' : '#10b981' }}>
              {(power * 100).toFixed(0)}%
            </div>
          </div>
          <div className="result-card">
            <div className="result-label">True Effect</div>
            <div className="result-value" style={{ color: '#10b981' }}>{trueD.toFixed(2)}</div>
          </div>
          <div className="result-card">
            <div className="result-label">Published Average</div>
            <div className="result-value" style={{ color: '#8b5cf6' }}>{publishedMeanD.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {inflation > 0 ? `${inflation.toFixed(0)}% inflated` : ''}
            </div>
          </div>
        </div>
      </div>

      <h3>The Pattern: Lower Power = Greater Inflation</h3>

      <p className="intro-text">
        Try adjusting the sliders to see the relationship. When power is high (large sample or
        large effect), most of the distribution falls in the significant region, so the published
        average is close to the truth. When power is low, only the extreme right tail achieves
        significance, dramatically inflating the published estimate.
      </p>

      <div className="formula-box">
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">Low power</span>
            <span className="explanation">
              Only studies with inflated effect sizes achieve significance, so published
              estimates are systematically too high. With 20% power and d = 0.3, published
              effects may average d = 0.6 or higher.
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">High power</span>
            <span className="explanation">
              Most studies achieve significance regardless of sampling error direction,
              so published estimates are close to the true effect.
            </span>
          </div>
        </div>
      </div>

      <h3>Why This Matters for Replication</h3>

      <p className="intro-text">
        When a researcher plans a replication study, they often use the published effect size to
        determine sample size. But if the original effect size was inflated by publication bias,
        the replication will be underpowered for detecting the <em>true</em> effect—leading to
        a high probability of "failure to replicate" even when the effect is real.
      </p>

      <div className="key-insight">
        <h4>The Takeaway</h4>
        <p>
          Publication bias doesn't just mean some studies go unpublished—it means the studies
          that <em>do</em> get published paint an overly optimistic picture of effect sizes.
          This is why adequately powered studies are essential: they produce accurate effect
          size estimates that support cumulative science.
        </p>
      </div>
    </div>
  );
}
