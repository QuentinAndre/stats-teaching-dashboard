/**
 * BeyondSimpleMediation
 *
 * A non-interactive preview section that introduces parallel and serial
 * mediation models. Two hand-coded SVG path diagrams illustrate the
 * structure of each model. No data generation or interactive controls —
 * the goal is to give students a conceptual map of where simple mediation
 * leads, and to reinforce that every additional arrow is an additional
 * causal assumption.
 */

/** Arrowhead marker definition shared across both diagrams. */
function ArrowDefs({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 7"
        refX="10"
        refY="3.5"
        markerWidth="8"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill={color} />
      </marker>
      <marker
        id={`${id}-dashed`}
        viewBox="0 0 10 7"
        refX="10"
        refY="3.5"
        markerWidth="8"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill={color} />
      </marker>
    </defs>
  );
}

/** Compute the point where a line from `from` exits a rectangle centered at `from`. */
function edgePoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  w: number,
  h: number
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const hw = w / 2;
  const hh = h / 2;
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

/** Compute a label position at the midpoint of a line, offset perpendicularly. */
function midLabel(
  start: { x: number; y: number },
  end: { x: number; y: number },
  offset: number = -10
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

/** Render an arrow line between two nodes with an optional label. */
function Arrow({
  from,
  to,
  boxW,
  boxH,
  label,
  markerId,
  color,
  dashed = false,
  labelOffset = -10,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  boxW: number;
  boxH: number;
  label?: string;
  markerId: string;
  color: string;
  dashed?: boolean;
  labelOffset?: number;
}) {
  const start = edgePoint(from, to, boxW, boxH);
  const end = edgePoint(to, from, boxW, boxH);
  const lbl = midLabel(start, end, labelOffset);

  return (
    <g>
      <line
        x1={start.x} y1={start.y}
        x2={end.x} y2={end.y}
        stroke={color}
        strokeWidth={1.8}
        strokeDasharray={dashed ? '6,4' : undefined}
        markerEnd={`url(#${markerId})`}
      />
      {label && (
        <text
          x={lbl.x} y={lbl.y}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fontStyle="italic"
          fill="var(--text-primary, #333)"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Render a rounded-rect box with a label centered inside. */
function Box({
  center,
  label,
  w,
  h,
  r = 6,
}: {
  center: { x: number; y: number };
  label: string;
  w: number;
  h: number;
  r?: number;
}) {
  return (
    <g>
      <rect
        x={center.x - w / 2} y={center.y - h / 2}
        width={w} height={h}
        rx={r}
        fill="var(--bg-primary, #fff)"
        stroke="var(--border, #d1d5db)"
        strokeWidth={1.5}
      />
      <text
        x={center.x} y={center.y + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight={700}
        fill="var(--text-primary, #333)"
      >
        {label}
      </text>
    </g>
  );
}

/** Parallel mediation diagram (PROCESS Model 4 with two mediators). */
function ParallelMediationDiagram() {
  const boxW = 70;
  const boxH = 36;
  const arrowColor = 'var(--text-secondary, #6b7280)';
  const arrowId = 'arrow-parallel';

  // Node positions within 340 x 220 viewBox
  const X = { x: 50, y: 110 };
  const M1 = { x: 170, y: 40 };
  const M2 = { x: 170, y: 180 };
  const Y = { x: 290, y: 110 };

  return (
    <svg
      viewBox="0 0 340 220"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: 340, width: '100%' }}
    >
      <ArrowDefs id={arrowId} color={arrowColor} />

      {/* X → M1 (a1) */}
      <Arrow
        from={X} to={M1}
        boxW={boxW} boxH={boxH}
        label="a₁" markerId={arrowId}
        color={arrowColor} labelOffset={-11}
      />
      {/* X → M2 (a2) */}
      <Arrow
        from={X} to={M2}
        boxW={boxW} boxH={boxH}
        label="a₂" markerId={arrowId}
        color={arrowColor} labelOffset={11}
      />
      {/* M1 → Y (b1) */}
      <Arrow
        from={M1} to={Y}
        boxW={boxW} boxH={boxH}
        label="b₁" markerId={arrowId}
        color={arrowColor} labelOffset={-11}
      />
      {/* M2 → Y (b2) */}
      <Arrow
        from={M2} to={Y}
        boxW={boxW} boxH={boxH}
        label="b₂" markerId={arrowId}
        color={arrowColor} labelOffset={11}
      />
      {/* X → Y (c', dashed) — label pushed below to avoid M₁/M₂ overlap */}
      <Arrow
        from={X} to={Y}
        boxW={boxW} boxH={boxH}
        label="c'" markerId={arrowId}
        color={arrowColor} dashed={true}
        labelOffset={12}
      />

      {/* Boxes (drawn last so they sit on top of arrow lines) */}
      <Box center={X} label="X" w={boxW} h={boxH} />
      <Box center={M1} label="M₁" w={boxW} h={boxH} />
      <Box center={M2} label="M₂" w={boxW} h={boxH} />
      <Box center={Y} label="Y" w={boxW} h={boxH} />
    </svg>
  );
}

/** Serial mediation diagram (PROCESS Model 6).
 *  Horizontal chain layout: X → M₁ → M₂ → Y
 *  with direct paths X→M₂, M₁→Y, X→Y shown below the main chain.
 */
function SerialMediationDiagram() {
  const boxW = 70;
  const boxH = 36;
  const arrowColor = 'var(--text-secondary, #6b7280)';
  const arrowId = 'arrow-serial';

  // Horizontal chain layout within 460 x 180 viewBox
  const X  = { x: 55, y: 50 };
  const M1 = { x: 185, y: 50 };
  const M2 = { x: 315, y: 50 };
  const Y  = { x: 445, y: 50 };

  return (
    <svg
      viewBox="0 0 500 250"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: 500, width: '100%' }}
    >
      <ArrowDefs id={arrowId} color={arrowColor} />

      {/* Main chain: X → M1 → M2 → Y (top row) */}
      <Arrow
        from={X} to={M1}
        boxW={boxW} boxH={boxH}
        label="a₁" markerId={arrowId}
        color={arrowColor} labelOffset={-12}
      />
      <Arrow
        from={M1} to={M2}
        boxW={boxW} boxH={boxH}
        label="d₂₁" markerId={arrowId}
        color={arrowColor} labelOffset={-12}
      />
      <Arrow
        from={M2} to={Y}
        boxW={boxW} boxH={boxH}
        label="b₂" markerId={arrowId}
        color={arrowColor} labelOffset={-12}
      />

      {/* Curved path: X → M2 (a2) — first tier below boxes */}
      {(() => {
        const start = edgePoint(X, { x: X.x, y: X.y + 80 }, boxW, boxH);
        const end = edgePoint(M2, { x: M2.x, y: M2.y + 80 }, boxW, boxH);
        const cy = 120;
        return (
          <g>
            <path
              d={`M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${cy} ${end.x} ${end.y}`}
              fill="none"
              stroke={arrowColor}
              strokeWidth={1.8}
              markerEnd={`url(#${arrowId})`}
            />
            <text
              x={(start.x + end.x) / 2}
              y={cy + 5}
              textAnchor="middle"
              fontSize={12} fontWeight={600} fontStyle="italic"
              fill="var(--text-primary, #333)"
            >
              a₂
            </text>
          </g>
        );
      })()}

      {/* Curved path: M1 → Y (b1) — second tier, deeper */}
      {(() => {
        const start = edgePoint(M1, { x: M1.x, y: M1.y + 120 }, boxW, boxH);
        const end = edgePoint(Y, { x: Y.x, y: Y.y + 120 }, boxW, boxH);
        const cy = 165;
        return (
          <g>
            <path
              d={`M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${cy} ${end.x} ${end.y}`}
              fill="none"
              stroke={arrowColor}
              strokeWidth={1.8}
              markerEnd={`url(#${arrowId})`}
            />
            <text
              x={(start.x + end.x) / 2}
              y={cy + 5}
              textAnchor="middle"
              fontSize={12} fontWeight={600} fontStyle="italic"
              fill="var(--text-primary, #333)"
            >
              b₁
            </text>
          </g>
        );
      })()}

      {/* Curved path: X → Y (c', dashed) — third tier, deepest */}
      {(() => {
        const start = edgePoint(X, { x: X.x, y: X.y + 160 }, boxW, boxH);
        const end = edgePoint(Y, { x: Y.x, y: Y.y + 160 }, boxW, boxH);
        const cy = 215;
        return (
          <g>
            <path
              d={`M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${cy} ${end.x} ${end.y}`}
              fill="none"
              stroke={arrowColor}
              strokeWidth={1.8}
              strokeDasharray="6,4"
              markerEnd={`url(#${arrowId})`}
            />
            <text
              x={(start.x + end.x) / 2}
              y={cy + 5}
              textAnchor="middle"
              fontSize={12} fontWeight={600} fontStyle="italic"
              fill="var(--text-primary, #333)"
            >
              c&apos;
            </text>
          </g>
        );
      })()}

      {/* Boxes (drawn last so they sit on top of arrow lines) */}
      <Box center={X} label="X" w={boxW} h={boxH} />
      <Box center={M1} label="M₁" w={boxW} h={boxH} />
      <Box center={M2} label="M₂" w={boxW} h={boxH} />
      <Box center={Y} label="Y" w={boxW} h={boxH} />
    </svg>
  );
}

export default function BeyondSimpleMediation() {
  return (
    <div className="section-intro">
      <h2>Multiple Mediator Models</h2>

      <p className="intro-text">
        The simple mediation model (one mediator, PROCESS Model 4) is a starting
        point. Researchers frequently propose models with multiple mediators
        operating in parallel or in series. These extensions follow the same
        statistical logic — bootstrapping to test indirect effects — but they
        multiply the causal assumptions required.
      </p>

      {/* ---- Dual-panel diagrams ---- */}
      <div className="dual-panel">
        <div className="comparison-panel">
          <h5>Parallel Mediation (PROCESS Model 4, 2 mediators)</h5>
          <div className="path-diagram-container">
            <ParallelMediationDiagram />
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: 'var(--spacing-xs) 0 0 0',
            lineHeight: 1.6,
          }}>
            Two independent indirect paths:{' '}
            <em>a</em><sub>1</sub><em>b</em><sub>1</sub> and{' '}
            <em>a</em><sub>2</sub><em>b</em><sub>2</sub>
          </p>
        </div>

        <div className="comparison-panel">
          <h5>Serial Mediation (PROCESS Model 6)</h5>
          <div className="path-diagram-container">
            <SerialMediationDiagram />
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: 'var(--spacing-xs) 0 0 0',
            lineHeight: 1.6,
          }}>
            Serial indirect effect:{' '}
            <em>a</em><sub>1</sub> &times;{' '}
            <em>d</em><sub>21</sub> &times;{' '}
            <em>b</em><sub>2</sub>
          </p>
        </div>
      </div>

      <h3>Parallel Mediation</h3>

      <p className="intro-text">
        Parallel mediation tests whether X affects Y through multiple
        independent mediators simultaneously. Each indirect
        path (X &rarr; M<sub>1</sub> &rarr; Y and
        X &rarr; M<sub>2</sub> &rarr; Y) is bootstrapped separately. The
        specific indirect effects can be contrasted to test whether one
        mediator carries more of the effect than the other.
      </p>

      <h3>Serial Mediation</h3>

      <p className="intro-text">
        Serial mediation tests a causal chain where X affects M<sub>1</sub>,
        which affects M<sub>2</sub>, which affects Y. The serial indirect
        effect is the product of three path
        coefficients: <em>a</em><sub>1</sub> &times; <em>d</em><sub>21</sub> &times; <em>b</em><sub>2</sub>.
      </p>

      <div className="warning-insight">
        <h4>More Arrows, More Assumptions</h4>
        <p>
          All the causal pitfalls from the previous module apply with even
          greater force to these extended models. Each additional arrow is an
          additional causal claim requiring its own justification. A parallel
          mediation model with two mediators has four causal paths that must
          all be unconfounded. A serial mediation model requires, in addition,
          that the M<sub>1</sub> &rarr; M<sub>2</sub> path is unconfounded —
          and adjusting for M<sub>1</sub> when estimating M<sub>2</sub>'s
          effect introduces the same collider bias issues discussed earlier.
        </p>
      </div>
    </div>
  );
}
