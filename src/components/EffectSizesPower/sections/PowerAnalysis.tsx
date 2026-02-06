import { useState, useMemo } from 'react';
import { calculatePower, normalPDF, normalInv } from '../../../utils/statistics';

export default function PowerAnalysis() {
  const [effectSize, setEffectSize] = useState(0.5);
  const [alpha, setAlpha] = useState(0.05);
  const [highlightN, setHighlightN] = useState(64);

  // Calculate power for current effect size at highlighted n
  const currentPower = useMemo(() => {
    return calculatePower(effectSize, highlightN, alpha);
  }, [effectSize, highlightN, alpha]);

  // Find n required for 80% power
  const nFor80Power = useMemo(() => {
    for (let n = 5; n <= 500; n++) {
      if (calculatePower(effectSize, n, alpha) >= 0.80) {
        return n;
      }
    }
    return 500;
  }, [effectSize, alpha]);

  // Generate distribution curves for the visualization
  const distributionData = useMemo(() => {
    const ncp = effectSize * Math.sqrt(highlightN / 2); // Noncentrality parameter

    const points: { x: number; null: number; alt: number }[] = [];
    for (let x = -4; x <= 6; x += 0.05) {
      points.push({
        x,
        null: normalPDF(x, 0, 1),
        alt: normalPDF(x, ncp, 1),
      });
    }
    return { points, ncp };
  }, [effectSize, highlightN]);

  // Critical value for alpha
  const zCrit = normalInv(1 - alpha / 2);

  // SVG dimensions
  const width = 650;
  const height = 320;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Distribution scales
  const xScaleDist = (x: number) => ((x + 4) / 10) * innerWidth;
  const yScaleDist = (y: number) => innerHeight - (y / 0.45) * innerHeight;

  return (
    <div className="section-intro">
      <h2>Statistical Power</h2>

      <p className="intro-text">
        Statistical power is the probability of correctly rejecting the null hypothesis when a true
        effect exists. In other words, it's the probability of detecting an effect <em>if there is
        one to detect</em>. Power depends on three factors: effect size, sample size, and the
        significance threshold (α).
      </p>

      <div className="formula-box">
        <h3>Power Defined</h3>
        <div className="formula">
          <span className="formula-main">Power = P(reject H₀ | H₁ is true) = 1 − β</span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">β</span>
            <span className="explanation">
              Type II error rate—the probability of failing to detect a real effect
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">1 − β</span>
            <span className="explanation">
              Power—typically we aim for 80% (β = 0.20) or higher
            </span>
          </div>
        </div>
      </div>

      <h3>Visualizing Power</h3>

      <p className="intro-text">
        The visualization below shows the null distribution (what we'd expect if H₀ were true) and
        the alternative distribution (what we'd expect given the true effect). Power is the area
        under the alternative distribution that falls beyond the critical value.
      </p>

      <div className="viz-container">
        <h4>Null vs. Alternative Distributions</h4>

        <div className="controls-row">
          <div className="control-group">
            <label>Effect Size (d)</label>
            <input
              type="range"
              min="0.1"
              max="1.2"
              step="0.1"
              value={effectSize}
              onChange={(e) => setEffectSize(Number(e.target.value))}
            />
            <span className="control-value">{effectSize.toFixed(1)}</span>
          </div>
          <div className="control-group">
            <label>Alpha (α)</label>
            <input
              type="range"
              min="0.01"
              max="0.10"
              step="0.01"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
            />
            <span className="control-value">{alpha.toFixed(2)}</span>
          </div>
          <div className="control-group">
            <label>Sample Size (n per group)</label>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={highlightN}
              onChange={(e) => setHighlightN(Number(e.target.value))}
            />
            <span className="control-value">{highlightN}</span>
          </div>
        </div>

        <div className="power-viz">
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Alpha region (right tail of null) */}
              <path
                d={`
                  M ${xScaleDist(zCrit)} ${yScaleDist(0)}
                  ${distributionData.points
                    .filter((p) => p.x >= zCrit)
                    .map((p) => `L ${xScaleDist(p.x)} ${yScaleDist(p.null)}`)
                    .join(' ')}
                  L ${xScaleDist(6)} ${yScaleDist(0)}
                  Z
                `}
                fill="rgba(230, 57, 70, 0.3)"
              />

              {/* Beta region (area under alternative left of critical value) */}
              <path
                d={`
                  M ${xScaleDist(-4)} ${yScaleDist(0)}
                  ${distributionData.points
                    .filter((p) => p.x <= zCrit)
                    .map((p) => `L ${xScaleDist(p.x)} ${yScaleDist(p.alt)}`)
                    .join(' ')}
                  L ${xScaleDist(zCrit)} ${yScaleDist(0)}
                  Z
                `}
                fill="rgba(148, 163, 184, 0.3)"
              />

              {/* Power region (area under alternative right of critical value) */}
              <path
                d={`
                  M ${xScaleDist(zCrit)} ${yScaleDist(0)}
                  ${distributionData.points
                    .filter((p) => p.x >= zCrit)
                    .map((p) => `L ${xScaleDist(p.x)} ${yScaleDist(p.alt)}`)
                    .join(' ')}
                  L ${xScaleDist(6)} ${yScaleDist(0)}
                  Z
                `}
                fill="rgba(16, 185, 129, 0.4)"
              />

              {/* Null distribution curve */}
              <path
                d={distributionData.points
                  .map(
                    (p, i) =>
                      `${i === 0 ? 'M' : 'L'} ${xScaleDist(p.x)} ${yScaleDist(p.null)}`
                  )
                  .join(' ')}
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
              />

              {/* Alternative distribution curve */}
              <path
                d={distributionData.points
                  .map(
                    (p, i) =>
                      `${i === 0 ? 'M' : 'L'} ${xScaleDist(p.x)} ${yScaleDist(p.alt)}`
                  )
                  .join(' ')}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
              />

              {/* Critical value line */}
              <line
                x1={xScaleDist(zCrit)}
                y1={0}
                x2={xScaleDist(zCrit)}
                y2={innerHeight}
                stroke="var(--accent)"
                strokeWidth="2"
                strokeDasharray="4,4"
              />

              {/* Labels */}
              <text
                x={xScaleDist(0)}
                y={-10}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
                fontWeight="600"
              >
                H₀ (null)
              </text>
              <text
                x={xScaleDist(distributionData.ncp)}
                y={-10}
                textAnchor="middle"
                fontSize="12"
                fill="var(--primary)"
                fontWeight="600"
              >
                H₁ (alternative)
              </text>
              <text
                x={xScaleDist(zCrit) + 5}
                y={30}
                fontSize="11"
                fill="var(--accent)"
              >
                Critical value
              </text>

              {/* Region labels */}
              <text
                x={xScaleDist(zCrit + 0.8)}
                y={innerHeight - 30}
                fontSize="10"
                fill="rgba(230, 57, 70, 0.8)"
                textAnchor="middle"
              >
                α (Type I)
              </text>
              <text
                x={xScaleDist(zCrit + 1.5)}
                y={innerHeight - 60}
                fontSize="10"
                fill="rgba(16, 185, 129, 0.9)"
                textAnchor="middle"
                fontWeight="600"
              >
                Power
              </text>
              <text
                x={xScaleDist(distributionData.ncp - 1)}
                y={innerHeight - 30}
                fontSize="10"
                fill="rgba(148, 163, 184, 0.9)"
                textAnchor="middle"
              >
                β (Type II)
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
            </g>
          </svg>
        </div>

        <div className="results-row">
          <div className="result-card">
            <div className="result-label">Current Power</div>
            <div className={`result-value ${currentPower >= 0.8 ? 'highlight' : ''}`}>
              {(currentPower * 100).toFixed(0)}%
            </div>
          </div>
          <div className="result-card">
            <div className="result-label">n for 80% Power</div>
            <div className="result-value highlight">{nFor80Power}</div>
          </div>
          <div className="result-card">
            <div className="result-label">Type II Error (β)</div>
            <div className="result-value">{((1 - currentPower) * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="power-annotation">
          <span className="icon">💡</span>
          <span className="text">
            With <strong>d = {effectSize.toFixed(1)}</strong> and{' '}
            <strong>n = {highlightN} per group</strong>, you have{' '}
            <strong>{(currentPower * 100).toFixed(0)}% power</strong> to detect the effect.
            {currentPower < 0.8 && (
              <> You need <strong>n = {nFor80Power}</strong> per group for 80% power.</>
            )}
          </span>
        </div>
      </div>

      <div className="key-insight">
        <h4>The Power Tradeoff</h4>
        <p>
          Increasing power requires either: (1) larger samples, (2) a larger true effect, or
          (3) relaxing α (which increases Type I error risk). Since we can't control the true
          effect size and shouldn't inflate α, adequate sample size is typically the key to
          well-powered studies.
        </p>
      </div>

      <h3>Why 80% Power?</h3>

      <p className="intro-text">
        The convention of targeting 80% power (β = 0.20) was proposed by Cohen as a reasonable
        balance. With 80% power, you have a 4:1 ratio of α to β (0.05 to 0.20), reflecting that
        false positives are often considered more costly than false negatives in basic research.
        However, the appropriate power level depends on context—clinical trials often aim for 90%.
      </p>
    </div>
  );
}
