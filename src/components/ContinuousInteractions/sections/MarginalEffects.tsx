import { useState, useMemo } from 'react';

/**
 * Section 3: Marginal Effects
 *
 * Teaches that the "effect of the manipulation" in a model with a continuous
 * moderator is not a single number but a linear function of the moderator.
 *
 * Model: Y = a + bZ + cX + dZX
 *   where Z = argument quality (0/1), X = NFC (continuous moderator)
 *
 * The marginal effect of Z is the first derivative dY/dZ = b + dX,
 * which equals the vertical gap between the Z=0 and Z=1 regression lines
 * at any given value of X.
 *
 * Coefficients from the NFC × Argument Quality example:
 *   a = 5.80, b = -2.40, c = -0.22, d = 1.18
 */

// Default model coefficients
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

// Marginal effect of Z at a given NFC: dY/dZ = b + d * NFC
function marginalEffect(nfc: number): number {
  return B + D * nfc;
}

export default function MarginalEffects() {
  const [nfc, setNfc] = useState(NFC_DEFAULT);

  // Computed values
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
      <h2>Marginal Effects: The Effect Is a Function</h2>

      <p className="intro-text">
        In a standard factorial ANOVA, you can describe the effect of a manipulation as
        a single number: the difference between condition means. But when a moderator is
        continuous, the effect of the manipulation is no longer a single number. It is a{' '}
        <em>function</em> of the moderator.
      </p>

      <p className="intro-text">
        Consider our regression model: <em>Y</em> = <em>a</em> + <em>b</em>Z + <em>c</em>X + <em>d</em>ZX.
        The manipulation variable Z takes values 0 (weak arguments) or 1 (strong arguments).
        To find the effect of Z on Y, we take the first derivative with respect to Z:
      </p>

      <div className="formula-box">
        <h3>The Marginal Effect of Argument Quality</h3>
        <div className="formula">
          <span className="formula-main">dY/dZ = b + dX</span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">b = {B}</span>
            <span className="explanation">
              The effect of Z when X = 0
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">d = {D}</span>
            <span className="explanation">
              How the effect of Z changes per unit increase in X
            </span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        Because Z is binary (0 vs. 1), this derivative has a concrete meaning: it equals
        the gap between the two regression lines at any given NFC value. When Z goes from
        0 to 1, predicted Y changes by exactly <em>b</em> + <em>d</em> &times; NFC.
        That gap depends on where you look along the NFC axis.
      </p>

      <h3>Interactive Visualization</h3>

      <p className="intro-text">
        The left panel shows the two regression lines from the persuasion model. The right
        panel plots the marginal effect of argument quality (dY/dZ = <em>b</em> + <em>d</em> &times; NFC)
        as a function of NFC. Drag the slider to move along the NFC axis and watch how the
        gap between the lines (left) corresponds to the position on the marginal effect
        line (right).
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

              {/* Legend */}
              <line x1={lInnerW - 110} y1={12} x2={lInnerW - 90} y2={12} stroke="#4361ee" strokeWidth="2.5" />
              <text x={lInnerW - 86} y={16} fontSize="10" fill="var(--text-secondary)">Z = 1 (strong)</text>
              <line x1={lInnerW - 110} y1={28} x2={lInnerW - 90} y2={28} stroke="#f4a261" strokeWidth="2.5" />
              <text x={lInnerW - 86} y={32} fontSize="10" fill="var(--text-secondary)">Z = 0 (weak)</text>
            </g>
          </svg>
        </div>

        {/* ======== RIGHT PANEL: Marginal Effect Line ======== */}
        <div className="viz-container">
          <h4>Marginal Effect of Argument Quality (dY/dZ)</h4>
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
            At NFC = {nfc.toFixed(1)}: &nbsp; dY/dZ = {B} + ({D}) &times; {nfc.toFixed(1)} = {effect.toFixed(2)} attitude points
          </span>
        </div>
        <p className="intro-text" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.9rem' }}>
          Strong arguments increase product attitude by {effect.toFixed(2)} points for
          someone with an NFC of {nfc.toFixed(1)}. The Z = 1 line sits{' '}
          {gap > 0 ? 'above' : 'below'} the Z = 0 line by exactly this amount at that
          NFC value.
        </p>
      </div>

      <div className="key-insight">
        <h4>The Right Panel IS the Derivative</h4>
        <p>
          The marginal effect line in the right panel is a direct plot of the first
          derivative dY/dZ = <em>b</em> + <em>d</em> &times; NFC. Its intercept is{' '}
          <em>b</em> = {B} (the effect of argument quality when NFC = 0, an extrapolation)
          and its slope is <em>d</em> = {D} (how much the argument-quality effect
          increases per one-unit increase in NFC). At NFC = 2, the argument-quality effect
          is {B} + ({D})(2) = {(B + D * 2).toFixed(2)} points. At NFC = 4, it grows to{' '}
          {(B + D * 4).toFixed(2)} points. Strong arguments have a larger impact on
          high-NFC individuals, and the right panel makes this immediately visible as
          an upward-sloping line.
        </p>
      </div>

    </div>
  );
}
