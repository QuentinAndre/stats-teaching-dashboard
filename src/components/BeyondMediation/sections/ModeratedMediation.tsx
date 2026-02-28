/**
 * ModeratedMediation
 *
 * Conceptual introduction to moderated mediation (conditional indirect
 * effects). Covers first-stage moderation (PROCESS Model 7) and
 * second-stage moderation (PROCESS Model 14), with SVG path diagrams
 * showing each model's structure.
 *
 * Non-interactive — the goal is to give students a clear mental model
 * of how moderation and mediation combine, and to highlight that
 * conditional indirect effects require even more assumptions than
 * simple mediation.
 */

/** Arrowhead marker definition. */
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

/**
 * First-stage moderated mediation diagram (PROCESS Model 7).
 * W moderates the X → M path (the a-path).
 */
function FirstStageDiagram() {
  const boxW = 70;
  const boxH = 36;
  const arrowColor = 'var(--text-secondary, #6b7280)';
  const modColor = 'var(--primary, #4361ee)';
  const arrowId = 'arrow-first-stage';

  // viewBox 420 x 240 — X and Y on bottom row, M top-center, W top-left
  const X = { x: 60, y: 190 };
  const M = { x: 210, y: 60 };
  const Y = { x: 360, y: 190 };
  const W = { x: 50, y: 60 };

  // Interaction point: midpoint of X→M path
  const xToMStart = edgePoint(X, M, boxW, boxH);
  const xToMEnd = edgePoint(M, X, boxW, boxH);
  const interactionPt = {
    x: (xToMStart.x + xToMEnd.x) / 2,
    y: (xToMStart.y + xToMEnd.y) / 2,
  };

  return (
    <svg
      viewBox="0 0 420 240"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: 420, width: '100%' }}
    >
      <ArrowDefs id={arrowId} color={arrowColor} />
      <defs>
        <marker
          id={`${arrowId}-mod`}
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={modColor} />
        </marker>
      </defs>

      {/* X → M (a-path) — label on right side to avoid W arrow */}
      <Arrow
        from={X} to={M}
        boxW={boxW} boxH={boxH}
        label="a" markerId={arrowId}
        color={arrowColor} labelOffset={12}
      />
      {/* M → Y (b-path) */}
      <Arrow
        from={M} to={Y}
        boxW={boxW} boxH={boxH}
        label="b" markerId={arrowId}
        color={arrowColor} labelOffset={-12}
      />
      {/* X → Y (c', dashed) — label below line */}
      <Arrow
        from={X} to={Y}
        boxW={boxW} boxH={boxH}
        label="c'" markerId={arrowId}
        color={arrowColor} dashed={true}
        labelOffset={14}
      />

      {/* W → interaction point on a-path (moderation arrow) */}
      <line
        x1={W.x + boxW / 2}
        y1={W.y + 6}
        x2={interactionPt.x - 6}
        y2={interactionPt.y - 2}
        stroke={modColor}
        strokeWidth={2}
        markerEnd={`url(#${arrowId}-mod)`}
      />
      {/* Small circle at interaction point */}
      <circle
        cx={interactionPt.x}
        cy={interactionPt.y}
        r={4}
        fill={modColor}
      />

      {/* Boxes */}
      <Box center={X} label="X" w={boxW} h={boxH} />
      <Box center={M} label="M" w={boxW} h={boxH} />
      <Box center={Y} label="Y" w={boxW} h={boxH} />

      {/* W box with moderator styling */}
      <rect
        x={W.x - boxW / 2} y={W.y - boxH / 2}
        width={boxW} height={boxH}
        rx={6}
        fill="var(--bg-primary, #fff)"
        stroke={modColor}
        strokeWidth={2}
      />
      <text
        x={W.x} y={W.y + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight={700}
        fill={modColor}
      >
        W
      </text>
    </svg>
  );
}

/**
 * Second-stage moderated mediation diagram (PROCESS Model 14).
 * W moderates the M → Y path (the b-path).
 */
function SecondStageDiagram() {
  const boxW = 70;
  const boxH = 36;
  const arrowColor = 'var(--text-secondary, #6b7280)';
  const modColor = 'var(--primary, #4361ee)';
  const arrowId = 'arrow-second-stage';

  // viewBox 420 x 240 — X and Y on bottom row, M top-center, W top-right
  const X = { x: 60, y: 190 };
  const M = { x: 210, y: 60 };
  const Y = { x: 360, y: 190 };
  const W = { x: 370, y: 60 };

  // Interaction point: midpoint of M→Y path
  const mToYStart = edgePoint(M, Y, boxW, boxH);
  const mToYEnd = edgePoint(Y, M, boxW, boxH);
  const interactionPt = {
    x: (mToYStart.x + mToYEnd.x) / 2,
    y: (mToYStart.y + mToYEnd.y) / 2,
  };

  return (
    <svg
      viewBox="0 0 420 240"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: 420, width: '100%' }}
    >
      <ArrowDefs id={arrowId} color={arrowColor} />
      <defs>
        <marker
          id={`${arrowId}-mod`}
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={modColor} />
        </marker>
      </defs>

      {/* X → M (a-path) */}
      <Arrow
        from={X} to={M}
        boxW={boxW} boxH={boxH}
        label="a" markerId={arrowId}
        color={arrowColor} labelOffset={-12}
      />
      {/* M → Y (b-path) — label on left side to avoid W arrow */}
      <Arrow
        from={M} to={Y}
        boxW={boxW} boxH={boxH}
        label="b" markerId={arrowId}
        color={arrowColor} labelOffset={12}
      />
      {/* X → Y (c', dashed) — label below line */}
      <Arrow
        from={X} to={Y}
        boxW={boxW} boxH={boxH}
        label="c'" markerId={arrowId}
        color={arrowColor} dashed={true}
        labelOffset={14}
      />

      {/* W → interaction point on b-path (moderation arrow) */}
      <line
        x1={W.x - boxW / 2}
        y1={W.y + 6}
        x2={interactionPt.x + 6}
        y2={interactionPt.y - 2}
        stroke={modColor}
        strokeWidth={2}
        markerEnd={`url(#${arrowId}-mod)`}
      />
      {/* Small circle at interaction point */}
      <circle
        cx={interactionPt.x}
        cy={interactionPt.y}
        r={4}
        fill={modColor}
      />

      {/* Boxes */}
      <Box center={X} label="X" w={boxW} h={boxH} />
      <Box center={M} label="M" w={boxW} h={boxH} />
      <Box center={Y} label="Y" w={boxW} h={boxH} />

      {/* W box with moderator styling */}
      <rect
        x={W.x - boxW / 2} y={W.y - boxH / 2}
        width={boxW} height={boxH}
        rx={6}
        fill="var(--bg-primary, #fff)"
        stroke={modColor}
        strokeWidth={2}
      />
      <text
        x={W.x} y={W.y + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fontWeight={700}
        fill={modColor}
      >
        W
      </text>
    </svg>
  );
}

export default function ModeratedMediation() {
  return (
    <div className="section-intro">
      <h2>Moderated Mediation</h2>

      <p className="intro-text">
        Simple mediation asks whether X affects Y through M. But what if the
        indirect effect is stronger for some people than for others? When a
        moderator variable W changes the <em>size</em> of the indirect effect,
        we have <strong>moderated mediation</strong> — also called{' '}
        <strong>conditional indirect effects</strong>. The indirect effect is
        no longer a single number; it is a function of W.
      </p>

      <p className="intro-text">
        Hayes (2015) formalized this idea through the <strong>index of
        moderated mediation</strong>, a quantity that tests whether the
        indirect effect changes linearly as W increases. If the bootstrap
        confidence interval for this index excludes zero, the strength of
        mediation depends on the level of the moderator.
      </p>

      <h3>Where Can Moderation Enter?</h3>

      <p className="intro-text">
        Moderation can enter the mediation model at two points: the first
        stage (X &rarr; M) or the second stage (M &rarr; Y). These correspond
        to different theoretical claims about where in the causal chain the
        moderator has its influence.
      </p>

      {/* ---- Dual-panel diagrams ---- */}
      <div className="dual-panel">
        <div className="comparison-panel">
          <h5>First-Stage Moderation (PROCESS Model 7)</h5>
          <div className="path-diagram-container">
            <FirstStageDiagram />
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: 'var(--spacing-xs) 0 0 0',
            lineHeight: 1.6,
          }}>
            Conditional indirect effect:{' '}
            <em>a</em>(W) &times; <em>b</em>
          </p>
        </div>

        <div className="comparison-panel">
          <h5>Second-Stage Moderation (PROCESS Model 14)</h5>
          <div className="path-diagram-container">
            <SecondStageDiagram />
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: 'var(--spacing-xs) 0 0 0',
            lineHeight: 1.6,
          }}>
            Conditional indirect effect:{' '}
            <em>a</em> &times; <em>b</em>(W)
          </p>
        </div>
      </div>

      <h3>First-Stage Moderation (Model 7)</h3>

      <p className="intro-text">
        In first-stage moderation, W changes the strength of the <em>a</em>-path.
        The effect of X on M depends on W. The mediation equation for M becomes:
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">
            M = <em>i</em><sub>M</sub> + <em>a</em><sub>1</sub> &middot; X
            + <em>a</em><sub>2</sub> &middot; W
            + <em>a</em><sub>3</sub> &middot; X &middot; W
          </span>
        </div>
        <div className="formula" style={{ marginTop: 'var(--spacing-sm)' }}>
          <span className="formula-main" style={{ fontSize: '1rem' }}>
            Conditional indirect effect = (<em>a</em><sub>1</sub> + <em>a</em><sub>3</sub> &middot; W) &times; <em>b</em>
          </span>
        </div>
      </div>

      <p className="intro-text">
        The indirect effect is now (<em>a</em><sub>1</sub> + <em>a</em><sub>3</sub>W)
        &times; <em>b</em>, which changes as W changes. The
        coefficient <em>a</em><sub>3</sub> captures the interaction between X
        and W in predicting M. When <em>a</em><sub>3</sub> is positive, the
        indirect effect grows stronger at higher levels of W.
      </p>

      <h3>Second-Stage Moderation (Model 14)</h3>

      <p className="intro-text">
        In second-stage moderation, W changes the strength of the <em>b</em>-path.
        The effect of M on Y (controlling for X) depends on W. The outcome
        equation becomes:
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">
            Y = <em>i</em><sub>Y</sub> + <em>c'</em> &middot; X
            + <em>b</em><sub>1</sub> &middot; M
            + <em>b</em><sub>2</sub> &middot; W
            + <em>b</em><sub>3</sub> &middot; M &middot; W
          </span>
        </div>
        <div className="formula" style={{ marginTop: 'var(--spacing-sm)' }}>
          <span className="formula-main" style={{ fontSize: '1rem' }}>
            Conditional indirect effect = <em>a</em> &times; (<em>b</em><sub>1</sub> + <em>b</em><sub>3</sub> &middot; W)
          </span>
        </div>
      </div>

      <p className="intro-text">
        Here the indirect effect is <em>a</em> &times;
        (<em>b</em><sub>1</sub> + <em>b</em><sub>3</sub>W). The <em>a</em>-path
        is constant across levels of W, but the <em>b</em>-path — and
        therefore the indirect effect — varies. This model answers the
        question: for whom does the mediator transmit more or less of the
        effect of X onto Y?
      </p>

      <h3>The Index of Moderated Mediation</h3>

      <p className="intro-text">
        For both models, Hayes (2015) defines the <strong>index of moderated
        mediation</strong> as the rate at which the conditional indirect effect
        changes per unit increase in W. For first-stage moderation, this
        index is <em>a</em><sub>3</sub> &times; <em>b</em>. For second-stage
        moderation, it is <em>a</em> &times; <em>b</em><sub>3</sub>. A
        bootstrap confidence interval for the index that excludes zero
        provides evidence that the indirect effect is moderated.
      </p>

      <div className="key-insight">
        <h4>Conditional Process Analysis</h4>
        <p>
          Moderated mediation is part of what Hayes calls{' '}
          <em>conditional process analysis</em> — models that combine
          mediation and moderation to ask when and for whom a process occurs.
          PROCESS provides many numbered model templates (Models 7, 8, 14, 15,
          58, 59, etc.) that place the moderator at different points in the
          model. All of them share the same core logic: the indirect effect
          becomes a function of the moderator, and inference relies on
          bootstrapping the conditional indirect effect at specified values of W.
        </p>
      </div>

      <div className="warning-insight">
        <h4>Causal Assumptions Multiply Further</h4>
        <p>
          Every causal pitfall from simple mediation applies here with even
          greater force. Moderated mediation adds an interaction term, which
          requires not only that the individual paths are unconfounded, but
          also that the moderator is not itself caused by X or confounded with
          the mediator. As models grow more complex, the gap between
          statistical significance and causal evidence widens. A significant
          index of moderated mediation means the conditional indirect effect
          varies with W in the sample — it does not establish that the
          moderation is causal.
        </p>
      </div>
    </div>
  );
}
