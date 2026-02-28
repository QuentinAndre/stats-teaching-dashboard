import { useState, useMemo } from 'react';
import { generateMediationData, fitSimpleRegression, fitMultipleRegression2 } from '../../../utils/statistics';

/**
 * EquivalentModelsDemo
 *
 * Demonstrates that multiple causal orderings of three variables are
 * statistically indistinguishable when the model is just-identified
 * (saturated). Three different mediation models are fit to the same
 * data, and all produce identical overall fit because df = 0.
 *
 * The pedagogical goal is to show students that data alone cannot
 * adjudicate between competing causal stories — that requires theory,
 * temporal precedence, and experimental design.
 */

// Population parameters (same as TheThreeRegressions)
const POP_A = 0.80;
const POP_B = 0.55;
const POP_C_PRIME = 0.25;
const INTERCEPT_M = 3.80;
const INTERCEPT_Y = 1.41;
const SD_M = 1.0;
const SD_Y = 0.9;
const N = 120;

/** Small SVG path diagram for a three-variable mediation model. */
function MiniPathDiagram({
  topLabel,
  bottomLeftLabel,
  bottomRightLabel,
  topToLeftLabel,
  topToRightLabel,
  leftToRightLabel,
  leftToTopArrow,
  topToRightArrow,
  leftToRightDashed,
  id,
}: {
  topLabel: string;
  bottomLeftLabel: string;
  bottomRightLabel: string;
  topToLeftLabel: string;
  topToRightLabel: string;
  leftToRightLabel: string;
  /** If true, arrow goes from bottom-left to top. If false, from top to bottom-left. */
  leftToTopArrow: boolean;
  /** If true, arrow goes from top to bottom-right. If false, from bottom-right to top. */
  topToRightArrow: boolean;
  /** If true, the bottom left-to-right arrow is dashed. */
  leftToRightDashed: boolean;
  /** Unique ID prefix for marker defs. */
  id: string;
}) {
  // Viewbox: 200 x 160
  const boxW = 50;
  const boxH = 28;
  const boxR = 5;

  // Node centers
  const top = { x: 100, y: 30 };
  const bLeft = { x: 36, y: 128 };
  const bRight = { x: 164, y: 128 };

  const defaultColor = 'var(--text-secondary, #6b7280)';
  const dashedColor = 'var(--text-secondary, #6b7280)';

  // Compute arrow endpoints from box edge
  function edgePoint(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): { x: number; y: number } {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    const hw = boxW / 2;
    const hh = boxH / 2;
    const tanA = Math.abs(Math.tan(angle));
    let ex: number, ey: number;
    if (tanA * hw < hh) {
      ex = Math.sign(dx) * hw;
      ey = Math.sign(dx) * hw * Math.tan(angle);
    } else {
      ey = Math.sign(dy) * hh;
      ex = Math.sign(dy) * hh / Math.tan(angle);
    }
    return { x: from.x + ex, y: from.y + ey };
  }

  // Midpoint label position with perpendicular offset
  function midLabel(
    start: { x: number; y: number },
    end: { x: number; y: number },
    offset: number = -8
  ): { x: number; y: number } {
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x: mx, y: my };
    const nx = -dy / len;
    const ny = dx / len;
    return { x: mx + nx * offset, y: my + ny * offset };
  }

  // Arrow: bottom-left <-> top
  const leftTopFrom = leftToTopArrow ? bLeft : top;
  const leftTopTo = leftToTopArrow ? top : bLeft;
  const ltStart = edgePoint(leftTopFrom, leftTopTo);
  const ltEnd = edgePoint(leftTopTo, leftTopFrom);
  const ltLabel = midLabel(ltStart, ltEnd, -9);

  // Arrow: top <-> bottom-right
  const topRightFrom = topToRightArrow ? top : bRight;
  const topRightTo = topToRightArrow ? bRight : top;
  const trStart = edgePoint(topRightFrom, topRightTo);
  const trEnd = edgePoint(topRightTo, topRightFrom);
  const trLabel = midLabel(trStart, trEnd, -9);

  // Arrow: bottom-left -> bottom-right (always left-to-right, possibly dashed)
  const lrStart = edgePoint(bLeft, bRight);
  const lrEnd = edgePoint(bRight, bLeft);
  const lrLabel = midLabel(lrStart, lrEnd, -9);

  const markerId = `arrow-${id}`;

  return (
    <svg
      viewBox="0 0 200 160"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: 200, width: '100%' }}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="7"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={defaultColor} />
        </marker>
      </defs>

      {/* Arrow: left <-> top */}
      <line
        x1={ltStart.x} y1={ltStart.y}
        x2={ltEnd.x} y2={ltEnd.y}
        stroke={defaultColor}
        strokeWidth={1.5}
        markerEnd={`url(#${markerId})`}
      />
      <text
        x={ltLabel.x} y={ltLabel.y}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fontStyle="italic"
        fill="var(--text-primary, #333)"
      >
        {topToLeftLabel}
      </text>

      {/* Arrow: top <-> right */}
      <line
        x1={trStart.x} y1={trStart.y}
        x2={trEnd.x} y2={trEnd.y}
        stroke={defaultColor}
        strokeWidth={1.5}
        markerEnd={`url(#${markerId})`}
      />
      <text
        x={trLabel.x} y={trLabel.y}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fontStyle="italic"
        fill="var(--text-primary, #333)"
      >
        {topToRightLabel}
      </text>

      {/* Arrow: left -> right */}
      <line
        x1={lrStart.x} y1={lrStart.y}
        x2={lrEnd.x} y2={lrEnd.y}
        stroke={dashedColor}
        strokeWidth={1.5}
        strokeDasharray={leftToRightDashed ? '5,3' : undefined}
        markerEnd={`url(#${markerId})`}
      />
      <text
        x={lrLabel.x} y={lrLabel.y}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fontStyle="italic"
        fill="var(--text-primary, #333)"
      >
        {leftToRightLabel}
      </text>

      {/* Top box */}
      <rect
        x={top.x - boxW / 2} y={top.y - boxH / 2}
        width={boxW} height={boxH}
        rx={boxR}
        fill="var(--bg-primary, #fff)"
        stroke="var(--border, #d1d5db)"
        strokeWidth={1.5}
      />
      <text
        x={top.x} y={top.y + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={13} fontWeight={700}
        fill="var(--text-primary, #333)"
      >
        {topLabel}
      </text>

      {/* Bottom-left box */}
      <rect
        x={bLeft.x - boxW / 2} y={bLeft.y - boxH / 2}
        width={boxW} height={boxH}
        rx={boxR}
        fill="var(--bg-primary, #fff)"
        stroke="var(--border, #d1d5db)"
        strokeWidth={1.5}
      />
      <text
        x={bLeft.x} y={bLeft.y + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={13} fontWeight={700}
        fill="var(--text-primary, #333)"
      >
        {bottomLeftLabel}
      </text>

      {/* Bottom-right box */}
      <rect
        x={bRight.x - boxW / 2} y={bRight.y - boxH / 2}
        width={boxW} height={boxH}
        rx={boxR}
        fill="var(--bg-primary, #fff)"
        stroke="var(--border, #d1d5db)"
        strokeWidth={1.5}
      />
      <text
        x={bRight.x} y={bRight.y + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={13} fontWeight={700}
        fill="var(--text-primary, #333)"
      >
        {bottomRightLabel}
      </text>
    </svg>
  );
}

export default function EquivalentModelsDemo() {
  const [seed, setSeed] = useState(77);

  const results = useMemo(() => {
    const data = generateMediationData(
      seed, N, POP_A, POP_B, POP_C_PRIME,
      INTERCEPT_M, INTERCEPT_Y, SD_M, SD_Y
    );

    // ---- Model A: X → M → Y (standard mediation) ----
    // Eq 1: M ~ X → a-path
    const modelA_eq1 = fitSimpleRegression(data.m, data.x);
    // Eq 2: Y ~ X + M → c', b
    const modelA_eq2 = fitMultipleRegression2(data.y, data.x, data.m);
    const modelA_indirect = modelA_eq1.slope * modelA_eq2.b2;

    // ---- Model B: X → Y → M (Y mediates X→M) ----
    // Eq 1: Y ~ X
    const modelB_eq1 = fitSimpleRegression(data.y, data.x);
    // Eq 2: M ~ X + Y
    const modelB_eq2 = fitMultipleRegression2(data.m, data.x, data.y);
    const modelB_indirect = modelB_eq1.slope * modelB_eq2.b2;

    // ---- Model C: M → X → Y (M causes X causes Y) ----
    // Eq 1: X ~ M
    const modelC_eq1 = fitSimpleRegression(data.x, data.m);
    // Eq 2: Y ~ M + X
    const modelC_eq2 = fitMultipleRegression2(data.y, data.m, data.x);
    const modelC_indirect = modelC_eq1.slope * modelC_eq2.b2;

    return {
      modelA: { eq1: modelA_eq1, eq2: modelA_eq2, indirect: modelA_indirect },
      modelB: { eq1: modelB_eq1, eq2: modelB_eq2, indirect: modelB_indirect },
      modelC: { eq1: modelC_eq1, eq2: modelC_eq2, indirect: modelC_indirect },
    };
  }, [seed]);

  const { modelA, modelB, modelC } = results;

  return (
    <div className="section-intro">
      <h2>Equivalent Models</h2>

      <p className="intro-text">
        With three variables and all paths estimated, the model is{' '}
        <strong>just-identified</strong> (saturated). This means it has zero
        degrees of freedom for testing model fit — the model fits the data
        perfectly regardless of which causal ordering you specify. The data
        cannot distinguish between competing causal stories.
      </p>

      <p className="intro-text">
        To see this concretely, we fit three different mediation models to the
        same sample of <em>n</em> = {N} observations. Each model proposes a
        different causal ordering of X, M, and Y, but all three use the same
        two-equation structure: a simple regression for the first link and a
        multiple regression for the second.
      </p>

      {/* ---- Triple-panel path diagrams ---- */}
      <div className="triple-panel">
        {/* Model A: X → M → Y */}
        <div className="comparison-panel">
          <h5>Model A: X &rarr; M &rarr; Y</h5>
          <div className="path-diagram-container">
            <MiniPathDiagram
              id="modelA"
              topLabel="M"
              bottomLeftLabel="X"
              bottomRightLabel="Y"
              leftToTopArrow={true}
              topToRightArrow={true}
              leftToRightDashed={true}
              topToLeftLabel="a"
              topToRightLabel="b"
              leftToRightLabel="c'"
            />
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: 'var(--spacing-xs) 0 0 0',
          }}>
            Indirect = <em>a</em> &times; <em>b</em> = {modelA.indirect.toFixed(3)}
          </p>
        </div>

        {/* Model B: X → Y → M */}
        <div className="comparison-panel">
          <h5>Model B: X &rarr; Y &rarr; M</h5>
          <div className="path-diagram-container">
            <MiniPathDiagram
              id="modelB"
              topLabel="Y"
              bottomLeftLabel="X"
              bottomRightLabel="M"
              leftToTopArrow={true}
              topToRightArrow={true}
              leftToRightDashed={true}
              topToLeftLabel={modelB.eq1.slope.toFixed(2)}
              topToRightLabel={modelB.eq2.b2.toFixed(2)}
              leftToRightLabel={modelB.eq2.b1.toFixed(2)}
            />
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: 'var(--spacing-xs) 0 0 0',
          }}>
            Indirect = {modelB.eq1.slope.toFixed(2)} &times; {modelB.eq2.b2.toFixed(2)} = {modelB.indirect.toFixed(3)}
          </p>
        </div>

        {/* Model C: M → X → Y */}
        <div className="comparison-panel">
          <h5>Model C: M &rarr; X &rarr; Y</h5>
          <div className="path-diagram-container">
            <MiniPathDiagram
              id="modelC"
              topLabel="X"
              bottomLeftLabel="M"
              bottomRightLabel="Y"
              leftToTopArrow={true}
              topToRightArrow={true}
              leftToRightDashed={true}
              topToLeftLabel={modelC.eq1.slope.toFixed(2)}
              topToRightLabel={modelC.eq2.b2.toFixed(2)}
              leftToRightLabel={modelC.eq2.b1.toFixed(2)}
            />
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: 'var(--spacing-xs) 0 0 0',
          }}>
            Indirect = {modelC.eq1.slope.toFixed(2)} &times; {modelC.eq2.b2.toFixed(2)} = {modelC.indirect.toFixed(3)}
          </p>
        </div>
      </div>

      <p className="intro-text">
        Model A is the standard mediation model from the earlier sections.
        Model B reverses the mediator and outcome: it claims that X affects Y
        first, and that Y in turn affects M. Model C places M as the cause of
        X — obviously incorrect in our scenario because X was randomly assigned,
        but the data cannot tell you that.
      </p>

      {/* ---- Fit statistics table ---- */}
      <div className="viz-container">
        <h4>Fit Statistics Across the Three Models</h4>
        <table className="coeff-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Model</th>
              <th>R&sup2; (Eq 1)</th>
              <th>R&sup2; (Eq 2)</th>
              <th>Indirect Effect</th>
              <th>df for Model Comparison</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left' }}>A: X &rarr; M &rarr; Y</td>
              <td>{modelA.eq1.rSquared.toFixed(4)}</td>
              <td>{modelA.eq2.rSquared.toFixed(4)}</td>
              <td>{modelA.indirect.toFixed(4)}</td>
              <td>0</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>B: X &rarr; Y &rarr; M</td>
              <td>{modelB.eq1.rSquared.toFixed(4)}</td>
              <td>{modelB.eq2.rSquared.toFixed(4)}</td>
              <td>{modelB.indirect.toFixed(4)}</td>
              <td>0</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'left' }}>C: M &rarr; X &rarr; Y</td>
              <td>{modelC.eq1.rSquared.toFixed(4)}</td>
              <td>{modelC.eq2.rSquared.toFixed(4)}</td>
              <td>{modelC.indirect.toFixed(4)}</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="intro-text">
        Notice that the individual R&sup2; values from each equation differ
        across models — the equations are predicting different outcome
        variables, so this is expected. But the critical point is in the last
        column: all three models have zero degrees of freedom for comparing
        model fit. A just-identified model reproduces every observed
        correlation perfectly. There is no residual misfit to use as evidence
        against any of the three causal orderings. The indirect effects also
        differ in magnitude across models, but all three are computed from the
        same set of correlations, just partitioned differently.
      </p>

      {/* ---- Regenerate button ---- */}
      <div className="controls-row">
        <button
          className="generate-button"
          onClick={() => setSeed((s) => s + 1)}
        >
          Regenerate Sample
        </button>
      </div>

      <div className="key-insight">
        <h4>Theory, Not Data, Chooses the Model</h4>
        <p>
          All three models fit the data equally well. The choice between them
          is not a statistical question — it is a theoretical one. Temporal
          precedence (X must come before M in time) and experimental design
          (randomly assigning X) provide the strongest basis for preferring one
          model over another. This is why Rohrer et al. (2022) emphasize that
          every arrow is a causal claim that must be justified by design, not
          by data.
        </p>
      </div>
    </div>
  );
}
