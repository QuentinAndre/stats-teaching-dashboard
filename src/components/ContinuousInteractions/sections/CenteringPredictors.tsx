import { useState, useMemo } from 'react';

/**
 * CenteringPredictors (Section 6)
 *
 * Teaches why centering a continuous moderator matters for interpreting
 * the lower-order coefficients (a and b), but does not change the
 * interaction term d or the model's predictions.
 *
 * Model: Y = a + bZ + cX + dZX
 * Raw coefficients (NFC × Argument Quality): a = 5.80, b = -2.40, c = -0.22, d = 1.18
 * NFC: M = 3.20, SD = 0.70
 *
 * After recentering X' = X - center:
 *   a' = a + c * center
 *   b' = b + d * center
 *   c' = c   (unchanged)
 *   d' = d   (unchanged)
 */

// Raw model coefficients
const A_RAW = 5.80;
const B_RAW = -2.40;
const C_RAW = -0.22;
const D_RAW = 1.18;

const NFC_MEAN = 3.20;

// SVG layout constants
const SVG_WIDTH = 560;
const SVG_HEIGHT = 360;
const MARGIN = { top: 20, right: 30, bottom: 50, left: 55 };
const PLOT_W = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

// Axis ranges
const NFC_MIN = 1;
const NFC_MAX = 5;
const Y_MIN = 1;
const Y_MAX = 9;

const X_TICKS = [1, 2, 3, 4, 5];
const Y_TICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

type CenterMode = 'raw' | 'center3' | 'meanCenter';

interface CoefficientSet {
  a: number;
  b: number;
  c: number;
  d: number;
  centerValue: number | null; // null for raw (center at 0)
}

/** Compute re-parameterized coefficients for a given centering value */
function computeCoefficients(center: number): CoefficientSet {
  return {
    a: A_RAW + C_RAW * center,
    b: B_RAW + D_RAW * center,
    c: C_RAW,
    d: D_RAW,
    centerValue: center,
  };
}

const COEFF_RAW: CoefficientSet = {
  a: A_RAW,
  b: B_RAW,
  c: C_RAW,
  d: D_RAW,
  centerValue: null,
};
const COEFF_3 = computeCoefficients(3);
const COEFF_MEAN = computeCoefficients(NFC_MEAN);

/** Map data-space NFC to SVG x */
function toSvgX(nfc: number): number {
  return MARGIN.left + ((nfc - NFC_MIN) / (NFC_MAX - NFC_MIN)) * PLOT_W;
}

/** Map data-space Y to SVG y (inverted) */
function toSvgY(y: number): number {
  return MARGIN.top + PLOT_H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

/** Predicted Y from the raw model (always the same regardless of centering) */
function predictY(nfc: number, z: number): number {
  return A_RAW + B_RAW * z + C_RAW * nfc + D_RAW * z * nfc;
}

export default function CenteringPredictors() {
  const [mode, setMode] = useState<CenterMode>('raw');

  const activeCoeffs = useMemo((): CoefficientSet => {
    switch (mode) {
      case 'center3':
        return COEFF_3;
      case 'meanCenter':
        return COEFF_MEAN;
      default:
        return COEFF_RAW;
    }
  }, [mode]);

  // The NFC value that corresponds to "X' = 0" in the current parameterization
  const zeroPointNFC = useMemo((): number => {
    if (mode === 'raw') return 0;
    if (mode === 'center3') return 3;
    return NFC_MEAN;
  }, [mode]);

  // The gap between lines (Z=1 minus Z=0) at the current zero point
  const gapAtZero = activeCoeffs.b;

  // Regression line endpoints (predictions are always the same)
  const z0Start = predictY(NFC_MIN, 0);
  const z0End = predictY(NFC_MAX, 0);
  const z1Start = predictY(NFC_MIN, 1);
  const z1End = predictY(NFC_MAX, 1);

  // Whether the zero-point arrow is within the visible plot range
  const zeroInRange = zeroPointNFC >= NFC_MIN && zeroPointNFC <= NFC_MAX;

  // Y values at the zero point for drawing the gap bracket
  const yAtZeroZ0 = predictY(zeroPointNFC, 0);
  const yAtZeroZ1 = predictY(zeroPointNFC, 1);

  return (
    <div className="section-intro">
      <h2>Centering Predictors</h2>

      <p className="intro-text">
        The central message from the previous sections is this: <em>b</em> is the
        effect of Z when X = 0. If X = 0 is impossible — nobody scores 0 on the
        NFC scale, which runs from 1 to 5 — then <em>b</em> is uninterpretable.
        This is the "magic number zero" problem. The coefficient <em>b</em> = {B_RAW.toFixed(2)} does
        not describe any real person's response. It describes what the model
        predicts at a point that lies far outside the data.
      </p>

      <h3>What Recentering Does</h3>

      <p className="intro-text">
        Recentering replaces the original predictor X with a shifted version
        X' = X &minus; <em>center</em>, where <em>center</em> is a meaningful reference
        value. After substitution, the model becomes Y = <em>a'</em> + <em>b'</em>Z
        + <em>c'</em>X' + <em>d'</em>ZX', with new lower-order coefficients:
      </p>

      <div className="formula-box">
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol"><em>a'</em> = a + c &times; center</span>
            <span className="explanation">
              New intercept: predicted Y when Z = 0 and X = center
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol"><em>b'</em> = b + d &times; center</span>
            <span className="explanation">
              New simple effect of Z at X = center
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol"><em>c'</em> = c</span>
            <span className="explanation">Unchanged</span>
          </div>
          <div className="formula-part">
            <span className="symbol"><em>d'</em> = d</span>
            <span className="explanation">Unchanged</span>
          </div>
        </div>
      </div>

      <p className="intro-text">
        The predictions are identical. Every participant gets the same predicted Y
        before and after centering. The model has not changed — it has been
        re-parameterized. The interaction coefficient <em>d</em> and the NFC slope
        for Z = 0 (<em>c</em>) never change. Only <em>a</em> and <em>b</em> shift,
        because they describe the model at the zero point, and centering moves
        where that zero point falls.
      </p>

      <h3>Choosing the Zero Point</h3>

      <p className="intro-text">
        Use the toggle below to switch between three parameterizations: the raw
        model (zero at NFC = 0, which is off the scale), centering at NFC = 3
        (the scale midpoint), and mean-centering at NFC = {NFC_MEAN}. The
        regression lines do not move — they are the same lines. What changes is
        the location of the "X = 0" reference point and, consequently, the
        meaning of <em>b</em>.
      </p>

      <div className="viz-container">
        <h4>Regression Lines with Different Zero Points</h4>

        {/* Toggle group */}
        <div className="toggle-group">
          <button
            className={`toggle-button ${mode === 'raw' ? 'active' : ''}`}
            onClick={() => setMode('raw')}
          >
            Raw (zero at 0)
          </button>
          <button
            className={`toggle-button ${mode === 'center3' ? 'active' : ''}`}
            onClick={() => setMode('center3')}
            style={{ borderRight: 'none' }}
          >
            Centered at NFC 3
          </button>
          <button
            className={`toggle-button ${mode === 'meanCenter' ? 'active' : ''}`}
            onClick={() => setMode('meanCenter')}
          >
            Mean-centered ({NFC_MEAN})
          </button>
        </div>

        {/* SVG plot */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ width: '100%', height: 'auto' }}
          role="img"
          aria-label="Two regression lines for Z=0 and Z=1 with a marker showing where X equals zero falls under the current centering"
        >
          {/* Plot background */}
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--bg-primary, #fff)"
            stroke="var(--border, #ccc)"
            strokeWidth={1}
          />

          {/* Y-axis gridlines and labels */}
          {Y_TICKS.map((tick) => {
            const y = toSvgY(tick);
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={MARGIN.left}
                  y1={y}
                  x2={MARGIN.left + PLOT_W}
                  y2={y}
                  stroke="var(--border, #e0e0e0)"
                  strokeWidth={0.5}
                  strokeDasharray="4 3"
                />
                <line
                  x1={MARGIN.left - 5}
                  y1={y}
                  x2={MARGIN.left}
                  y2={y}
                  stroke="var(--text-secondary, #666)"
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="var(--text-secondary, #666)"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X-axis tick marks and labels */}
          {X_TICKS.map((tick) => {
            const x = toSvgX(tick);
            return (
              <g key={`x-${tick}`}>
                <line
                  x1={x}
                  y1={MARGIN.top + PLOT_H}
                  x2={x}
                  y2={MARGIN.top + PLOT_H + 5}
                  stroke="var(--text-secondary, #666)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={MARGIN.top + PLOT_H + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary, #666)"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X-axis label */}
          <text
            x={MARGIN.left + PLOT_W / 2}
            y={SVG_HEIGHT - 5}
            textAnchor="middle"
            fontSize={13}
            fill="var(--text-primary, #333)"
          >
            Need for Cognition
          </text>

          {/* Y-axis label */}
          <text
            x={15}
            y={MARGIN.top + PLOT_H / 2}
            textAnchor="middle"
            fontSize={13}
            fill="var(--text-primary, #333)"
            transform={`rotate(-90, 15, ${MARGIN.top + PLOT_H / 2})`}
          >
            Product Attitude
          </text>

          {/* Clipping region */}
          <defs>
            <clipPath id="centering-plot-clip">
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={PLOT_W}
                height={PLOT_H}
              />
            </clipPath>
          </defs>

          {/* Z = 0 line (orange — weak arguments) */}
          <line
            x1={toSvgX(NFC_MIN)}
            y1={toSvgY(z0Start)}
            x2={toSvgX(NFC_MAX)}
            y2={toSvgY(z0End)}
            stroke="#f4a261"
            strokeWidth={2.5}
            clipPath="url(#centering-plot-clip)"
          />

          {/* Z = 1 line (blue — strong arguments) */}
          <line
            x1={toSvgX(NFC_MIN)}
            y1={toSvgY(z1Start)}
            x2={toSvgX(NFC_MAX)}
            y2={toSvgY(z1End)}
            stroke="#4361ee"
            strokeWidth={2.5}
            clipPath="url(#centering-plot-clip)"
          />

          {/* Zero-point indicator */}
          {mode === 'raw' ? (
            /* Raw mode: zero is at NFC=0, off-screen to the left */
            <g>
              <text
                x={MARGIN.left + 8}
                y={MARGIN.top + PLOT_H - 14}
                fontSize={11}
                fill="#e74c3c"
                fontStyle="italic"
              >
                X = 0 is at NFC = 0, off the scale to the left
              </text>
              {/* Left-pointing arrow at the left edge of the plot */}
              <polygon
                points={`${MARGIN.left + 2},${MARGIN.top + PLOT_H - 28} ${MARGIN.left + 12},${MARGIN.top + PLOT_H - 23} ${MARGIN.left + 12},${MARGIN.top + PLOT_H - 33}`}
                fill="#e74c3c"
              />
            </g>
          ) : (
            /* Centered modes: show the zero-point marker on the x-axis */
            zeroInRange && (
              <g>
                {/* Vertical dashed reference line */}
                <line
                  x1={toSvgX(zeroPointNFC)}
                  y1={MARGIN.top}
                  x2={toSvgX(zeroPointNFC)}
                  y2={MARGIN.top + PLOT_H}
                  stroke="#e74c3c"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  clipPath="url(#centering-plot-clip)"
                />

                {/* Arrow marker on the x-axis */}
                <polygon
                  points={`${toSvgX(zeroPointNFC)},${MARGIN.top + PLOT_H} ${toSvgX(zeroPointNFC) - 5},${MARGIN.top + PLOT_H + 10} ${toSvgX(zeroPointNFC) + 5},${MARGIN.top + PLOT_H + 10}`}
                  fill="#e74c3c"
                />

                {/* Label below the arrow */}
                <text
                  x={toSvgX(zeroPointNFC)}
                  y={MARGIN.top + PLOT_H + 35}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#e74c3c"
                  fontWeight={600}
                >
                  X' = 0
                </text>

                {/* Gap bracket between the two lines at the zero point */}
                {yAtZeroZ0 >= Y_MIN && yAtZeroZ1 <= Y_MAX && (
                  <g>
                    {/* Bracket line */}
                    <line
                      x1={toSvgX(zeroPointNFC) + 8}
                      y1={toSvgY(yAtZeroZ0)}
                      x2={toSvgX(zeroPointNFC) + 8}
                      y2={toSvgY(yAtZeroZ1)}
                      stroke="#e74c3c"
                      strokeWidth={1.5}
                      clipPath="url(#centering-plot-clip)"
                    />
                    {/* Top tick of bracket */}
                    <line
                      x1={toSvgX(zeroPointNFC) + 5}
                      y1={toSvgY(yAtZeroZ1)}
                      x2={toSvgX(zeroPointNFC) + 11}
                      y2={toSvgY(yAtZeroZ1)}
                      stroke="#e74c3c"
                      strokeWidth={1.5}
                      clipPath="url(#centering-plot-clip)"
                    />
                    {/* Bottom tick of bracket */}
                    <line
                      x1={toSvgX(zeroPointNFC) + 5}
                      y1={toSvgY(yAtZeroZ0)}
                      x2={toSvgX(zeroPointNFC) + 11}
                      y2={toSvgY(yAtZeroZ0)}
                      stroke="#e74c3c"
                      strokeWidth={1.5}
                      clipPath="url(#centering-plot-clip)"
                    />
                    {/* Gap label */}
                    <text
                      x={toSvgX(zeroPointNFC) + 16}
                      y={(toSvgY(yAtZeroZ0) + toSvgY(yAtZeroZ1)) / 2}
                      dominantBaseline="middle"
                      fontSize={11}
                      fill="#e74c3c"
                      fontWeight={600}
                    >
                      b' = {gapAtZero.toFixed(2)}
                    </text>
                  </g>
                )}
              </g>
            )
          )}

          {/* Legend */}
          <g transform={`translate(${MARGIN.left + PLOT_W - 175}, ${MARGIN.top + 10})`}>
            <rect
              x={0}
              y={0}
              width={165}
              height={48}
              rx={4}
              fill="var(--bg-primary, #fff)"
              fillOpacity={0.9}
              stroke="var(--border, #ccc)"
              strokeWidth={0.5}
            />
            <line x1={10} y1={16} x2={30} y2={16} stroke="#4361ee" strokeWidth={2.5} />
            <text x={36} y={16} dominantBaseline="middle" fontSize={11} fill="var(--text-primary, #333)">
              Z = 1 (strong args)
            </text>
            <line x1={10} y1={34} x2={30} y2={34} stroke="#f4a261" strokeWidth={2.5} />
            <text x={36} y={34} dominantBaseline="middle" fontSize={11} fill="var(--text-primary, #333)">
              Z = 0 (weak args)
            </text>
          </g>
        </svg>

        {/* Summary below plot */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-sm)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {mode === 'raw' ? (
            <>
              <em>b</em> = {B_RAW.toFixed(2)} is the effect of Z at NFC = 0.
              Nobody has NFC = 0 — this number is not interpretable.
            </>
          ) : (
            <>
              <em>b'</em> = {gapAtZero.toFixed(2)} is the effect of Z at NFC ={' '}
              {mode === 'center3' ? '3' : NFC_MEAN.toFixed(2)} — a value
              within the observed data range.
            </>
          )}
        </div>
      </div>

      {/* ---- Coefficient comparison table ---- */}
      <h3>Coefficient Comparison</h3>

      <p className="intro-text">
        The table below compares the four coefficients under each parameterization.
        Notice that <em>c</em> and <em>d</em> are identical in every column.
        Only the lower-order terms — the intercept and the simple effect of Z —
        change when the zero point moves.
      </p>

      <table className="coeff-table">
        <thead>
          <tr>
            <th>Coefficient</th>
            <th>Raw</th>
            <th>Centered at 3</th>
            <th>Mean-centered ({NFC_MEAN})</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><em>a</em> (intercept)</td>
            <td>{COEFF_RAW.a.toFixed(2)}</td>
            <td>{COEFF_3.a.toFixed(2)}</td>
            <td>{COEFF_MEAN.a.toFixed(2)}</td>
          </tr>
          <tr>
            <td><em>b</em> (effect of Z at X = 0)</td>
            <td>{COEFF_RAW.b.toFixed(2)}</td>
            <td>{COEFF_3.b.toFixed(2)}</td>
            <td>{COEFF_MEAN.b.toFixed(2)}</td>
          </tr>
          <tr className="highlight-row" style={{ fontWeight: 600 }}>
            <td><em>c</em> (slope of NFC for Z = 0)</td>
            <td>{COEFF_RAW.c.toFixed(2)}</td>
            <td>{COEFF_3.c.toFixed(2)}</td>
            <td>{COEFF_MEAN.c.toFixed(2)}</td>
          </tr>
          <tr className="highlight-row" style={{ fontWeight: 600 }}>
            <td><em>d</em> (interaction)</td>
            <td>{COEFF_RAW.d.toFixed(2)}</td>
            <td>{COEFF_3.d.toFixed(2)}</td>
            <td>{COEFF_MEAN.d.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <p className="intro-text" style={{ fontSize: '0.8125rem', fontStyle: 'italic' }}>
        Rows for <em>c</em> and <em>d</em> are highlighted because they are
        invariant across all centering choices. The interaction test (for <em>d</em>)
        produces the same <em>t</em>-statistic, the same <em>p</em>-value, and
        the same confidence interval no matter where you place the zero point.
      </p>

      {/* ---- Key insight ---- */}
      <div className="key-insight">
        <h4>The Takeaway</h4>
        <p>
          Centering does not change predictions or the interaction test. It changes
          what <em>b</em> means. Choose the zero point that makes <em>b</em>{' '}
          interpretable — a meaningful value of the moderator, not an impossible
          extrapolation. Common choices are the sample mean (making <em>b</em> the
          effect at the average moderator level) or a theoretically important
          threshold. The wrong choice is to leave zero at a value nobody occupies
          and then try to interpret <em>b</em> anyway.
        </p>
      </div>
    </div>
  );
}
