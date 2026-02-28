import { useState, useMemo } from 'react';

/**
 * TheRegressionModel (Section 2)
 *
 * Merged section covering both the regression model and marginal effects.
 *
 * Structure:
 *   1. The equation Y = a + bZ + cX + dZX
 *   2. An R-style regression output table
 *   3. Plain interpretation of the coefficients
 *   4. "Interpreting the Interaction as Marginal Effects" — interactive
 *      dual-panel visualization (regression lines + derivative plot)
 *
 * Uses the Argument Quality × Need for Cognition example:
 *   Y = product attitude (1–9)
 *   Z = 0 (weak arguments) or 1 (strong arguments)
 *   X = Need for Cognition (NCS-18 item-mean, 1–5, M = 3.20, SD = 0.70)
 *
 * Coefficients: a = 5.80, b = -2.40, c = -0.22, d = 1.18
 */

// Model coefficients
const A = 5.80;
const B = -2.40;
const C = -0.22;
const D = 1.18;

// NFC range
const NFC_MIN = 1;
const NFC_MAX = 5;
const NFC_DEFAULT = 3.2;

// Predicted Y for a given Z and NFC
function predictY(z: number, nfc: number): number {
  return A + B * z + C * nfc + D * z * nfc;
}

// Marginal effect of Quality at a given NFC: dY/dQuality = b + d * NFC
function marginalEffect(nfc: number): number {
  return B + D * nfc;
}

// Regression table data (mock R output)
const COEFF_TABLE = [
  { term: '(Intercept)', label: 'a', estimate: A, se: 0.92, t: 6.30, p: '<.001' },
  { term: 'Quality', label: 'b', estimate: B, se: 1.10, t: -2.18, p: '.032' },
  { term: 'NFC', label: 'c', estimate: C, se: 0.27, t: -0.81, p: '.418' },
  { term: 'Quality × NFC', label: 'd', estimate: D, se: 0.33, t: 3.56, p: '<.001' },
];

export default function TheRegressionModel() {
  const [nfc, setNfc] = useState(NFC_DEFAULT);

  // Computed values for the marginal-effects visualization
  const yZ0 = useMemo(() => predictY(0, nfc), [nfc]);
  const yZ1 = useMemo(() => predictY(1, nfc), [nfc]);
  const gap = useMemo(() => yZ1 - yZ0, [yZ1, yZ0]);
  const effect = useMemo(() => marginalEffect(nfc), [nfc]);

  // --- SVG layout constants ---
  // Left panel: two regression lines
  const lWidth = 400;
  const lHeight = 280;
  const lMargin = { top: 20, right: 20, bottom: 45, left: 55 };
  const lInnerW = lWidth - lMargin.left - lMargin.right;
  const lInnerH = lHeight - lMargin.top - lMargin.bottom;

  // Left panel Y range: 1 to 9 (attitude scale)
  const lYMin = 1;
  const lYMax = 9;

  // Right panel: marginal effect line
  const rWidth = 400;
  const rHeight = 280;
  const rMargin = { top: 20, right: 20, bottom: 45, left: 55 };
  const rInnerW = rWidth - rMargin.left - rMargin.right;
  const rInnerH = rHeight - rMargin.top - rMargin.bottom;

  // Right panel Y range: -3 to 4
  const rYMin = -3;
  const rYMax = 4;

  // Shared X scaling (NFC 1-5)
  const xScale = (x: number, innerW: number) =>
    ((x - NFC_MIN) / (NFC_MAX - NFC_MIN)) * innerW;

  // Left panel Y scaling
  const lYScale = (y: number) =>
    lInnerH - ((y - lYMin) / (lYMax - lYMin)) * lInnerH;

  // Right panel Y scaling
  const rYScale = (y: number) =>
    rInnerH - ((y - rYMin) / (rYMax - rYMin)) * rInnerH;

  // Generate regression line paths (left panel)
  const linePoints = useMemo(() => {
    const pts: { nfc: number; y0: number; y1: number }[] = [];
    for (let x = NFC_MIN; x <= NFC_MAX; x += 0.1) {
      pts.push({ nfc: x, y0: predictY(0, x), y1: predictY(1, x) });
    }
    return pts;
  }, []);

  const linePathZ0 = linePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.nfc, lInnerW)} ${lYScale(p.y0)}`)
    .join(' ');

  const linePathZ1 = linePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.nfc, lInnerW)} ${lYScale(p.y1)}`)
    .join(' ');

  // Generate marginal effect line path (right panel)
  const effectPoints = useMemo(() => {
    const pts: { nfc: number; effect: number }[] = [];
    for (let x = NFC_MIN; x <= NFC_MAX; x += 0.1) {
      pts.push({ nfc: x, effect: marginalEffect(x) });
    }
    return pts;
  }, []);

  const effectLinePath = effectPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.nfc, rInnerW)} ${rYScale(p.effect)}`)
    .join(' ');

  // Current positions for markers
  const currentLX = xScale(nfc, lInnerW);
  const currentLY0 = lYScale(yZ0);
  const currentLY1 = lYScale(yZ1);

  const currentRX = xScale(nfc, rInnerW);
  const currentRY = rYScale(effect);

  // X-axis ticks (shared)
  const xTicks = [1, 2, 3, 4, 5];

  // Left panel Y-axis ticks
  const lYTicks = [1, 3, 5, 7, 9];

  // Right panel Y-axis ticks
  const rYTicks = [-3, -2, -1, 0, 1, 2, 3, 4];

  // Y position of zero line in right panel
  const zeroLineY = rYScale(0);

  return (
    <div className="section-intro">
      <h2>The Regression Model</h2>

      <p className="intro-text">
        With a continuous moderator, the interaction lives inside a regression equation
        rather than a factorial ANOVA table. The equation is:
      </p>

      {/* ---- Formula box ---- */}
      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">
            Y = <em>a</em> + <em>b</em>(Quality) + <em>c</em>(NFC) + <em>d</em>(Quality &times; NFC)
          </span>
        </div>
        <p className="intro-text" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.9rem', textAlign: 'center' }}>
          where Quality = argument quality (0 = weak, 1 = strong) and NFC = Need for
          Cognition (1–5 item-mean).
        </p>
      </div>

      <p className="intro-text">
        Fitting this model to our NFC &times; Argument Quality data yields the
        following regression output:
      </p>

      {/* ---- R-style regression table ---- */}
      <div className="viz-container">
        <table className="coeff-table" style={{ margin: '0 auto' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Term</th>
              <th>Estimate</th>
              <th>SE</th>
              <th><em>t</em>(96)</th>
              <th><em>p</em></th>
            </tr>
          </thead>
          <tbody>
            {COEFF_TABLE.map((row) => (
              <tr
                key={row.term}
                className={row.label === 'd' ? 'highlight-row' : ''}
              >
                <td style={{ textAlign: 'left' }}>
                  {row.term}{' '}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    ({row.label})
                  </span>
                </td>
                <td>{row.estimate.toFixed(2)}</td>
                <td>{row.se.toFixed(2)}</td>
                <td>{row.t.toFixed(2)}</td>
                <td>{row.p}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginTop: 'var(--spacing-sm)',
          lineHeight: 1.5,
        }}>
          R&sup2; = .238 &nbsp;|&nbsp; Residual SE = 1.52 &nbsp;|&nbsp; <em>n</em> = 100
        </p>
      </div>

      {/* ---- Coefficient interpretation ---- */}
      <h3>Reading the Coefficients</h3>

      <p className="intro-text">
        Each coefficient describes one piece of the model:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>
          <strong><em>a</em> = {A.toFixed(2)}</strong> — the predicted attitude when
          both Quality and NFC equal zero (the intercept).
        </li>
        <li>
          <strong><em>b</em> = {B.toFixed(2)}</strong> — the effect of switching from
          weak to strong arguments when NFC = 0.
        </li>
        <li>
          <strong><em>c</em> = {C.toFixed(2)}</strong> — the effect of a one-unit increase in NFC on attitude
          in the weak-arguments condition (Quality = 0).
        </li>
        <li>
          <strong><em>d</em> = {D.toFixed(2)}</strong> — how much the
          argument-quality effect changes per one-unit increase in NFC. This is the
          interaction term. It is significant (<em>t</em>(96) = 3.56,{' '}
          <em>p</em> &lt; .001), telling us the effect of argument quality depends
          on NFC.
        </li>
      </ul>

      <p className="intro-text">
        The key row is the last one. A significant <em>d</em> means the two
        regression lines — one for strong arguments, one for weak — are not
        parallel. The argument-quality effect grows by {D.toFixed(2)} attitude
        points for every one-unit increase in NFC.
      </p>

      {/* ---- Marginal effects ---- */}
      <h3>Interpreting the Interaction as Marginal Effects</h3>

      <p className="intro-text">
        In a standard factorial ANOVA, the effect of a manipulation is a single
        number: the difference between condition means. With a continuous moderator,
        the effect of the manipulation is no longer a single number — it is a{' '}
        <em>function</em> of the moderator. To know what the{' '}
        <strong>marginal effect</strong> of the manipulation will be, we need to
        take the first derivative of the regression equation with respect to our
        intervention variable (Quality):
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">
            dY/dQuality = <em>b</em> + <em>d</em>(NFC) = {B} + {D} &times; NFC
          </span>
        </div>
      </div>

      <p className="intro-text">
        Because Quality is binary (0 vs. 1), this derivative equals the vertical gap
        between the two regression lines at any given NFC value. That gap depends on
        where you look along the NFC axis. The left panel below shows the two
        regression lines; the right panel plots the marginal effect as a function of
        NFC. Drag the slider to move along the NFC axis and watch how the gap between
        the lines (left) corresponds to the position on the marginal-effect line
        (right).
      </p>

      <div className="controls-row">
        <div className="control-group">
          <label>NFC</label>
          <input
            type="range"
            min={NFC_MIN}
            max={NFC_MAX}
            step={0.1}
            value={nfc}
            onChange={(e) => setNfc(Number(e.target.value))}
          />
          <span className="control-value">{nfc.toFixed(1)}</span>
        </div>
      </div>

      <div className="dual-panel">
        {/* ======== LEFT PANEL: Two Regression Lines ======== */}
        <div className="viz-container">
          <h4>Predicted Product Attitude</h4>
          <svg viewBox={`0 0 ${lWidth} ${lHeight}`} preserveAspectRatio="xMidYMid meet">
            <g transform={`translate(${lMargin.left}, ${lMargin.top})`}>
              {/* Y-axis */}
              <line
                x1={0} y1={0} x2={0} y2={lInnerH}
                stroke="var(--border)" strokeWidth="1"
              />
              {/* Y-axis ticks and labels */}
              {lYTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={-5} y1={lYScale(tick)} x2={0} y2={lYScale(tick)}
                    stroke="var(--border)"
                  />
                  <text
                    x={-10} y={lYScale(tick) + 4}
                    textAnchor="end" fontSize="10" fill="var(--text-secondary)"
                  >
                    {tick}
                  </text>
                </g>
              ))}
              {/* Y-axis label */}
              <text
                x={-40} y={lInnerH / 2}
                textAnchor="middle" fontSize="11" fill="var(--text-secondary)"
                transform={`rotate(-90, -40, ${lInnerH / 2})`}
              >
                Product Attitude (Y)
              </text>

              {/* X-axis */}
              <line
                x1={0} y1={lInnerH} x2={lInnerW} y2={lInnerH}
                stroke="var(--border)" strokeWidth="1"
              />
              {/* X-axis ticks and labels */}
              {xTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={xScale(tick, lInnerW)} y1={lInnerH}
                    x2={xScale(tick, lInnerW)} y2={lInnerH + 5}
                    stroke="var(--border)"
                  />
                  <text
                    x={xScale(tick, lInnerW)} y={lInnerH + 18}
                    textAnchor="middle" fontSize="10" fill="var(--text-secondary)"
                  >
                    {tick}
                  </text>
                </g>
              ))}
              {/* X-axis label */}
              <text
                x={lInnerW / 2} y={lInnerH + 35}
                textAnchor="middle" fontSize="11" fill="var(--text-secondary)"
              >
                NFC
              </text>

              {/* Z = 0 regression line (orange) */}
              <path
                d={linePathZ0}
                fill="none"
                stroke="#f4a261"
                strokeWidth="2.5"
              />
              {/* Z = 1 regression line (blue) */}
              <path
                d={linePathZ1}
                fill="none"
                stroke="#4361ee"
                strokeWidth="2.5"
              />

              {/* Vertical dashed line at current NFC */}
              <line
                x1={currentLX} y1={0} x2={currentLX} y2={lInnerH}
                stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4,3"
                opacity={0.5}
              />

              {/* Gap highlight: shaded region between lines */}
              {gap > 0 ? (
                <rect
                  x={currentLX - 3}
                  y={currentLY1}
                  width={6}
                  height={currentLY0 - currentLY1}
                  fill="rgba(67, 97, 238, 0.15)"
                  stroke="#4361ee"
                  strokeWidth="1"
                  strokeDasharray="3,2"
                />
              ) : (
                <rect
                  x={currentLX - 3}
                  y={currentLY0}
                  width={6}
                  height={currentLY1 - currentLY0}
                  fill="rgba(244, 162, 97, 0.15)"
                  stroke="#f4a261"
                  strokeWidth="1"
                  strokeDasharray="3,2"
                />
              )}

              {/* Bracket endpoints: dots on each line */}
              <circle cx={currentLX} cy={currentLY0} r={4} fill="#f4a261" />
              <circle cx={currentLX} cy={currentLY1} r={4} fill="#4361ee" />

              {/* Gap label */}
              <text
                x={currentLX + 10}
                y={(currentLY0 + currentLY1) / 2 + 4}
                fontSize="11"
                fontWeight="600"
                fill="var(--text-primary)"
              >
                {gap.toFixed(2)} pts
              </text>

              {/* Legend — top-left, above the plot area */}
              <line x1={4} y1={-10} x2={24} y2={-10} stroke="#4361ee" strokeWidth="2.5" />
              <text x={28} y={-6} fontSize="10" fill="var(--text-secondary)">Strong args (Z = 1)</text>
              <line x1={4} y1={6} x2={24} y2={6} stroke="#f4a261" strokeWidth="2.5" />
              <text x={28} y={10} fontSize="10" fill="var(--text-secondary)">Weak args (Z = 0)</text>
            </g>
          </svg>
        </div>

        {/* ======== RIGHT PANEL: Marginal Effect Line ======== */}
        <div className="viz-container">
          <h4>Marginal Effect of Argument Quality (dY/dQuality)</h4>
          <svg viewBox={`0 0 ${rWidth} ${rHeight}`} preserveAspectRatio="xMidYMid meet">
            <g transform={`translate(${rMargin.left}, ${rMargin.top})`}>
              {/* Y-axis */}
              <line
                x1={0} y1={0} x2={0} y2={rInnerH}
                stroke="var(--border)" strokeWidth="1"
              />
              {/* Y-axis ticks and labels */}
              {rYTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={-5} y1={rYScale(tick)} x2={0} y2={rYScale(tick)}
                    stroke="var(--border)"
                  />
                  <text
                    x={-10} y={rYScale(tick) + 4}
                    textAnchor="end" fontSize="10" fill="var(--text-secondary)"
                  >
                    {tick}
                  </text>
                </g>
              ))}
              {/* Y-axis label */}
              <text
                x={-40} y={rInnerH / 2}
                textAnchor="middle" fontSize="11" fill="var(--text-secondary)"
                transform={`rotate(-90, -40, ${rInnerH / 2})`}
              >
                Effect of Argument Quality
              </text>

              {/* X-axis */}
              <line
                x1={0} y1={rInnerH} x2={rInnerW} y2={rInnerH}
                stroke="var(--border)" strokeWidth="1"
              />
              {/* X-axis ticks and labels */}
              {xTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={xScale(tick, rInnerW)} y1={rInnerH}
                    x2={xScale(tick, rInnerW)} y2={rInnerH + 5}
                    stroke="var(--border)"
                  />
                  <text
                    x={xScale(tick, rInnerW)} y={rInnerH + 18}
                    textAnchor="middle" fontSize="10" fill="var(--text-secondary)"
                  >
                    {tick}
                  </text>
                </g>
              ))}
              {/* X-axis label */}
              <text
                x={rInnerW / 2} y={rInnerH + 35}
                textAnchor="middle" fontSize="11" fill="var(--text-secondary)"
              >
                NFC
              </text>

              {/* Horizontal dashed line at zero */}
              <line
                x1={0} y1={zeroLineY} x2={rInnerW} y2={zeroLineY}
                stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="6,4"
                opacity={0.5}
              />
              <text
                x={rInnerW + 2} y={zeroLineY + 4}
                fontSize="9" fill="var(--text-secondary)"
              >
                0
              </text>

              {/* Marginal effect line */}
              <path
                d={effectLinePath}
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2.5"
              />

              {/* Vertical dashed line at current NFC */}
              <line
                x1={currentRX} y1={0} x2={currentRX} y2={rInnerH}
                stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4,3"
                opacity={0.5}
              />

              {/* Tracking dot */}
              <circle
                cx={currentRX}
                cy={currentRY}
                r={6}
                fill="#7c3aed"
                stroke="white"
                strokeWidth="2"
              />

              {/* Value label at dot */}
              <text
                x={currentRX + 12}
                y={currentRY + 4}
                fontSize="11"
                fontWeight="600"
                fill="var(--text-primary)"
              >
                {effect.toFixed(2)}
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Computed expression */}
      <div className="formula-box">
        <h3>Computed Marginal Effect</h3>
        <div className="formula">
          <span className="formula-main">
            At NFC = {nfc.toFixed(1)}: &nbsp; dY/dQuality = {B} + ({D}) &times; {nfc.toFixed(1)} = {effect.toFixed(2)} attitude points
          </span>
        </div>
        <p className="intro-text" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.9rem' }}>
          Strong arguments increase product attitude by {effect.toFixed(2)} points for
          someone with an NFC of {nfc.toFixed(1)}. The Quality = 1 line sits{' '}
          {gap > 0 ? 'above' : 'below'} the Quality = 0 line by exactly this amount at
          that NFC value.
        </p>
      </div>

    </div>
  );
}
