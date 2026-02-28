import { useState, useMemo } from 'react';
import {
  johnsonNeymanBoundaries,
  marginalEffectWithCI,
} from '../../../utils/statistics';

// Model coefficients from the NFC × Argument Quality example
const b = -2.40;
const d = 1.18;
const varB = 1.20;
const varD = 0.11;
const covBD = -0.32;
const df = 96;

// Generate smooth x values for plotting
const xValues: number[] = [];
for (let x = 0.5; x <= 5.5; x += 0.05) {
  xValues.push(Math.round(x * 100) / 100);
}

export default function FloodlightAnalysis() {
  const [alpha, setAlpha] = useState(0.05);

  // Compute JN boundaries
  const jnResult = useMemo(
    () => johnsonNeymanBoundaries(b, d, varB, varD, covBD, df, alpha),
    [alpha]
  );

  // Compute marginal effect with CI at each x value
  const effectData = useMemo(
    () => marginalEffectWithCI(b, d, varB, varD, covBD, df, alpha, xValues),
    [alpha]
  );

  // The relevant JN boundary for this dataset (the one in the visible NFC range)
  const jnBoundary = useMemo(() => {
    const inRange = jnResult.boundaries.filter((v) => v >= 0.5 && v <= 5.5);
    if (inRange.length === 0) return null;
    // Return the boundary closest to the expected range (~2.0–2.5)
    return inRange.reduce((closest, v) =>
      Math.abs(v - 2.3) < Math.abs(closest - 2.3) ? v : closest
    );
  }, [jnResult]);

  // SVG dimensions
  const width = 700;
  const height = 400;
  const margin = { top: 30, right: 30, bottom: 55, left: 70 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Axis ranges
  const xMin = 1;
  const xMax = 5;
  const yMin = -3;
  const yMax = 4;

  // Scale functions
  const scaleX = (v: number) =>
    margin.left + ((v - xMin) / (xMax - xMin)) * plotW;
  const scaleY = (v: number) =>
    margin.top + ((yMax - v) / (yMax - yMin)) * plotH;

  // Build path strings for the effect line and CI band
  const effectLinePath = effectData
    .filter((pt) => pt.x >= xMin && pt.x <= xMax)
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${scaleX(pt.x).toFixed(2)},${scaleY(pt.effect).toFixed(2)}`)
    .join(' ');

  const filteredData = effectData.filter((pt) => pt.x >= xMin && pt.x <= xMax);

  const upperPath = filteredData
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${scaleX(pt.x).toFixed(2)},${scaleY(pt.upper).toFixed(2)}`)
    .join(' ');

  const lowerPathReversed = [...filteredData]
    .reverse()
    .map((pt) => `L${scaleX(pt.x).toFixed(2)},${scaleY(pt.lower).toFixed(2)}`)
    .join(' ');

  const bandPath = `${upperPath} ${lowerPathReversed} Z`;

  // Build region shading: significant (green) where CI excludes zero, non-significant (gray) otherwise
  const significantRegions: { x1: number; x2: number; significant: boolean }[] = useMemo(() => {
    const regions: { x1: number; x2: number; significant: boolean }[] = [];
    const filtered = effectData.filter((pt) => pt.x >= xMin && pt.x <= xMax);
    if (filtered.length === 0) return regions;

    let currentSig = filtered[0].lower > 0 || filtered[0].upper < 0;
    let regionStart = filtered[0].x;

    for (let i = 1; i < filtered.length; i++) {
      const sig = filtered[i].lower > 0 || filtered[i].upper < 0;
      if (sig !== currentSig) {
        regions.push({ x1: regionStart, x2: filtered[i].x, significant: currentSig });
        regionStart = filtered[i].x;
        currentSig = sig;
      }
    }
    regions.push({ x1: regionStart, x2: filtered[filtered.length - 1].x, significant: currentSig });
    return regions;
  }, [effectData]);

  // X-axis ticks
  const xTicks = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  // Y-axis ticks
  const yTicks = [-3, -2, -1, 0, 1, 2, 3, 4];

  return (
    <div className="section-intro">
      <h2>Floodlight Analysis: The Johnson-Neyman Technique</h2>

      <p className="intro-text">
        Rather than testing the effect at researcher-chosen values, the{' '}
        <strong>Johnson-Neyman (JN) technique</strong> finds the <em>boundary</em>{' '}
        values of the moderator where the confidence interval for the marginal effect
        just touches zero. Below the boundary the effect is not significant; above it,
        the effect is significant (or vice versa). The data themselves determine the
        cutoff.
      </p>

      <h3>The Math Behind It</h3>

      <p className="intro-text">
        Recall that the marginal effect of Z at a given X is <em>b + dX</em>, with a
        standard error that depends on X through the variance-covariance matrix of the
        coefficients. The effect is significant when |<em>t</em>| = |(<em>b + dX</em>) / SE(<em>b + dX</em>)| exceeds
        the critical <em>t</em> value. Setting |<em>t</em>| = <em>t</em><sub>crit</sub> and
        solving for X yields a quadratic equation. Its solutions are the JN boundaries —
        the moderator values where significance switches on or off.
      </p>

      <div className="viz-container">
        <h4>Marginal Effect of Argument Quality Across NFC</h4>

        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: 'block', maxWidth: width }}
        >
          {/* Background region shading */}
          {significantRegions.map((region, i) => {
            const rx1 = Math.max(scaleX(region.x1), margin.left);
            const rx2 = Math.min(scaleX(region.x2), margin.left + plotW);
            return (
              <rect
                key={i}
                x={rx1}
                y={margin.top}
                width={rx2 - rx1}
                height={plotH}
                fill={region.significant ? '#10b981' : '#6b7280'}
                opacity={region.significant ? 0.15 : 0.08}
              />
            );
          })}

          {/* Plot area border */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotW}
            height={plotH}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Grid lines */}
          {yTicks.map((tick) => (
            <line
              key={`ygrid-${tick}`}
              x1={margin.left}
              y1={scaleY(tick)}
              x2={margin.left + plotW}
              y2={scaleY(tick)}
              stroke="var(--border)"
              strokeWidth={0.5}
              strokeDasharray={tick === 0 ? 'none' : '3,3'}
              opacity={tick === 0 ? 0.8 : 0.4}
            />
          ))}

          {/* Zero line (dashed, more prominent) */}
          <line
            x1={margin.left}
            y1={scaleY(0)}
            x2={margin.left + plotW}
            y2={scaleY(0)}
            stroke="var(--text-secondary)"
            strokeWidth={1.5}
            strokeDasharray="6,4"
            opacity={0.7}
          />
          <text
            x={margin.left + plotW + 4}
            y={scaleY(0)}
            fill="var(--text-secondary)"
            fontSize={11}
            dominantBaseline="middle"
          >
            0
          </text>

          {/* Confidence band */}
          <path
            d={bandPath}
            fill="#4361ee"
            opacity={0.15}
            stroke="none"
          />

          {/* Upper CI line */}
          <path
            d={upperPath}
            fill="none"
            stroke="#4361ee"
            strokeWidth={1}
            opacity={0.5}
            strokeDasharray="4,3"
          />

          {/* Lower CI line */}
          <path
            d={filteredData
              .map((pt, i) => `${i === 0 ? 'M' : 'L'}${scaleX(pt.x).toFixed(2)},${scaleY(pt.lower).toFixed(2)}`)
              .join(' ')}
            fill="none"
            stroke="#4361ee"
            strokeWidth={1}
            opacity={0.5}
            strokeDasharray="4,3"
          />

          {/* Marginal effect line */}
          <path
            d={effectLinePath}
            fill="none"
            stroke="#4361ee"
            strokeWidth={2.5}
          />

          {/* JN boundary vertical line */}
          {jnBoundary !== null && (
            <>
              <line
                x1={scaleX(jnBoundary)}
                y1={margin.top}
                x2={scaleX(jnBoundary)}
                y2={margin.top + plotH}
                stroke="#e63946"
                strokeWidth={2}
                strokeDasharray="6,4"
              />
              <text
                x={scaleX(jnBoundary)}
                y={margin.top - 8}
                fill="#e63946"
                fontSize={12}
                fontWeight={600}
                textAnchor="middle"
              >
                NFC = {jnBoundary.toFixed(2)}
              </text>
            </>
          )}

          {/* Region labels */}
          {jnBoundary !== null && (
            <>
              <text
                x={scaleX((xMin + jnBoundary) / 2)}
                y={margin.top + 20}
                fill="#6b7280"
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
              >
                Not Significant
              </text>
              <text
                x={scaleX((jnBoundary + xMax) / 2)}
                y={margin.top + 20}
                fill="#10b981"
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
              >
                Significant
              </text>
            </>
          )}

          {/* X-axis ticks and labels */}
          {xTicks.map((tick) => (
            <g key={`xtick-${tick}`}>
              <line
                x1={scaleX(tick)}
                y1={margin.top + plotH}
                x2={scaleX(tick)}
                y2={margin.top + plotH + 6}
                stroke="var(--text-secondary)"
                strokeWidth={1}
              />
              <text
                x={scaleX(tick)}
                y={margin.top + plotH + 20}
                fill="var(--text-secondary)"
                fontSize={11}
                textAnchor="middle"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* X-axis label */}
          <text
            x={margin.left + plotW / 2}
            y={height - 8}
            fill="var(--text-primary)"
            fontSize={13}
            fontWeight={500}
            textAnchor="middle"
          >
            Need for Cognition (X)
          </text>

          {/* Y-axis ticks and labels */}
          {yTicks.map((tick) => (
            <g key={`ytick-${tick}`}>
              <line
                x1={margin.left - 6}
                y1={scaleY(tick)}
                x2={margin.left}
                y2={scaleY(tick)}
                stroke="var(--text-secondary)"
                strokeWidth={1}
              />
              <text
                x={margin.left - 10}
                y={scaleY(tick)}
                fill="var(--text-secondary)"
                fontSize={11}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          <text
            x={16}
            y={margin.top + plotH / 2}
            fill="var(--text-primary)"
            fontSize={13}
            fontWeight={500}
            textAnchor="middle"
            transform={`rotate(-90, 16, ${margin.top + plotH / 2})`}
          >
            Effect of Argument Quality (dY/dZ)
          </text>
        </svg>

        {/* Controls */}
        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="alpha-slider">Significance Level (alpha)</label>
            <input
              id="alpha-slider"
              type="range"
              min={0.01}
              max={0.10}
              step={0.01}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
            />
            <span className="control-value">
              alpha = {alpha.toFixed(2)}
            </span>
          </div>
          <div className="control-group">
            <label>JN Boundary</label>
            <span className="control-value" style={{ color: '#e63946' }}>
              {jnBoundary !== null ? `NFC = ${jnBoundary.toFixed(2)}` : 'None in range'}
            </span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        The blue line shows the marginal effect of argument quality on product attitude,
        computed as <em>b + dX</em> = {b} + ({d})X. The shaded band is
        the {((1 - alpha) * 100).toFixed(0)}% confidence interval around that effect. Where
        the entire band sits above zero (green region), the effect is statistically
        significant at alpha = {alpha.toFixed(2)}. Where the band crosses zero (gray region),
        we cannot reject the null hypothesis of no effect.
      </p>

      <p className="intro-text">
        The effect of argument quality on attitudes is significant for participants with
        NFC above{' '}
        <strong>{jnBoundary !== null ? jnBoundary.toFixed(2) : '---'}</strong>. Below this
        boundary, the confidence interval includes zero and the effect is no longer
        significant at alpha = {alpha.toFixed(2)}. At low levels of Need for Cognition,
        we do not estimate a significant difference between strong and weak arguments.
      </p>

      <p className="intro-text">
        Try adjusting the alpha slider. A stricter threshold (smaller alpha) widens the
        confidence band, pushing the JN boundary to the right — fewer NFC values yield
        a significant effect. A more lenient threshold does the opposite. The boundary
        responds continuously because it is derived from the quadratic solution, not from
        an arbitrary choice of spotlight values.
      </p>

      <div className="key-insight">
        <h4>Spotlight vs. Floodlight</h4>
        <p>
          Spotlight analysis samples the marginal-effect line at a few researcher-chosen
          points. Floodlight analysis maps the entire line and marks where the confidence
          band crosses zero. When the moderator has no natural focal values, the
          floodlight approach removes the arbitrary choice entirely.
        </p>
      </div>
    </div>
  );
}
