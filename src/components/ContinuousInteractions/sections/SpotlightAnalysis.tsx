import { useState, useMemo } from 'react';
import { simpleEffectTTest } from '../../../utils/statistics';

// Model: Y = a + bZ + cX + dZX
// NFC × Argument Quality coefficients
const a = 5.80;
const b = -2.40;
const c = -0.22;
const d = 1.18;

// Variance-covariance elements for b and d
const varB = 1.20;
const varD = 0.11;
const covBD = -0.32;
const df = 96;

// NFC distribution
const NFC_MEAN = 3.20;
const NFC_SD = 0.70;

// Mean +/- 1 SD values
const MEAN_SD_VALUES = [
  { value: NFC_MEAN - NFC_SD, label: 'Mean \u2212 1 SD', shortLabel: (NFC_MEAN - NFC_SD).toFixed(2) },
  { value: NFC_MEAN, label: 'Mean', shortLabel: NFC_MEAN.toFixed(2) },
  { value: NFC_MEAN + NFC_SD, label: 'Mean + 1 SD', shortLabel: (NFC_MEAN + NFC_SD).toFixed(2) },
];

// Custom spotlight values (whole-number NFC values)
const CUSTOM_VALUES = [
  { value: 2.0, label: 'NFC = 2.0', shortLabel: '2.00' },
  { value: 3.0, label: 'NFC = 3.0', shortLabel: '3.00' },
  { value: 4.0, label: 'NFC = 4.0', shortLabel: '4.00' },
];

// SVG dimensions
const SVG_WIDTH = 700;
const SVG_HEIGHT = 380;
const MARGIN = { top: 30, right: 40, bottom: 50, left: 60 };
const PLOT_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

// NFC range for the plot
const NFC_MIN = 1;
const NFC_MAX = 5;

/** Predicted Y for given Z and X (NFC) */
function predictY(z: number, x: number): number {
  return a + b * z + c * x + d * z * x;
}

/** Map NFC to x pixel coordinate */
function xScale(nfc: number): number {
  return MARGIN.left + ((nfc - NFC_MIN) / (NFC_MAX - NFC_MIN)) * PLOT_WIDTH;
}

/** Map Y value to y pixel coordinate */
function yScale(yVal: number, yMin: number, yMax: number): number {
  return MARGIN.top + PLOT_HEIGHT - ((yVal - yMin) / (yMax - yMin)) * PLOT_HEIGHT;
}

function formatP(p: number): string {
  if (p < 0.001) return '< .001';
  return p.toFixed(3);
}

export default function SpotlightAnalysis() {
  const [mode, setMode] = useState<'meansd' | 'custom'>('meansd');

  const spotlightValues = mode === 'meansd' ? MEAN_SD_VALUES : CUSTOM_VALUES;

  // Compute results for each spotlight value
  const results = useMemo(() => {
    return spotlightValues.map((sv) => {
      const res = simpleEffectTTest(b, d, varB, varD, covBD, sv.value, df);
      return {
        ...sv,
        effect: res.effect,
        se: res.se,
        t: res.t,
        p: res.p,
        significant: res.p < 0.05,
      };
    });
  }, [spotlightValues]);

  // Compute Y range for scaling
  const yRange = useMemo(() => {
    const yValues: number[] = [];
    for (let nfc = NFC_MIN; nfc <= NFC_MAX; nfc += 0.1) {
      yValues.push(predictY(0, nfc));
      yValues.push(predictY(1, nfc));
    }
    const yMin = Math.floor(Math.min(...yValues) - 0.5);
    const yMax = Math.ceil(Math.max(...yValues) + 0.5);
    return { yMin, yMax };
  }, []);

  // Generate line paths
  const lineZ1 = useMemo(() => {
    const points: string[] = [];
    for (let nfc = NFC_MIN; nfc <= NFC_MAX; nfc += 0.05) {
      const px = xScale(nfc);
      const py = yScale(predictY(1, nfc), yRange.yMin, yRange.yMax);
      points.push(`${px},${py}`);
    }
    return `M${points.join(' L')}`;
  }, [yRange]);

  const lineZ0 = useMemo(() => {
    const points: string[] = [];
    for (let nfc = NFC_MIN; nfc <= NFC_MAX; nfc += 0.05) {
      const px = xScale(nfc);
      const py = yScale(predictY(0, nfc), yRange.yMin, yRange.yMax);
      points.push(`${px},${py}`);
    }
    return `M${points.join(' L')}`;
  }, [yRange]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = yRange.yMin; v <= yRange.yMax; v += 1) {
      ticks.push(v);
    }
    return ticks;
  }, [yRange]);

  // X-axis ticks
  const xTicks = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  // Spotlight line colors
  const spotlightColors = ['#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="section-intro">
      <h2>Spotlight Analysis</h2>

      <p className="intro-text">
        In the previous section we saw that the simple effect of Z depends on where
        you evaluate it along X. <em>Spotlight analysis</em> formalizes this by
        testing the simple effect at specific, chosen values of the moderator. The
        question is: which values should we choose?
      </p>

      <p className="intro-text">
        A common default is to test at the mean and at one standard deviation above
        and below the mean (M &plusmn; 1 SD). This is what many textbooks recommend.
        Spiller et al. (2013) argue that for moderators like NFC — measured on an
        arbitrary scale with no clinically or practically meaningful thresholds — the
        M &plusmn; 1 SD approach is a reasonable starting point, but the values
        themselves (e.g., NFC = 2.50 or 3.90) carry no inherent meaning.
      </p>

      <p className="intro-text">
        When a moderator <em>does</em> have recognized thresholds (e.g., clinical
        cutoffs, legal age boundaries, poverty-line income), Spiller et al. recommend
        using those <strong>focal values</strong> instead of &plusmn; 1 SD.
      </p>

      <h3>The Math Behind Spotlight Tests</h3>

      <p className="intro-text">
        For a chosen spotlight value X<sub>focal</sub>, the simple effect of Z is:
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">
            Simple effect = <em>b</em> + <em>d</em> &times; X<sub>focal</sub>
          </span>
        </div>
        <div className="formula">
          <span className="formula-main">
            SE = &radic;( Var(<em>b</em>) + 2 &times; X<sub>focal</sub> &times;
            Cov(<em>b</em>,<em>d</em>) + X<sub>focal</sub><sup>2</sup> &times;
            Var(<em>d</em>) )
          </span>
        </div>
      </div>

      <p className="intro-text">
        This is the same calculation from the marginal effects section, applied at
        specific values rather than across the full range. The SE formula accounts
        for the covariance between <em>b</em> and <em>d</em>, which is why
        uncertainty depends on where along X you test.
      </p>

      <h3>Spotlight Results</h3>

      <div className="toggle-group">
        <button
          className={`toggle-button ${mode === 'meansd' ? 'active' : ''}`}
          onClick={() => setMode('meansd')}
        >
          Mean &plusmn; 1 SD
        </button>
        <button
          className={`toggle-button ${mode === 'custom' ? 'active' : ''}`}
          onClick={() => setMode('custom')}
        >
          Round Values (2, 3, 4)
        </button>
      </div>

      <div className="viz-container">
        <h4>
          Simple Effect of Argument Quality (Z) at{' '}
          {mode === 'meansd' ? 'Mean \u00B1 1 SD' : 'Selected NFC Values'}
        </h4>

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: '100%', maxWidth: SVG_WIDTH }}
        >
          {/* Gridlines */}
          {yTicks.map((tick) => (
            <line
              key={`grid-${tick}`}
              x1={MARGIN.left}
              x2={SVG_WIDTH - MARGIN.right}
              y1={yScale(tick, yRange.yMin, yRange.yMax)}
              y2={yScale(tick, yRange.yMin, yRange.yMax)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          ))}

          {/* Spotlight vertical bands */}
          {spotlightValues.map((sv, i) => {
            const cx = xScale(sv.value);
            return (
              <g key={`spotlight-${i}`}>
                {/* Vertical band */}
                <rect
                  x={cx - 12}
                  y={MARGIN.top}
                  width={24}
                  height={PLOT_HEIGHT}
                  fill={spotlightColors[i]}
                  opacity={0.08}
                />
                {/* Vertical dashed line */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={MARGIN.top}
                  y2={MARGIN.top + PLOT_HEIGHT}
                  stroke={spotlightColors[i]}
                  strokeWidth={1.5}
                  strokeDasharray="6,4"
                  opacity={0.6}
                />
              </g>
            );
          })}

          {/* Regression line Z=0 (weak arguments) */}
          <path
            d={lineZ0}
            fill="none"
            stroke="#f97316"
            strokeWidth={2.5}
            opacity={0.85}
          />

          {/* Regression line Z=1 (strong arguments) */}
          <path
            d={lineZ1}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2.5}
            opacity={0.85}
          />

          {/* Bracket and gap label at each spotlight value */}
          {spotlightValues.map((sv, i) => {
            const cx = xScale(sv.value);
            const y0 = yScale(predictY(0, sv.value), yRange.yMin, yRange.yMax);
            const y1 = yScale(predictY(1, sv.value), yRange.yMin, yRange.yMax);
            const yTop = Math.min(y0, y1);
            const yBot = Math.max(y0, y1);
            const gap = Math.abs(predictY(1, sv.value) - predictY(0, sv.value));

            return (
              <g key={`bracket-${i}`}>
                {/* Dots on each line */}
                <circle cx={cx} cy={y0} r={4} fill="#f97316" />
                <circle cx={cx} cy={y1} r={4} fill="#3b82f6" />

                {/* Bracket line */}
                <line
                  x1={cx + 14}
                  x2={cx + 14}
                  y1={yTop + 2}
                  y2={yBot - 2}
                  stroke={spotlightColors[i]}
                  strokeWidth={2}
                />
                {/* Top bracket cap */}
                <line
                  x1={cx + 10}
                  x2={cx + 18}
                  y1={yTop + 2}
                  y2={yTop + 2}
                  stroke={spotlightColors[i]}
                  strokeWidth={2}
                />
                {/* Bottom bracket cap */}
                <line
                  x1={cx + 10}
                  x2={cx + 18}
                  y1={yBot - 2}
                  y2={yBot - 2}
                  stroke={spotlightColors[i]}
                  strokeWidth={2}
                />
                {/* Gap label */}
                <text
                  x={cx + 22}
                  y={(yTop + yBot) / 2}
                  dy="0.35em"
                  fontSize={11}
                  fontWeight={600}
                  fill={spotlightColors[i]}
                >
                  {gap.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* X axis */}
          <line
            x1={MARGIN.left}
            x2={SVG_WIDTH - MARGIN.right}
            y1={MARGIN.top + PLOT_HEIGHT}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="#9ca3af"
            strokeWidth={1}
          />
          {xTicks.map((tick) => (
            <g key={`xtick-${tick}`}>
              <line
                x1={xScale(tick)}
                x2={xScale(tick)}
                y1={MARGIN.top + PLOT_HEIGHT}
                y2={MARGIN.top + PLOT_HEIGHT + 6}
                stroke="#9ca3af"
                strokeWidth={1}
              />
              <text
                x={xScale(tick)}
                y={MARGIN.top + PLOT_HEIGHT + 20}
                textAnchor="middle"
                fontSize={12}
                fill="#6b7280"
              >
                {tick}
              </text>
            </g>
          ))}
          <text
            x={MARGIN.left + PLOT_WIDTH / 2}
            y={SVG_HEIGHT - 6}
            textAnchor="middle"
            fontSize={13}
            fill="#374151"
            fontWeight={500}
          >
            Need for Cognition (X)
          </text>

          {/* Y axis */}
          <line
            x1={MARGIN.left}
            x2={MARGIN.left}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="#9ca3af"
            strokeWidth={1}
          />
          {yTicks.map((tick) => (
            <g key={`ytick-${tick}`}>
              <line
                x1={MARGIN.left - 6}
                x2={MARGIN.left}
                y1={yScale(tick, yRange.yMin, yRange.yMax)}
                y2={yScale(tick, yRange.yMin, yRange.yMax)}
                stroke="#9ca3af"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 10}
                y={yScale(tick, yRange.yMin, yRange.yMax)}
                dy="0.35em"
                textAnchor="end"
                fontSize={12}
                fill="#6b7280"
              >
                {tick}
              </text>
            </g>
          ))}
          <text
            x={14}
            y={MARGIN.top + PLOT_HEIGHT / 2}
            textAnchor="middle"
            fontSize={13}
            fill="#374151"
            fontWeight={500}
            transform={`rotate(-90, 14, ${MARGIN.top + PLOT_HEIGHT / 2})`}
          >
            Product Attitude (Y)
          </text>

          {/* Legend */}
          <g transform={`translate(${MARGIN.left + 12}, ${MARGIN.top + 10})`}>
            <line x1={0} x2={20} y1={0} y2={0} stroke="#3b82f6" strokeWidth={2.5} />
            <text x={26} y={0} dy="0.35em" fontSize={12} fill="#374151">
              Z = 1 (strong args)
            </text>
            <line x1={0} x2={20} y1={20} y2={20} stroke="#f97316" strokeWidth={2.5} />
            <text x={26} y={20} dy="0.35em" fontSize={12} fill="#374151">
              Z = 0 (weak args)
            </text>
          </g>
        </svg>
      </div>

      {/* Result cards */}
      <div className="results-row">
        {results.map((r, i) => (
          <div
            key={i}
            className={`result-card ${r.significant ? 'significant' : 'not-significant'}`}
          >
            <h5>
              NFC = {r.shortLabel}
              <br />
              <span style={{ fontSize: '0.6875rem', fontWeight: 400 }}>
                ({spotlightValues[i].label})
              </span>
            </h5>
            <div className="result-value">
              Effect = {r.effect.toFixed(2)}
            </div>
            <div className="result-detail">
              SE = {r.se.toFixed(2)}, <em>t</em>({df}) = {r.t.toFixed(2)},{' '}
              <em>p</em> = {formatP(r.p)}
            </div>
            <div
              className="result-detail"
              style={{
                marginTop: 4,
                fontWeight: 600,
                color: r.significant ? '#059669' : '#9ca3af',
              }}
            >
              {r.significant ? 'Significant' : 'Not significant'}
            </div>
          </div>
        ))}
      </div>

      {mode === 'meansd' && (
        <p className="intro-text" style={{ textAlign: 'center', marginTop: 0 }}>
          At NFC = {MEAN_SD_VALUES[0].shortLabel} (Mean &minus; 1 SD), the effect is{' '}
          {results[0]?.effect.toFixed(2)}.
          At the mean ({MEAN_SD_VALUES[1].shortLabel}), it is {results[1]?.effect.toFixed(2)}.
          At Mean + 1 SD ({MEAN_SD_VALUES[2].shortLabel}), it grows to {results[2]?.effect.toFixed(2)}.
          The argument-quality effect increases with NFC.
        </p>
      )}


      <div className="key-insight">
        <h4>When Does Spotlight Analysis Work Best?</h4>
        <p>
          Spiller et al. (2013) note
          that spotlight analysis is most informative when the moderator has recognized{' '}
          <strong>focal values</strong> (e.g., clinical cutoffs, legal age boundaries).
          For moderators on arbitrary scales — NFC, self-esteem, attitude measures —
          the choice of spotlight values is itself arbitrary. The next section introduces{' '}
          <strong>floodlight analysis</strong>, which lets the data determine the exact
          boundary where significance begins.
        </p>
      </div>
    </div>
  );
}
