import { useState, useMemo } from 'react';
import {
  generateSpotlightData,
  fitModeratedRegression,
  simpleEffectTTest,
  johnsonNeymanBoundaries,
  marginalEffectWithCI,
} from '../../../utils/statistics';

/**
 * PuttingItAllTogether (Section 7)
 *
 * Final section of the Continuous Moderators module. Two parts:
 *   A) A worked-example recap walking through the NFC × Argument Quality
 *      dataset using the module's coefficients.
 *   B) An interactive sandbox where students set population parameters, generate
 *      simulated data, and see all four analysis views side by side.
 */

// ---------- Constants ----------

const X_MEAN = 3.20;
const X_SD = 0.70;

// Colors
const BLUE = '#4361ee';
const ORANGE = '#f4a261';
const GREEN_SIG = 'rgba(16, 185, 129, 0.15)';
const GRAY_NS = 'rgba(156, 163, 175, 0.15)';

// SVG dimensions for sandbox panels
const PW = 280;
const PH = 200;
const PM = { top: 20, right: 15, bottom: 30, left: 40 };
const INNER_W = PW - PM.left - PM.right;
const INNER_H = PH - PM.top - PM.bottom;

// ---------- SVG helpers ----------

function scaleX(val: number, xMin: number, xMax: number): number {
  return PM.left + ((val - xMin) / (xMax - xMin)) * INNER_W;
}

function scaleY(val: number, yMin: number, yMax: number): number {
  return PM.top + INNER_H - ((val - yMin) / (yMax - yMin)) * INNER_H;
}

/** Clamp a value to the SVG plotting region */
function clampY(val: number, yMin: number, yMax: number): number {
  const svgY = scaleY(val, yMin, yMax);
  return Math.max(PM.top, Math.min(PM.top + INNER_H, svgY));
}

// ---------- Component ----------

export default function PuttingItAllTogether() {
  // --- Sandbox state ---
  const [paramA, setParamA] = useState(5.80);
  const [paramB, setParamB] = useState(-2.40);
  const [paramC, setParamC] = useState(-0.22);
  const [paramD, setParamD] = useState(1.18);
  const [residualSD, setResidualSD] = useState(1.5);
  const [n, setN] = useState(100);

  const [generatedData, setGeneratedData] = useState<
    { x: number; z: number; y: number }[] | null
  >(null);

  // --- Derived model from generated data ---
  const fittedModel = useMemo(() => {
    if (!generatedData) return null;
    return fitModeratedRegression(generatedData);
  }, [generatedData]);

  // --- Derived plot data ---
  const plotData = useMemo(() => {
    if (!generatedData || !fittedModel) return null;

    const xs = generatedData.map((d) => d.x);
    const ys = generatedData.map((d) => d.y);
    const xMin = Math.floor(Math.min(...xs) * 2) / 2;
    const xMax = Math.ceil(Math.max(...xs) * 2) / 2;
    const yMin = Math.floor(Math.min(...ys) - 1);
    const yMax = Math.ceil(Math.max(...ys) + 1);

    // Variance-covariance entries: order is [intercept, Z, X, ZX]
    const varB = fittedModel.varCovar[1][1];
    const varD = fittedModel.varCovar[3][3];
    const covBD = fittedModel.varCovar[1][3];

    // Regression line endpoints
    const z0AtXmin = fittedModel.a + fittedModel.c * xMin;
    const z0AtXmax = fittedModel.a + fittedModel.c * xMax;
    const z1AtXmin =
      fittedModel.a + fittedModel.b + (fittedModel.c + fittedModel.d) * xMin;
    const z1AtXmax =
      fittedModel.a + fittedModel.b + (fittedModel.c + fittedModel.d) * xMax;

    // Marginal effect band
    const nSteps = 80;
    const xVals: number[] = [];
    for (let i = 0; i <= nSteps; i++) {
      xVals.push(xMin + (i / nSteps) * (xMax - xMin));
    }
    const marginalBand = marginalEffectWithCI(
      fittedModel.b,
      fittedModel.d,
      varB,
      varD,
      covBD,
      fittedModel.df,
      0.05,
      xVals
    );

    // Effect range for derivative plot
    const allEffects = marginalBand.flatMap((m) => [m.lower, m.upper, m.effect]);
    const effMin = Math.floor(Math.min(...allEffects) - 1);
    const effMax = Math.ceil(Math.max(...allEffects) + 1);

    // JN boundaries
    const jn = johnsonNeymanBoundaries(
      fittedModel.b,
      fittedModel.d,
      varB,
      varD,
      covBD,
      fittedModel.df,
      0.05
    );

    // Spotlight tests at mean - SD, mean, mean + SD
    const spotlightValues = [X_MEAN - X_SD, X_MEAN, X_MEAN + X_SD];
    const spotlightResults = spotlightValues.map((xVal) =>
      simpleEffectTTest(
        fittedModel.b,
        fittedModel.d,
        varB,
        varD,
        covBD,
        xVal,
        fittedModel.df
      )
    );

    return {
      xMin,
      xMax,
      yMin,
      yMax,
      z0AtXmin,
      z0AtXmax,
      z1AtXmin,
      z1AtXmax,
      marginalBand,
      effMin,
      effMax,
      jn,
      spotlightValues,
      spotlightResults,
      varB,
      varD,
      covBD,
    };
  }, [generatedData, fittedModel]);

  // --- Generate handler ---
  function handleGenerate() {
    const data = generateSpotlightData(
      n,
      paramA,
      paramB,
      paramC,
      paramD,
      residualSD,
      X_MEAN,
      X_SD
    );
    setGeneratedData(data);
  }

  // --- Render ---
  return (
    <div className="section-intro">
      <h2>Putting It All Together</h2>

      {/* ========== PART A: Recap ========== */}
      <h3>Recap: NFC &times; Argument Quality</h3>

      <p className="intro-text">
        Across the previous sections we fit <em>Y</em> = 5.80 + (&minus;2.40)Z
        + (&minus;0.22)X + 1.18ZX, confirmed the interaction (<em>d</em> = 1.18,{' '}
        <em>p</em> &lt; .001), and probed it in two ways. Spotlight tests showed
        the argument-quality effect is not significant at 1 SD below the mean
        (NFC = {(X_MEAN - X_SD).toFixed(2)}) but is significant at the mean
        ({X_MEAN.toFixed(2)}) and above. The Johnson-Neyman boundary
        (&asymp; 2.03) pinpoints where significance begins, without requiring
        the researcher to pick specific spotlight values. Finally, centering X at
        the sample mean makes the regression coefficient <em>b'</em> ={' '}
        {(-2.40 + 1.18 * X_MEAN).toFixed(2)} directly interpretable as the
        manipulation effect for the average participant.
      </p>

      {/* ========== PART B: Interactive Sandbox ========== */}
      <h3>Interactive Sandbox</h3>

      <p className="intro-text">
        Set the population parameters below and generate a simulated dataset.
        The sandbox will fit the moderated regression model to the simulated
        data and display the scatterplot, regression lines, derivative plot, and
        spotlight table — all derived from a single set of estimated
        coefficients. Because the data are randomly generated, the estimates
        will differ from the population values. Generate several datasets to see
        how sampling variability affects every downstream analysis.
      </p>

      {/* --- Controls --- */}
      <div className="controls-row">
        <div className="control-group">
          <label>
            <em>a</em> (intercept)
          </label>
          <input
            type="range"
            min={1}
            max={9}
            step={0.05}
            value={paramA}
            onChange={(e) => setParamA(Number(e.target.value))}
          />
          <span className="control-value">{paramA.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>
            <em>b</em> (Z effect at X=0)
          </label>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.1}
            value={paramB}
            onChange={(e) => setParamB(Number(e.target.value))}
          />
          <span className="control-value">{paramB.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>
            <em>c</em> (X slope at Z=0)
          </label>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.01}
            value={paramC}
            onChange={(e) => setParamC(Number(e.target.value))}
          />
          <span className="control-value">{paramC.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>
            <em>d</em> (interaction)
          </label>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.05}
            value={paramD}
            onChange={(e) => setParamD(Number(e.target.value))}
          />
          <span className="control-value">{paramD.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>Residual SD</label>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.25}
            value={residualSD}
            onChange={(e) => setResidualSD(Number(e.target.value))}
          />
          <span className="control-value">{residualSD.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>
            <em>n</em> (sample size)
          </label>
          <input
            type="range"
            min={30}
            max={200}
            step={10}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
          <span className="control-value">{n}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <button className="generate-button" onClick={handleGenerate}>
          Generate Data
        </button>
      </div>

      {/* --- Sandbox panels --- */}
      {!generatedData || !fittedModel || !plotData ? (
        <div
          className="viz-container"
          style={{ textAlign: 'center', padding: '3rem' }}
        >
          <p className="intro-text" style={{ margin: 0 }}>
            Click <strong>Generate Data</strong> to begin.
          </p>
        </div>
      ) : (
        <div className="sandbox-grid">
          {/* Panel 1: Scatterplot */}
          <div className="sandbox-panel">
            <h5>Scatterplot</h5>
            <svg
              viewBox={`0 0 ${PW} ${PH}`}
              style={{ width: '100%', height: 'auto' }}
            >
              {/* Plot background */}
              <rect
                x={PM.left}
                y={PM.top}
                width={INNER_W}
                height={INNER_H}
                fill="var(--bg-primary, #fff)"
                stroke="var(--border, #ccc)"
                strokeWidth={0.5}
              />
              {/* Axes labels */}
              <text
                x={PM.left}
                y={PM.top - 5}
                fontSize={9}
                fill="var(--text-secondary, #666)"
              >
                {plotData.yMax}
              </text>
              <text
                x={PM.left}
                y={PM.top + INNER_H + 10}
                fontSize={9}
                fill="var(--text-secondary, #666)"
                dominantBaseline="hanging"
              >
                {plotData.yMin}
              </text>
              <text
                x={PM.left}
                y={PM.top + INNER_H + 22}
                fontSize={9}
                fill="var(--text-secondary, #666)"
                dominantBaseline="hanging"
              >
                {plotData.xMin}
              </text>
              <text
                x={PM.left + INNER_W}
                y={PM.top + INNER_H + 22}
                fontSize={9}
                fill="var(--text-secondary, #666)"
                textAnchor="end"
                dominantBaseline="hanging"
              >
                {plotData.xMax}
              </text>
              <text
                x={PM.left + INNER_W / 2}
                y={PH - 2}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-primary, #333)"
              >
                NFC
              </text>
              <text
                x={8}
                y={PM.top + INNER_H / 2}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-primary, #333)"
                transform={`rotate(-90, 8, ${PM.top + INNER_H / 2})`}
              >
                Attitude
              </text>
              {/* Data points */}
              <defs>
                <clipPath id="scatter-clip">
                  <rect
                    x={PM.left}
                    y={PM.top}
                    width={INNER_W}
                    height={INNER_H}
                  />
                </clipPath>
              </defs>
              <g clipPath="url(#scatter-clip)">
                {generatedData.map((pt, i) => (
                  <circle
                    key={i}
                    cx={scaleX(pt.x, plotData.xMin, plotData.xMax)}
                    cy={scaleY(pt.y, plotData.yMin, plotData.yMax)}
                    r={2}
                    fill={pt.z === 1 ? BLUE : ORANGE}
                    opacity={0.6}
                  />
                ))}
              </g>
              {/* Legend */}
              <g transform={`translate(${PM.left + 5}, ${PM.top + 5})`}>
                <rect
                  width={70}
                  height={28}
                  rx={3}
                  fill="var(--bg-primary, #fff)"
                  fillOpacity={0.85}
                  stroke="var(--border, #ccc)"
                  strokeWidth={0.5}
                />
                <circle cx={10} cy={9} r={3} fill={BLUE} />
                <text x={17} y={9} dominantBaseline="middle" fontSize={8} fill="var(--text-primary, #333)">
                  Z = 1
                </text>
                <circle cx={10} cy={20} r={3} fill={ORANGE} />
                <text x={17} y={20} dominantBaseline="middle" fontSize={8} fill="var(--text-primary, #333)">
                  Z = 0
                </text>
              </g>
            </svg>
          </div>

          {/* Panel 2: Regression Lines */}
          <div className="sandbox-panel">
            <h5>Fitted Regression Lines</h5>
            <svg
              viewBox={`0 0 ${PW} ${PH}`}
              style={{ width: '100%', height: 'auto' }}
            >
              <rect
                x={PM.left}
                y={PM.top}
                width={INNER_W}
                height={INNER_H}
                fill="var(--bg-primary, #fff)"
                stroke="var(--border, #ccc)"
                strokeWidth={0.5}
              />
              {/* Axis labels */}
              <text
                x={PM.left}
                y={PM.top - 5}
                fontSize={9}
                fill="var(--text-secondary, #666)"
              >
                {plotData.yMax}
              </text>
              <text
                x={PM.left}
                y={PM.top + INNER_H + 10}
                fontSize={9}
                fill="var(--text-secondary, #666)"
                dominantBaseline="hanging"
              >
                {plotData.yMin}
              </text>
              <text
                x={PM.left}
                y={PM.top + INNER_H + 22}
                fontSize={9}
                fill="var(--text-secondary, #666)"
                dominantBaseline="hanging"
              >
                {plotData.xMin}
              </text>
              <text
                x={PM.left + INNER_W}
                y={PM.top + INNER_H + 22}
                fontSize={9}
                fill="var(--text-secondary, #666)"
                textAnchor="end"
                dominantBaseline="hanging"
              >
                {plotData.xMax}
              </text>
              <text
                x={PM.left + INNER_W / 2}
                y={PH - 2}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-primary, #333)"
              >
                NFC
              </text>
              <text
                x={8}
                y={PM.top + INNER_H / 2}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-primary, #333)"
                transform={`rotate(-90, 8, ${PM.top + INNER_H / 2})`}
              >
                Attitude
              </text>
              {/* Regression lines */}
              <defs>
                <clipPath id="reglines-clip">
                  <rect
                    x={PM.left}
                    y={PM.top}
                    width={INNER_W}
                    height={INNER_H}
                  />
                </clipPath>
              </defs>
              <g clipPath="url(#reglines-clip)">
                {/* Z = 0 (orange) */}
                <line
                  x1={scaleX(plotData.xMin, plotData.xMin, plotData.xMax)}
                  y1={scaleY(plotData.z0AtXmin, plotData.yMin, plotData.yMax)}
                  x2={scaleX(plotData.xMax, plotData.xMin, plotData.xMax)}
                  y2={scaleY(plotData.z0AtXmax, plotData.yMin, plotData.yMax)}
                  stroke={ORANGE}
                  strokeWidth={2}
                />
                {/* Z = 1 (blue) */}
                <line
                  x1={scaleX(plotData.xMin, plotData.xMin, plotData.xMax)}
                  y1={scaleY(plotData.z1AtXmin, plotData.yMin, plotData.yMax)}
                  x2={scaleX(plotData.xMax, plotData.xMin, plotData.xMax)}
                  y2={scaleY(plotData.z1AtXmax, plotData.yMin, plotData.yMax)}
                  stroke={BLUE}
                  strokeWidth={2}
                />
              </g>
              {/* Estimated coefficients readout */}
              <text
                x={PM.left + INNER_W / 2}
                y={PM.top + INNER_H + 12}
                textAnchor="middle"
                fontSize={7.5}
                fill="var(--text-secondary, #666)"
              >
                a&#x302;={fittedModel.a.toFixed(2)} b&#x302;=
                {fittedModel.b.toFixed(2)} c&#x302;=
                {fittedModel.c.toFixed(2)} d&#x302;=
                {fittedModel.d.toFixed(2)}
              </text>
              {/* Legend */}
              <g transform={`translate(${PM.left + 5}, ${PM.top + 5})`}>
                <rect
                  width={70}
                  height={28}
                  rx={3}
                  fill="var(--bg-primary, #fff)"
                  fillOpacity={0.85}
                  stroke="var(--border, #ccc)"
                  strokeWidth={0.5}
                />
                <line x1={6} y1={9} x2={20} y2={9} stroke={BLUE} strokeWidth={2} />
                <text x={24} y={9} dominantBaseline="middle" fontSize={8} fill="var(--text-primary, #333)">
                  Z = 1
                </text>
                <line x1={6} y1={20} x2={20} y2={20} stroke={ORANGE} strokeWidth={2} />
                <text x={24} y={20} dominantBaseline="middle" fontSize={8} fill="var(--text-primary, #333)">
                  Z = 0
                </text>
              </g>
            </svg>
          </div>

          {/* Panel 3: Derivative Plot (Marginal Effect with CI) */}
          <div className="sandbox-panel">
            <h5>Marginal Effect of Z (dY/dZ)</h5>
            <svg
              viewBox={`0 0 ${PW} ${PH}`}
              style={{ width: '100%', height: 'auto' }}
            >
              <rect
                x={PM.left}
                y={PM.top}
                width={INNER_W}
                height={INNER_H}
                fill="var(--bg-primary, #fff)"
                stroke="var(--border, #ccc)"
                strokeWidth={0.5}
              />
              {/* Axis labels */}
              <text
                x={PM.left}
                y={PM.top - 5}
                fontSize={9}
                fill="var(--text-secondary, #666)"
              >
                {plotData.effMax}
              </text>
              <text
                x={PM.left}
                y={PM.top + INNER_H + 10}
                fontSize={9}
                fill="var(--text-secondary, #666)"
                dominantBaseline="hanging"
              >
                {plotData.effMin}
              </text>
              <text
                x={PM.left}
                y={PM.top + INNER_H + 22}
                fontSize={9}
                fill="var(--text-secondary, #666)"
                dominantBaseline="hanging"
              >
                {plotData.xMin}
              </text>
              <text
                x={PM.left + INNER_W}
                y={PM.top + INNER_H + 22}
                fontSize={9}
                fill="var(--text-secondary, #666)"
                textAnchor="end"
                dominantBaseline="hanging"
              >
                {plotData.xMax}
              </text>
              <text
                x={PM.left + INNER_W / 2}
                y={PH - 2}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-primary, #333)"
              >
                NFC
              </text>
              <text
                x={8}
                y={PM.top + INNER_H / 2}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-primary, #333)"
                transform={`rotate(-90, 8, ${PM.top + INNER_H / 2})`}
              >
                Effect
              </text>

              <defs>
                <clipPath id="deriv-clip">
                  <rect
                    x={PM.left}
                    y={PM.top}
                    width={INNER_W}
                    height={INNER_H}
                  />
                </clipPath>
              </defs>

              <g clipPath="url(#deriv-clip)">
                {/* Significance shading regions */}
                {(() => {
                  const { boundaries, significantBelow } = plotData.jn;
                  const band = plotData.marginalBand;
                  const xMin = plotData.xMin;
                  const xMax = plotData.xMax;
                  const eMin = plotData.effMin;
                  const eMax = plotData.effMax;

                  // Build shading rectangles
                  const rects: JSX.Element[] = [];

                  if (boundaries.length === 0) {
                    // All significant or all non-significant
                    rects.push(
                      <rect
                        key="full"
                        x={PM.left}
                        y={PM.top}
                        width={INNER_W}
                        height={INNER_H}
                        fill={significantBelow ? GREEN_SIG : GRAY_NS}
                      />
                    );
                  } else if (boundaries.length === 1) {
                    const bx = scaleX(
                      Math.max(xMin, Math.min(xMax, boundaries[0])),
                      xMin,
                      xMax
                    );
                    rects.push(
                      <rect
                        key="left"
                        x={PM.left}
                        y={PM.top}
                        width={Math.max(0, bx - PM.left)}
                        height={INNER_H}
                        fill={significantBelow ? GREEN_SIG : GRAY_NS}
                      />
                    );
                    rects.push(
                      <rect
                        key="right"
                        x={bx}
                        y={PM.top}
                        width={Math.max(0, PM.left + INNER_W - bx)}
                        height={INNER_H}
                        fill={significantBelow ? GRAY_NS : GREEN_SIG}
                      />
                    );
                  } else {
                    const bx0 = scaleX(
                      Math.max(xMin, Math.min(xMax, boundaries[0])),
                      xMin,
                      xMax
                    );
                    const bx1 = scaleX(
                      Math.max(xMin, Math.min(xMax, boundaries[1])),
                      xMin,
                      xMax
                    );
                    rects.push(
                      <rect
                        key="left"
                        x={PM.left}
                        y={PM.top}
                        width={Math.max(0, bx0 - PM.left)}
                        height={INNER_H}
                        fill={significantBelow ? GREEN_SIG : GRAY_NS}
                      />
                    );
                    rects.push(
                      <rect
                        key="mid"
                        x={bx0}
                        y={PM.top}
                        width={Math.max(0, bx1 - bx0)}
                        height={INNER_H}
                        fill={significantBelow ? GRAY_NS : GREEN_SIG}
                      />
                    );
                    rects.push(
                      <rect
                        key="right"
                        x={bx1}
                        y={PM.top}
                        width={Math.max(0, PM.left + INNER_W - bx1)}
                        height={INNER_H}
                        fill={significantBelow ? GREEN_SIG : GRAY_NS}
                      />
                    );
                  }

                  // CI band polygon
                  const upperPts = band
                    .map(
                      (m) =>
                        `${scaleX(m.x, xMin, xMax)},${clampY(m.upper, eMin, eMax)}`
                    )
                    .join(' ');
                  const lowerPts = [...band]
                    .reverse()
                    .map(
                      (m) =>
                        `${scaleX(m.x, xMin, xMax)},${clampY(m.lower, eMin, eMax)}`
                    )
                    .join(' ');

                  // Effect line
                  const linePts = band
                    .map(
                      (m) =>
                        `${scaleX(m.x, xMin, xMax)},${scaleY(m.effect, eMin, eMax)}`
                    )
                    .join(' ');

                  // JN boundary vertical lines
                  const jnLines = boundaries
                    .filter((bVal) => bVal >= xMin && bVal <= xMax)
                    .map((bVal, i) => (
                      <line
                        key={`jn-${i}`}
                        x1={scaleX(bVal, xMin, xMax)}
                        y1={PM.top}
                        x2={scaleX(bVal, xMin, xMax)}
                        y2={PM.top + INNER_H}
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                      />
                    ));

                  // Zero line
                  const zeroY = scaleY(0, eMin, eMax);
                  const zeroInRange = zeroY >= PM.top && zeroY <= PM.top + INNER_H;

                  return (
                    <>
                      {rects}
                      <polygon
                        points={`${upperPts} ${lowerPts}`}
                        fill={BLUE}
                        opacity={0.15}
                      />
                      <polyline
                        points={linePts}
                        fill="none"
                        stroke={BLUE}
                        strokeWidth={1.5}
                      />
                      {zeroInRange && (
                        <line
                          x1={PM.left}
                          y1={zeroY}
                          x2={PM.left + INNER_W}
                          y2={zeroY}
                          stroke="var(--text-secondary, #999)"
                          strokeWidth={0.75}
                          strokeDasharray="3 2"
                        />
                      )}
                      {jnLines}
                    </>
                  );
                })()}
              </g>

              {/* JN label */}
              {plotData.jn.boundaries
                .filter(
                  (bVal) => bVal >= plotData.xMin && bVal <= plotData.xMax
                )
                .map((bVal, i) => (
                  <text
                    key={`jn-label-${i}`}
                    x={scaleX(bVal, plotData.xMin, plotData.xMax)}
                    y={PM.top - 2}
                    textAnchor="middle"
                    fontSize={7.5}
                    fill="#ef4444"
                    fontWeight={600}
                  >
                    JN={bVal.toFixed(1)}
                  </text>
                ))}
            </svg>
          </div>

          {/* Panel 4: Spotlight Table */}
          <div className="sandbox-panel">
            <h5>Spotlight Tests</h5>
            <table
              className="coeff-table"
              style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}
            >
              <thead>
                <tr>
                  <th>NFC</th>
                  <th>Effect</th>
                  <th>SE</th>
                  <th>
                    <em>t</em>
                  </th>
                  <th>
                    <em>p</em>
                  </th>
                  <th>Sig?</th>
                </tr>
              </thead>
              <tbody>
                {plotData.spotlightValues.map((xVal, i) => {
                  const r = plotData.spotlightResults[i];
                  const sig = r.p < 0.05;
                  return (
                    <tr key={i} className={sig ? 'highlight-row' : ''}>
                      <td>{xVal.toFixed(1)}</td>
                      <td>{r.effect.toFixed(2)}</td>
                      <td>{r.se.toFixed(2)}</td>
                      <td>{r.t.toFixed(2)}</td>
                      <td>{r.p < 0.001 ? '<.001' : r.p.toFixed(3)}</td>
                      <td
                        style={{
                          color: sig ? '#10b981' : '#9ca3af',
                          fontWeight: 600,
                        }}
                      >
                        {sig ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginTop: '0.5rem',
                lineHeight: 1.5,
              }}
            >
              Spotlight values: Mean &minus; SD ({(X_MEAN - X_SD).toFixed(2)}),
              Mean ({X_MEAN.toFixed(2)}), Mean + SD (
              {(X_MEAN + X_SD).toFixed(2)})
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginTop: '0.25rem',
                lineHeight: 1.5,
              }}
            >
              R&sup2; = {fittedModel.rSquared.toFixed(3)} | Residual SE ={' '}
              {fittedModel.residualSE.toFixed(2)} | df = {fittedModel.df}
            </p>
          </div>
        </div>
      )}

      {/* ========== Key Insight ========== */}
      <div className="key-insight">
        <h4>The Big Picture</h4>
        <p>
          All these techniques — spotlight, floodlight, the magic number zero —
          are different views of the same regression model. The interaction{' '}
          <em>d</em> tells you the lines are not parallel. Everything else is
          about understanding where and how much they diverge.
        </p>
      </div>
    </div>
  );
}
